"use client";

import { useMemo, useState } from "react";
import { geoCentroid, geoContains, geoMercator, geoPath } from "d3-geo";
import { feature as topoFeature } from "topojson-client";
import type { GeoJsonObject } from "geojson";
import { CaretLeft, MagnifyingGlassMinus, MagnifyingGlassPlus } from "@phosphor-icons/react";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import worldAtlas from "world-atlas/countries-50m.json";
import type { GeoAggregate, VisitSummary } from "@/lib/admin/analytics";
import { matchCountryName } from "@/lib/analytics/country-match";
import { matchGeoBoundaryShape } from "@/lib/analytics/geo-match";
import { COUNTRY_ISO3 } from "@/lib/analytics/country-iso3";
import { getGeoBoundariesAction, type GeoBoundaryFeature } from "./actions";
import { glassCard, glassIconButton } from "../../glass";

/** react-simple-maps' <Geographies geography> accepts a raw TopoJSON
 * Topology directly (it runs topojson-client internally) — this cast is
 * only needed because a plain JSON import widens "Topology" to `string`,
 * not because the shape is actually wrong; verified against the
 * library's own source (Geographies picks e.objects[Object.keys(e.
 * objects)[0]], which for world-atlas is "countries" — the first key). */
const WORLD_TOPOLOGY = worldAtlas as unknown as GeoJsonObject;

/** -50m (not -110m) deliberately — see country-match.ts's own comment:
 * the lower-resolution variant omits small-but-real countries this
 * MENA-focused store plausibly gets traffic from (Bahrain, Qatar-
 * adjacent Gulf states, etc). Admin-only page, so the extra ~650KB
 * doesn't touch the storefront bundle. */
const COUNTRIES = worldAtlas.objects.countries.geometries;
const WORLD_ATLAS_NAMES = new Set(COUNTRIES.map((g) => (g.properties as { name: string }).name));

/** Reverse of COUNTRY_ISO3, resolved through the same name-matcher the
 * world map already shades by — built once at module load, not per
 * render, since both inputs are static. */
const NAME_TO_ALPHA2 = new Map<string, string>(
  Object.keys(COUNTRY_ISO3)
    .map((alpha2) => [matchCountryName(alpha2, WORLD_ATLAS_NAMES), alpha2] as const)
    .filter((pair): pair is [string, string] => Boolean(pair[0])),
);

/** world-atlas ships correctly-wound geometry already (verified: Iraq's
 * geoArea comes back as a small, sane number, not 4π — unlike
 * geoBoundaries' raw data, see rewind-geometry.ts) — no rewind needed
 * here, only real-GeoJSON conversion so geoCentroid()/geoPath() have
 * something to work with (react-simple-maps does this same conversion
 * internally for rendering, but doesn't expose the result for reuse). */
const WORLD_COUNTRY_FEATURES = (
  topoFeature(
    worldAtlas as unknown as Parameters<typeof topoFeature>[0],
    worldAtlas.objects.countries as never,
  ) as unknown as { features: { properties: { name: string }; geometry: unknown }[] }
).features;

type Drill =
  | { level: "world" }
  | { level: "country"; alpha2: string; iso3: string; name: string }
  | {
      level: "region";
      alpha2: string;
      iso3: string;
      countryName: string;
      regionShapeName: string;
    };

const WORLD_WIDTH = 800;
const WORLD_HEIGHT = 440;
const FIT_PADDING = 24;
/** Clamped so a handful of antimeridian-crossing countries (the US via
 * the Aleutians, Russia, Fiji, New Zealand) don't report an enormous,
 * mostly-empty bounding box and render as an unusably thin sliver —
 * padding the shorter axis keeps real proportions for every normal
 * country while keeping those few usable, not perfectly framed. A known,
 * accepted limit, not a bug. */
const MIN_ASPECT = 0.5;
const MAX_ASPECT = 2.2;

/** Computes a projection + matching viewBox width/height that frames a
 * feature collection with minimal, even padding and (aspect-clamped)
 * correct proportions — replaces a fixed viewBox that made e.g. the US
 * (a wide, short shape) render tiny inside empty vertical space. Paired
 * with CSS width:100%/height:auto below, this is also what makes the
 * map genuinely responsive: the SVG's own aspect ratio now matches its
 * content, so there's no letterboxing at any container width. */
function fitProjectionToFeatures(features: { geometry: unknown }[]) {
  const fc = { type: "FeatureCollection", features } as GeoJsonObject;
  const probe = geoMercator().fitSize([1000, 1000], fc as never);
  const path = geoPath(probe);
  const [[x0, y0], [x1, y1]] = path.bounds(fc as never);
  const rawWidth = Math.max(x1 - x0, 1);
  const rawHeight = Math.max(y1 - y0, 1);
  const rawAspect = rawWidth / rawHeight;

  let extraX = 0;
  let extraY = 0;
  if (rawAspect > MAX_ASPECT) extraY = rawWidth / MAX_ASPECT - rawHeight;
  else if (rawAspect < MIN_ASPECT) extraX = rawHeight * MIN_ASPECT - rawWidth;

  const width = rawWidth + extraX + FIT_PADDING * 2;
  const height = rawHeight + extraY + FIT_PADDING * 2;
  const [tx, ty] = probe.translate();
  const projection = geoMercator()
    .scale(probe.scale())
    .translate([tx - x0 + extraX / 2 + FIT_PADDING, ty - y0 + extraY / 2 + FIT_PADDING]);

  return { projection, width, height };
}

function colorFor(count: number, max: number, hovered: boolean): string {
  if (count === 0) return hovered ? "#cbd5e1" : "#e2e8f0";
  const intensity = 0.2 + 0.7 * (count / max);
  const alpha = hovered ? Math.min(intensity + 0.25, 0.95) : intensity;
  return `rgba(37, 99, 235, ${alpha})`;
}

/** Districts (ADM2) belonging to one governorate/state (ADM1) — there's
 * no parent-region field on geoBoundaries' ADM2 properties to filter by
 * directly, so this is a real spatial join: each district's centroid
 * tested against the governorate's polygon. Both inputs must already be
 * rewound (see rewind-geometry.ts) — getGeoBoundariesAction does this
 * server-side before either ever reaches the client. A centroid-based
 * join is a standard approximation; a district whose centroid falls
 * just outside its "true" governorate due to a concave shape is a known,
 * accepted limit of this technique, not a bug. */
function districtsWithinRegion(districts: GeoBoundaryFeature[], region: GeoBoundaryFeature): GeoBoundaryFeature[] {
  return districts.filter((d) => geoContains(region as never, geoCentroid(d as never)));
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 8;
const ZOOM_STEP = 1.6;

/** Deep Navy — Growli's primary brand color (Growli-Brand-Guidelines.html)
 * — used for the selected-visit outline/marker instead of an arbitrary
 * accent color, so the highlight reads as on-brand rather than a generic
 * UI warning color. Dark enough to stay legible over both the light
 * unfilled shapes and the blue choropleth fill at any intensity. */
const HIGHLIGHT_COLOR = "#1B3445";

export default function AnalyticsMap({
  aggregates,
  selectedVisit,
}: {
  aggregates: GeoAggregate[];
  /** Highlights this visit's location on the map if it falls within
   * whatever's currently drawn — a visit selected in RecentVisits.tsx
   * while viewing an unrelated country/region simply shows no
   * highlight, rather than forcing a jump the admin didn't ask for. */
  selectedVisit: VisitSummary | null;
}) {
  const [drill, setDrill] = useState<Drill>({ level: "world" });
  const [adm1Features, setAdm1Features] = useState<GeoBoundaryFeature[] | null>(null);
  const [adm2Cache, setAdm2Cache] = useState<Record<string, GeoBoundaryFeature[]>>({});
  const [districtsInRegion, setDistrictsInRegion] = useState<GeoBoundaryFeature[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredName, setHoveredName] = useState<string | null>(null);
  // Reset directly inside the 4 transition functions below (backToWorld,
  // drillIntoCountry, etc.) rather than an effect keyed on `drill` — an
  // old zoom/pan from a different shape wouldn't mean anything on the
  // new one, and there's no rendered map to have zoomed on yet the
  // instant a drill transition starts, so resetting at that moment
  // (not when the fetch it kicks off later resolves) is sufficient.
  const [zoom, setZoom] = useState(1);

  const countsByCountryName = useMemo(() => {
    const totals = new Map<string, number>();
    for (const agg of aggregates) {
      const name = matchCountryName(agg.country, WORLD_ATLAS_NAMES);
      if (!name) continue;
      totals.set(name, (totals.get(name) ?? 0) + agg.count);
    }
    return totals;
  }, [aggregates]);
  const maxCountryCount = Math.max(1, ...countsByCountryName.values());

  const countsByRegion = useMemo(() => {
    const totals = new Map<string, number>();
    if (drill.level !== "country" || !adm1Features) return totals;
    for (const agg of aggregates) {
      if (agg.country !== drill.alpha2 || !agg.region) continue;
      const shapeName = matchGeoBoundaryShape(agg.region, adm1Features);
      if (!shapeName) continue;
      totals.set(shapeName, (totals.get(shapeName) ?? 0) + agg.count);
    }
    return totals;
  }, [drill, adm1Features, aggregates]);
  const maxRegionCount = Math.max(1, ...countsByRegion.values());

  const countsByDistrict = useMemo(() => {
    const totals = new Map<string, number>();
    if (drill.level !== "region" || !districtsInRegion) return totals;
    for (const agg of aggregates) {
      if (agg.country !== drill.alpha2 || !agg.region || !agg.city) continue;
      if (!adm1Features) continue;
      const regionMatch = matchGeoBoundaryShape(agg.region, adm1Features);
      if (regionMatch !== drill.regionShapeName) continue;
      const shapeName = matchGeoBoundaryShape(agg.city, districtsInRegion);
      if (!shapeName) continue;
      totals.set(shapeName, (totals.get(shapeName) ?? 0) + agg.count);
    }
    return totals;
  }, [drill, districtsInRegion, adm1Features, aggregates]);
  const maxDistrictCount = Math.max(1, ...countsByDistrict.values());

  const activeFeatures =
    drill.level === "region" ? districtsInRegion : drill.level === "country" ? adm1Features : null;
  const fitted = useMemo(() => (activeFeatures ? fitProjectionToFeatures(activeFeatures) : null), [activeFeatures]);
  const activeFeatureCollection = useMemo(
    () => (activeFeatures ? ({ type: "FeatureCollection", features: activeFeatures } as GeoJsonObject) : null),
    [activeFeatures],
  );

  /** The shape (at whatever level is currently drawn) that contains the
   * selected visit, plus its centroid for the marker — a single lookup
   * so the shape can stay highlighted (not just a dot) at every drill
   * level, the way a visitor's actual state/city should read as "this
   * whole area," not one pixel. */
  const highlighted = useMemo((): { name: string; coordinates: [number, number] } | undefined => {
    if (!selectedVisit) return undefined;

    if (drill.level === "world") {
      const countryName = matchCountryName(selectedVisit.country ?? "", WORLD_ATLAS_NAMES);
      const feature = WORLD_COUNTRY_FEATURES.find((f) => f.properties.name === countryName);
      return feature ? { name: countryName!, coordinates: geoCentroid(feature as never) } : undefined;
    }

    if (drill.level === "country" && adm1Features) {
      if (selectedVisit.country !== drill.alpha2 || !selectedVisit.region) return undefined;
      const shapeName = matchGeoBoundaryShape(selectedVisit.region, adm1Features);
      const feature = adm1Features.find((f) => f.properties.shapeName === shapeName);
      return feature ? { name: shapeName!, coordinates: geoCentroid(feature as never) } : undefined;
    }

    if (drill.level === "region" && districtsInRegion && adm1Features) {
      if (selectedVisit.country !== drill.alpha2 || !selectedVisit.region || !selectedVisit.city) return undefined;
      if (matchGeoBoundaryShape(selectedVisit.region, adm1Features) !== drill.regionShapeName) return undefined;
      const shapeName = matchGeoBoundaryShape(selectedVisit.city, districtsInRegion);
      const feature = districtsInRegion.find((f) => f.properties.shapeName === shapeName);
      return feature ? { name: shapeName!, coordinates: geoCentroid(feature as never) } : undefined;
    }

    return undefined;
  }, [selectedVisit, drill, adm1Features, districtsInRegion]);

  function drillIntoCountry(name: string) {
    const alpha2 = NAME_TO_ALPHA2.get(name);
    if (!alpha2) {
      // No ISO3 mapping (a handful of micro-territories) — show this
      // instead of silently doing nothing, which used to look exactly
      // like a stuck loading state.
      setDrill({ level: "world" });
      setAdm1Features(null);
      setDistrictsInRegion(null);
      setHoveredName(null);
      setLoading(false);
      setError(`No detailed map available for ${name} yet.`);
      return;
    }
    const iso3 = COUNTRY_ISO3[alpha2];
    setDrill({ level: "country", alpha2, iso3, name });
    setAdm1Features(null);
    setDistrictsInRegion(null);
    setError(null);
    setHoveredName(null);
    setZoom(1);
    setLoading(true);
    getGeoBoundariesAction(iso3, "ADM1").then((result) => {
      setLoading(false);
      if ("error" in result) setError(result.error);
      else setAdm1Features(result.features);
    });
  }

  async function drillIntoRegion(regionFeature: GeoBoundaryFeature) {
    if (drill.level !== "country") return;
    const { alpha2, iso3, name: countryName } = drill;
    const regionShapeName = regionFeature.properties.shapeName;
    setDrill({ level: "region", alpha2, iso3, countryName, regionShapeName });
    setDistrictsInRegion(null);
    setError(null);
    setHoveredName(null);
    setZoom(1);
    setLoading(true);

    let districts = adm2Cache[iso3];
    if (!districts) {
      const result = await getGeoBoundariesAction(iso3, "ADM2");
      if ("error" in result) {
        setLoading(false);
        setError(result.error);
        return;
      }
      districts = result.features;
      setAdm2Cache((prev) => ({ ...prev, [iso3]: districts }));
    }
    setLoading(false);
    setDistrictsInRegion(districtsWithinRegion(districts, regionFeature));
  }

  function backToWorld() {
    setDrill({ level: "world" });
    setAdm1Features(null);
    setDistrictsInRegion(null);
    setError(null);
    setHoveredName(null);
    setZoom(1);
  }

  function backToCountry() {
    if (drill.level !== "region") return;
    setDrill({ level: "country", alpha2: drill.alpha2, iso3: drill.iso3, name: drill.countryName });
    setDistrictsInRegion(null);
    setError(null);
    setHoveredName(null);
    setZoom(1);
  }

  const zoomIn = () => setZoom((z) => Math.min(MAX_ZOOM, z * ZOOM_STEP));
  const zoomOut = () => setZoom((z) => Math.max(MIN_ZOOM, z / ZOOM_STEP));

  return (
    <div className={`relative overflow-hidden bg-slate-50 p-3 ${glassCard}`}>
      {drill.level !== "world" && (
        <div className="mb-2 flex items-center gap-1 text-xs font-semibold text-slate-500">
          <button
            type="button"
            onClick={backToWorld}
            className="flex cursor-pointer items-center gap-1 hover:text-slate-900"
          >
            <CaretLeft size={11} aria-hidden="true" />
            World
          </button>
          <span className="text-slate-300">/</span>
          {drill.level === "country" ? (
            <span>{drill.name}</span>
          ) : (
            <>
              <button type="button" onClick={backToCountry} className="cursor-pointer hover:text-slate-900">
                {drill.countryName}
              </button>
              <span className="text-slate-300">/</span>
              <span>{drill.regionShapeName}</span>
            </>
          )}
        </div>
      )}

      {drill.level === "world" && error && (
        <div className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
          {error}
        </div>
      )}

      <div className="absolute end-5 top-5 z-10 flex flex-col gap-1">
        <button
          type="button"
          onClick={zoomIn}
          disabled={zoom >= MAX_ZOOM}
          aria-label="Zoom in"
          className={`flex h-8 w-8 cursor-pointer items-center justify-center disabled:cursor-not-allowed disabled:opacity-40 ${glassIconButton}`}
        >
          <MagnifyingGlassPlus size={14} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={zoomOut}
          disabled={zoom <= MIN_ZOOM}
          aria-label="Zoom out"
          className={`flex h-8 w-8 cursor-pointer items-center justify-center disabled:cursor-not-allowed disabled:opacity-40 ${glassIconButton}`}
        >
          <MagnifyingGlassMinus size={14} aria-hidden="true" />
        </button>
      </div>

      {drill.level !== "world" && loading && (
        <div className="flex items-center justify-center text-sm text-slate-400" style={{ height: WORLD_HEIGHT }}>
          Loading…
        </div>
      )}
      {drill.level !== "world" && error && (
        <div
          className="flex items-center justify-center px-8 text-center text-sm text-slate-400"
          style={{ height: WORLD_HEIGHT }}
        >
          {error}
        </div>
      )}

      {(drill.level === "country" || drill.level === "region") &&
        !loading &&
        !error &&
        activeFeatureCollection &&
        fitted && (
          <ComposableMap
            width={fitted.width}
            height={fitted.height}
            projection={fitted.projection}
            style={{ width: "100%", height: "auto", maxHeight: 480 }}
          >
            <ZoomableGroup zoom={zoom} minZoom={MIN_ZOOM} maxZoom={MAX_ZOOM} onMoveEnd={({ zoom: z }) => setZoom(z ?? 1)}>
              <Geographies geography={activeFeatureCollection}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const name = (geo.properties as { shapeName: string }).shapeName;
                    const count =
                      drill.level === "country"
                        ? (countsByRegion.get(name) ?? 0)
                        : (countsByDistrict.get(name) ?? 0);
                    const max = drill.level === "country" ? maxRegionCount : maxDistrictCount;
                    const hovered = hoveredName === name;
                    const isHighlighted = highlighted?.name === name;
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={colorFor(count, max, hovered)}
                        stroke={isHighlighted ? HIGHLIGHT_COLOR : "#94a3b8"}
                        strokeWidth={isHighlighted ? 2.5 : 0.75}
                        onMouseEnter={() => setHoveredName(name)}
                        onMouseLeave={() => setHoveredName((prev) => (prev === name ? null : prev))}
                        onClick={() => drill.level === "country" && drillIntoRegion(geo as unknown as GeoBoundaryFeature)}
                        style={{ outline: "none", cursor: drill.level === "country" ? "pointer" : "default" }}
                      >
                        <title>
                          {name}
                          {count > 0 ? `: ${count} visit${count === 1 ? "" : "s"}` : ""}
                        </title>
                      </Geography>
                    );
                  })
                }
              </Geographies>
              {highlighted && <VisitMarker coordinates={highlighted.coordinates} />}
            </ZoomableGroup>
          </ComposableMap>
        )}

      {drill.level === "world" && (
        <ComposableMap
          width={WORLD_WIDTH}
          height={WORLD_HEIGHT}
          projection="geoNaturalEarth1"
          projectionConfig={{ scale: 148 }}
          style={{ width: "100%", height: "auto", maxHeight: 480 }}
        >
          <ZoomableGroup zoom={zoom} minZoom={MIN_ZOOM} maxZoom={MAX_ZOOM} onMoveEnd={({ zoom: z }) => setZoom(z ?? 1)}>
            <Geographies geography={WORLD_TOPOLOGY}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const name = (geo.properties as { name: string }).name;
                  const count = countsByCountryName.get(name) ?? 0;
                  const hovered = hoveredName === name;
                  const drillable = NAME_TO_ALPHA2.has(name);
                  const isHighlighted = highlighted?.name === name;
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={colorFor(count, maxCountryCount, hovered)}
                      stroke={isHighlighted ? HIGHLIGHT_COLOR : "#f8fafc"}
                      strokeWidth={isHighlighted ? 2 : 0.4}
                      onMouseEnter={() => setHoveredName(name)}
                      onMouseLeave={() => setHoveredName((prev) => (prev === name ? null : prev))}
                      onClick={() => drillIntoCountry(name)}
                      style={{ outline: "none", cursor: drillable ? "pointer" : "default" }}
                    >
                      <title>
                        {name}
                        {count > 0 ? `: ${count} visit${count === 1 ? "" : "s"}` : ""}
                      </title>
                    </Geography>
                  );
                })
              }
            </Geographies>
            {highlighted && <VisitMarker coordinates={highlighted.coordinates} />}
          </ZoomableGroup>
        </ComposableMap>
      )}
    </div>
  );
}

/** A single-visit highlight — a dot in the same brand navy as the
 * highlighted shape's own outline, distinct enough from the choropleth
 * blue fill to read as "a specific point" on top of it. */
function VisitMarker({ coordinates }: { coordinates: [number, number] }) {
  return (
    <Marker coordinates={coordinates}>
      <circle r={5} fill={HIGHLIGHT_COLOR} stroke="#ffffff" strokeWidth={1.5} />
    </Marker>
  );
}
