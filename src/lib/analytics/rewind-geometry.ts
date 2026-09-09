/**
 * geoBoundaries' polygons use the opposite ring-winding convention from
 * what d3-geo's spherical functions (geoContains, geoCentroid, geoArea)
 * expect — confirmed directly against real data: geoArea() on Iraq's
 * Baghdad governorate, unwound, came back as 4π steradians (the area of
 * the ENTIRE SPHERE) with a centroid at Baghdad's exact antipode, the
 * classic symptom of an inverted ring being read as "everywhere except
 * this shape." Rendering (react-simple-maps' geoPath → SVG) isn't
 * affected — SVG's fill-rule doesn't care about winding — so this is
 * only needed before any geoContains/geoCentroid call (the ADM1↔ADM2
 * spatial join in AnalyticsMap.tsx, and marker placement for a selected
 * visit). Reversing every ring unconditionally is safe and sufficient:
 * confirmed the inversion is systematic across the whole dataset, not
 * per-feature.
 */
export function rewindGeometry<T extends { type: string; coordinates: unknown }>(geometry: T): T {
  if (geometry.type === "Polygon") {
    return {
      ...geometry,
      coordinates: (geometry.coordinates as number[][][]).map((ring) => [...ring].reverse()),
    };
  }
  if (geometry.type === "MultiPolygon") {
    return {
      ...geometry,
      coordinates: (geometry.coordinates as number[][][][]).map((polygon) =>
        polygon.map((ring) => [...ring].reverse()),
      ),
    };
  }
  return geometry;
}

export function rewindFeature<F extends { geometry: { type: string; coordinates: unknown } }>(feature: F): F {
  return { ...feature, geometry: rewindGeometry(feature.geometry) };
}
