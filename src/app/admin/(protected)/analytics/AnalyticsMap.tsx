"use client";

import { useMemo, useState } from "react";
import { geoCentroid, geoContains, geoMercator } from "d3-geo";
import { feature as topoFeature } from "topojson-client";
import type { GeoJsonObject } from "geojson";
import { CaretLeft } from "@phosphor-icons/react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import worldAtlas from "world-atlas/countries-50m.json";
import type { GeoAggregate, VisitSummary } from "@/lib/admin/analytics";
import { matchCountryName } from "@/lib/analytics/country-match";
import { matchGeoBoundaryShape } from "@/lib/analytics/geo-match";
import { COUNTRY_ISO3 } from "@/lib/analytics/country-iso3";
import { getGeoBoundariesAction, type GeoBoundaryFeature } from "./actions";
import { glassCard } from "../../glass";

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
 * here, only real-GeoJSON conversion so geoCentroid() has something to
 * work with (react-simple-maps does this same conversion internally for
 * rendering, but doesn't expose the result for reuse). Used only for
 * placing the selected-visit marker at the world level. */
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

const MAP_HEIGHT = 420;

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

/** Fixed light canvas regardless of the admin's own light/dark toggle —
 * a choropleth's color-coded shapes need consistent contrast to read
 * correctly, and flipping the whole scale for dark mode is real added
 * complexity for a first version. Revisit if this reads badly in
 * practice. */
export default function AnalyticsMap({
  aggregates,
  selectedVisit,
}: {
  aggregates: GeoAggregate[];
  /** Highlights this visit's location on the map if it falls within
   * whatever's currently drawn — a visit selected in RecentVisits.tsx
   * while viewing an unrelated country/region simply shows no marker,
   * rather than forcing a jump the admin didn't ask for. */
  selectedVisit: VisitSummary | null;
}) {
  const [drill, setDrill] = useState<Drill>({ level: "world" });
  const [adm1Features, setAdm1Features] = useState<GeoBoundaryFeature[] | null>(null);
  const [adm2Cache, setAdm2Cache] = useState<Record<string, GeoBoundaryFeature[]>>({});
  const [districtsInRegion, setDistrictsInRegion] = useState<GeoBoundaryFeature[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredName, setHoveredName] = useState<string | null>(null);

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
  const activeFeatureCollection = useMemo(
    () => (activeFeatures ? ({ type: "FeatureCollection", features: activeFeatures } as GeoJsonObject) : null),
    [activeFeatures],
  );
  const activeProjection = useMemo(() => {
    if (!activeFeatureCollection) return undefined;
    return geoMercator().fitExtent(
      [
        [16, 16],
        [784, MAP_HEIGHT - 16],
      ],
      // d3-geo's fitExtent accepts any GeoJSON geometry/feature/collection.
      activeFeatureCollection as never,
    );
  }, [activeFeatureCollection]);

  /** Where to drop the selected-visit marker, if it matches anything in
   * the currently-drawn level — undefined means "don't show a marker,"
   * not an error (see the prop's own comment above). */
  const markerCoordinates = useMemo((): [number, number] | undefined => {
    if (!selectedVisit) return undefined;

    if (drill.level === "world") {
      const countryName = matchCountryName(selectedVisit.country ?? "", WORLD_ATLAS_NAMES);
      const feature = WORLD_COUNTRY_FEATURES.find((f) => f.properties.name === countryName);
      return feature ? geoCentroid(feature as never) : undefined;
    }

    if (drill.level === "country" && adm1Features) {
      if (selectedVisit.country !== drill.alpha2 || !selectedVisit.region) return undefined;
      const shapeName = matchGeoBoundaryShape(selectedVisit.region, adm1Features);
      const feature = adm1Features.find((f) => f.properties.shapeName === shapeName);
      return feature ? geoCentroid(feature as never) : undefined;
    }

    if (drill.level === "region" && districtsInRegion && adm1Features) {
      if (selectedVisit.country !== drill.alpha2 || !selectedVisit.region || !selectedVisit.city) return undefined;
      if (matchGeoBoundaryShape(selectedVisit.region, adm1Features) !== drill.regionShapeName) return undefined;
      const shapeName = matchGeoBoundaryShape(selectedVisit.city, districtsInRegion);
      const feature = districtsInRegion.find((f) => f.properties.shapeName === shapeName);
      return feature ? geoCentroid(feature as never) : undefined;
    }

    return undefined;
  }, [selectedVisit, drill, adm1Features, districtsInRegion]);

  function drillIntoCountry(name: string) {
    const alpha2 = NAME_TO_ALPHA2.get(name);
    if (!alpha2) return; // not in COUNTRY_ISO3 yet — see that file's comment
    const iso3 = COUNTRY_ISO3[alpha2];
    setDrill({ level: "country", alpha2, iso3, name });
    setAdm1Features(null);
    setDistrictsInRegion(null);
    setError(null);
    setHoveredName(null);
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
  }

  function backToCountry() {
    if (drill.level !== "region") return;
    setDrill({ level: "country", alpha2: drill.alpha2, iso3: drill.iso3, name: drill.countryName });
    setDistrictsInRegion(null);
    setError(null);
    setHoveredName(null);
  }

  return (
    <div className={`overflow-hidden bg-slate-50 p-3 ${glassCard}`}>
      {drill.level !== "world" && (
        <div className="mb-2 flex items-center gap-1 text-xs font-semibold text-slate-500">
          <button type="button" onClick={backToWorld} className="flex cursor-pointer items-center gap-1 hover:text-slate-900">
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

      {drill.level !== "world" && loading && (
        <div className="flex items-center justify-center text-sm text-slate-400" style={{ height: MAP_HEIGHT }}>
          Loading…
        </div>
      )}
      {drill.level !== "world" && error && (
        <div
          className="flex items-center justify-center px-8 text-center text-sm text-slate-400"
          style={{ height: MAP_HEIGHT }}
        >
          {error}
        </div>
      )}

      {drill.level === "country" && !loading && !error && activeFeatureCollection && activeProjection && (
        <ComposableMap projection={activeProjection} className="w-full" style={{ maxHeight: MAP_HEIGHT }}>
          <Geographies geography={activeFeatureCollection}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const feature = geo as unknown as GeoBoundaryFeature;
                const name = feature.properties.shapeName;
                const count = countsByRegion.get(name) ?? 0;
                const hovered = hoveredName === name;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={colorFor(count, maxRegionCount, hovered)}
                    stroke="#94a3b8"
                    strokeWidth={0.75}
                    onMouseEnter={() => setHoveredName(name)}
                    onMouseLeave={() => setHoveredName((prev) => (prev === name ? null : prev))}
                    onClick={() => drillIntoRegion(feature)}
                    style={{ outline: "none", cursor: "pointer" }}
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
          {markerCoordinates && <VisitMarker coordinates={markerCoordinates} />}
        </ComposableMap>
      )}

      {drill.level === "region" && !loading && !error && activeFeatureCollection && activeProjection && (
        <ComposableMap projection={activeProjection} className="w-full" style={{ maxHeight: MAP_HEIGHT }}>
          <Geographies geography={activeFeatureCollection}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const name = (geo.properties as { shapeName: string }).shapeName;
                const count = countsByDistrict.get(name) ?? 0;
                const hovered = hoveredName === name;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={colorFor(count, maxDistrictCount, hovered)}
                    stroke="#94a3b8"
                    strokeWidth={0.75}
                    onMouseEnter={() => setHoveredName(name)}
                    onMouseLeave={() => setHoveredName((prev) => (prev === name ? null : prev))}
                    style={{ outline: "none" }}
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
          {markerCoordinates && <VisitMarker coordinates={markerCoordinates} />}
        </ComposableMap>
      )}

      {drill.level === "world" && (
        <ComposableMap
          projection="geoNaturalEarth1"
          projectionConfig={{ scale: 148 }}
          className="w-full"
          style={{ maxHeight: MAP_HEIGHT }}
        >
          <Geographies geography={WORLD_TOPOLOGY}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const name = (geo.properties as { name: string }).name;
                const count = countsByCountryName.get(name) ?? 0;
                const hovered = hoveredName === name;
                const drillable = NAME_TO_ALPHA2.has(name);
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={colorFor(count, maxCountryCount, hovered)}
                    stroke="#f8fafc"
                    strokeWidth={0.4}
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
          {markerCoordinates && <VisitMarker coordinates={markerCoordinates} />}
        </ComposableMap>
      )}
    </div>
  );
}

/** A single-visit highlight — a bright accent dot the choropleth blue
 * never uses, so it reads as "a specific point" rather than "another
 * shaded region." */
function VisitMarker({ coordinates }: { coordinates: [number, number] }) {
  return (
    <Marker coordinates={coordinates}>
      <circle r={5} fill="#f59e0b" stroke="#ffffff" strokeWidth={1.5} />
    </Marker>
  );
}
