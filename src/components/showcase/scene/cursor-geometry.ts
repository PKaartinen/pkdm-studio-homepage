import { ExtrudeGeometry, Shape, Vector2 } from "three";

// ---------------------------------------------------------------------------
// The glass cursor silhouette — classic arrow pointer, heavily rounded,
// extruded thick (~0.35× height) with deep bevels so it reads as CAST GLASS,
// not a flat icon (spec T-304).
// ---------------------------------------------------------------------------

/** Source outline in y-down screen space (classic arrow-with-tail pointer). */
const OUTLINE: [number, number][] = [
  [0.0, 0.0], // apex
  [0.0, 16.5], // left edge bottom
  [4.3, 12.6], // inner notch left
  [7.2, 18.6], // tail bottom-left
  [10.2, 17.3], // tail bottom-right
  [7.6, 11.5], // inner notch right
  [12.6, 11.5], // right wing
];

/** Build a THREE.Shape from a polygon with rounded (filleted) corners. */
function roundedPolygonShape(pts: [number, number][], radius: number): Shape {
  const shape = new Shape();
  const n = pts.length;
  const v = pts.map(([x, y]) => new Vector2(x, y));
  for (let i = 0; i < n; i++) {
    const prev = v[(i + n - 1) % n];
    const cur = v[i];
    const next = v[(i + 1) % n];
    const d1 = cur.clone().sub(prev);
    const d2 = next.clone().sub(cur);
    const r = Math.min(radius, d1.length() / 2.3, d2.length() / 2.3);
    const p1 = cur.clone().sub(d1.clone().normalize().multiplyScalar(r));
    const p2 = cur.clone().add(d2.clone().normalize().multiplyScalar(r));
    if (i === 0) shape.moveTo(p1.x, p1.y);
    else shape.lineTo(p1.x, p1.y);
    shape.quadraticCurveTo(cur.x, cur.y, p2.x, p2.y);
  }
  shape.closePath();
  return shape;
}

export const CURSOR_HEIGHT = 2.3; // world units

/**
 * Extruded, beveled cursor geometry. ~15–20k tris with these segment counts.
 * Centered on its bounding box; faces +z (the camera).
 */
export function createCursorGeometry(): ExtrudeGeometry {
  // Normalize: center the outline, flip y (source is y-down), scale to height.
  const xs = OUTLINE.map((p) => p[0]);
  const ys = OUTLINE.map((p) => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const s = CURSOR_HEIGHT / (Math.max(...ys) - Math.min(...ys));
  const pts: [number, number][] = OUTLINE.map(([x, y]) => [
    (x - cx) * s,
    -(y - cy) * s,
  ]);

  const shape = roundedPolygonShape(pts, 0.16 * CURSOR_HEIGHT * 0.12 * 10);

  const depth = 0.35 * CURSOR_HEIGHT - 2 * 0.14; // bevels add back the rest
  const geo = new ExtrudeGeometry(shape, {
    depth,
    curveSegments: 24,
    bevelEnabled: true,
    bevelThickness: 0.14,
    bevelSize: 0.11,
    bevelOffset: -0.02,
    bevelSegments: 8,
  });
  geo.center();
  geo.computeVertexNormals();
  return geo;
}
