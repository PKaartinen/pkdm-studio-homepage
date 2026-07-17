"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  ShaderMaterial,
  Vector3,
} from "three";
import { progress } from "../scroll-store";
import { buildAnnotationOpacity, buildPose } from "../choreography";
import { syncState } from "../sync-store";

// ---------------------------------------------------------------------------
// T-312 — Act 3 "The Build". A page skeleton (nav bar, hero block, CTA pill)
// draws itself in crisp cyan hairlines with white-hot cores — line draw via
// scroll-scrubbed reveal along a global path parameter (a dash-offset scrub,
// pure function of the damped store → reversible, no popping segments). Then
// the faces fill with faint glass (cheap fresnel-style shimmer — NEVER
// transmission). The CTA pill ends the act positioned for the finale and
// stays visible and stable through 0.78–1.00 (Phase-3 hand-off seam).
// ---------------------------------------------------------------------------

type Pt = [number, number];
type Stroke = { points: Pt[]; pill?: boolean };

const STROKE_W = 0.045;

// Pill outline (rounded rect) as a closed polyline
function pillOutline(cx: number, cy: number, w: number, h: number): Pt[] {
  const r = h / 2;
  const hw = w / 2 - r;
  const pts: Pt[] = [];
  const arc = (px: number, py: number, a0: number, a1: number) => {
    for (let i = 0; i <= 8; i++) {
      const a = a0 + ((a1 - a0) * i) / 8;
      pts.push([px + Math.cos(a) * r, py + Math.sin(a) * r]);
    }
  };
  pts.push([cx - hw, cy + r]);
  pts.push([cx + hw, cy + r]);
  arc(cx + hw, cy, Math.PI / 2, -Math.PI / 2);
  pts.push([cx - hw, cy - r]);
  arc(cx - hw, cy, -Math.PI / 2, -Math.PI * 1.5);
  return pts;
}

const rect = (x0: number, y0: number, x1: number, y1: number): Pt[] => [
  [x0, y0],
  [x1, y0],
  [x1, y1],
  [x0, y1],
  [x0, y0],
];
const line = (x0: number, y0: number, x1: number, y1: number): Pt[] => [
  [x0, y0],
  [x1, y1],
];

// The abstract page layout — draw order: nav → hero block → CTA pill
const STROKES: Stroke[] = [
  { points: rect(-1.8, 0.92, 1.8, 1.2) }, // nav bar
  { points: line(-1.62, 1.06, -1.28, 1.06) }, // logo tick
  { points: line(0.55, 1.06, 0.85, 1.06) }, // nav links
  { points: line(1.0, 1.06, 1.3, 1.06) },
  { points: line(1.45, 1.06, 1.68, 1.06) },
  { points: rect(-1.8, -0.5, 1.8, 0.72) }, // hero block
  { points: line(-1.55, 0.38, 0.75, 0.38) }, // headline lines
  { points: line(-1.55, 0.12, 0.15, 0.12) },
  { points: line(-1.55, -0.14, -0.35, -0.14) }, // sub line
  { points: pillOutline(0, -1.0, 1.35, 0.36), pill: true }, // CTA pill
];

/** Stroke quads with a GLOBAL 0–1 path parameter (aAlong) in draw order. */
function createStrokeGeometry(): BufferGeometry {
  const positions: number[] = [];
  const along: number[] = [];
  const across: number[] = [];
  const pill: number[] = [];
  const index: number[] = [];

  let total = 0;
  const lengths = STROKES.map((s) => {
    let l = 0;
    for (let i = 1; i < s.points.length; i++) {
      const dx = s.points[i][0] - s.points[i - 1][0];
      const dy = s.points[i][1] - s.points[i - 1][1];
      l += Math.hypot(dx, dy);
    }
    total += l;
    return l;
  });

  let acc = 0;
  const hw = STROKE_W / 2;
  STROKES.forEach((s, si) => {
    let local = 0;
    for (let i = 1; i < s.points.length; i++) {
      const [x0, y0] = s.points[i - 1];
      const [x1, y1] = s.points[i];
      const dx = x1 - x0;
      const dy = y1 - y0;
      const len = Math.hypot(dx, dy);
      if (len < 1e-6) continue;
      const nx = (-dy / len) * hw;
      const ny = (dx / len) * hw;
      // slight cap extension keeps joints solid (overdraw reads as hot joints)
      const ex = (dx / len) * hw * 0.6;
      const ey = (dy / len) * hw * 0.6;
      const t0 = (acc + local) / total;
      const t1 = (acc + local + len) / total;
      const base = positions.length / 3;
      positions.push(
        x0 - ex + nx, y0 - ey + ny, 0,
        x0 - ex - nx, y0 - ey - ny, 0,
        x1 + ex + nx, y1 + ey + ny, 0,
        x1 + ex - nx, y1 + ey - ny, 0
      );
      along.push(t0, t0, t1, t1);
      across.push(1, -1, 1, -1);
      const pf = s.pill ? 1 : 0;
      pill.push(pf, pf, pf, pf);
      index.push(base, base + 1, base + 2, base + 2, base + 1, base + 3);
      local += len;
    }
    acc += lengths[si];
  });

  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
  g.setAttribute("aAlong", new BufferAttribute(new Float32Array(along), 1));
  g.setAttribute("aAcross", new BufferAttribute(new Float32Array(across), 1));
  g.setAttribute("aPill", new BufferAttribute(new Float32Array(pill), 1));
  g.setIndex(index);
  return g;
}

/** Glass-fill faces (nav, hero, pill) — one merged geometry, rounded-rect
 *  SDF per face via attributes; staggered fill; cheap fresnel-style rim. */
function createFaceGeometry(): BufferGeometry {
  // face: [cx, cy, hw, hh, radius, stagger, pill]
  const faces: [number, number, number, number, number, number, number][] = [
    [0, 1.06, 1.8, 0.14, 0.02, 0, 0], // nav
    [0, 0.11, 1.8, 0.61, 0.02, 1, 0], // hero block
    [0, -1.0, 0.675, 0.18, 0.18, 2, 1], // CTA pill
  ];
  const positions: number[] = [];
  const local: number[] = [];
  const size: number[] = [];
  const radius: number[] = [];
  const stagger: number[] = [];
  const pill: number[] = [];
  const index: number[] = [];
  faces.forEach(([cx, cy, hw, hh, r, st, pf]) => {
    const base = positions.length / 3;
    positions.push(
      cx - hw, cy - hh, 0,
      cx + hw, cy - hh, 0,
      cx - hw, cy + hh, 0,
      cx + hw, cy + hh, 0
    );
    local.push(-hw, -hh, hw, -hh, -hw, hh, hw, hh);
    for (let i = 0; i < 4; i++) {
      size.push(hw, hh);
      radius.push(r);
      stagger.push(st);
      pill.push(pf);
    }
    index.push(base, base + 1, base + 2, base + 2, base + 1, base + 3);
  });
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
  g.setAttribute("aLocal", new BufferAttribute(new Float32Array(local), 2));
  g.setAttribute("aSize", new BufferAttribute(new Float32Array(size), 2));
  g.setAttribute("aRadius", new BufferAttribute(new Float32Array(radius), 1));
  g.setAttribute("aStagger", new BufferAttribute(new Float32Array(stagger), 1));
  g.setAttribute("aPill", new BufferAttribute(new Float32Array(pill), 1));
  g.setIndex(index);
  return g;
}

const anchor = new Vector3();

export default function BuildSkeleton() {
  const groupRef = useRef<Group>(null);
  const strokeMat = useRef<ShaderMaterial>(null);
  const faceMat = useRef<ShaderMaterial>(null);
  const { camera, size } = useThree();

  const strokeGeometry = useMemo(() => createStrokeGeometry(), []);
  const faceGeometry = useMemo(() => createFaceGeometry(), []);
  useEffect(
    () => () => {
      strokeGeometry.dispose();
      faceGeometry.dispose();
    },
    [strokeGeometry, faceGeometry]
  );

  const strokeUniforms = useMemo(
    () => ({
      uDraw: { value: 0 },
      uDim: { value: 0 },
      uCyan: { value: new Color("#69edfe") },
      uCyanSoft: { value: new Color("#a6f4ff") },
      uBlue: { value: new Color("#1f9fd6") },
    }),
    []
  );
  const faceUniforms = useMemo(
    () => ({
      uFill: { value: 0 },
      uDim: { value: 0 },
      uTime: { value: 0 },
      uCyan: { value: new Color("#69edfe") },
      uDeep: { value: new Color("#0167b4") },
    }),
    []
  );

  useFrame((state) => {
    const g = groupRef.current;
    if (!g) return;
    const v = progress();
    const pose = buildPose(v);

    g.visible = pose.appear > 0.001;

    if (strokeMat.current) {
      strokeMat.current.uniforms.uDraw.value = pose.draw;
      strokeMat.current.uniforms.uDim.value = pose.dim;
    }
    if (faceMat.current) {
      faceMat.current.uniforms.uFill.value = pose.fill;
      faceMat.current.uniforms.uDim.value = pose.dim;
      faceMat.current.uniforms.uTime.value = state.clock.elapsedTime;
    }

    // --- `A 24/7 SALES REP` — pinned to the finished skeleton --------------
    const a = syncState.annotations.build;
    const opacity = buildAnnotationOpacity(v);
    if (g.visible && opacity > 0.01) {
      anchor.set(1.8, 0.72, 0.02);
      g.localToWorld(anchor);
      anchor.project(camera);
      a.x = ((anchor.x + 1) / 2) * size.width;
      a.y = ((1 - anchor.y) / 2) * size.height;
      a.opacity = opacity;
      a.visible = true;
    } else {
      a.visible = false;
      a.opacity = 0;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[1.3, -0.3, 0.2]}
      rotation={[-0.14, 0, 0]}
      scale={0.92}
      visible={false}
    >
      {/* Glass-fill faces (behind the strokes) */}
      <mesh geometry={faceGeometry}>
        <shaderMaterial
          ref={faceMat}
          uniforms={faceUniforms}
          transparent
          depthWrite={false}
          side={DoubleSide}
          vertexShader={/* glsl */ `
            attribute vec2 aLocal;
            attribute vec2 aSize;
            attribute float aRadius;
            attribute float aStagger;
            attribute float aPill;
            varying vec2 vLocal;
            varying vec2 vSize;
            varying float vRadius;
            varying float vStagger;
            varying float vPill;
            void main() {
              vLocal = aLocal;
              vSize = aSize;
              vRadius = aRadius;
              vStagger = aStagger;
              vPill = aPill;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={/* glsl */ `
            precision highp float;
            varying vec2 vLocal;
            varying vec2 vSize;
            varying float vRadius;
            varying float vStagger;
            varying float vPill;
            uniform float uFill;
            uniform float uDim;
            uniform float uTime;
            uniform vec3 uCyan;
            uniform vec3 uDeep;

            float sdRoundedBox(vec2 p, vec2 b, float r) {
              vec2 q = abs(p) - b + r;
              return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
            }

            void main() {
              float sd = sdRoundedBox(vLocal, vSize, vRadius);
              if (sd > 0.0) discard;
              // staggered fill: nav → hero → pill
              float f = smoothstep(0.0, 1.0, clamp(uFill * 3.0 - vStagger, 0.0, 1.0));
              if (f < 0.003) discard;

              // faint glass: deep-blue fill + cyan rim (fresnel-style edge)
              float rim = 1.0 - smoothstep(0.0, 0.16, -sd);
              // slow diagonal sheen — the "shimmer", subtle and calm
              float sheen = 0.5 + 0.5 * sin((vLocal.x + vLocal.y) * 2.2 + uTime * 0.5);
              vec3 col = uDeep * 0.16 + uCyan * (rim * 0.28 + sheen * 0.05);
              float alpha = f * (0.16 + rim * 0.3);
              float dimK = 1.0 - uDim * (1.0 - vPill);
              gl_FragColor = vec4(col * dimK, alpha * dimK);
            }
          `}
        />
      </mesh>

      {/* Hairline strokes — additive, white-hot cores (rays not smoke) */}
      <mesh geometry={strokeGeometry}>
        <shaderMaterial
          ref={strokeMat}
          uniforms={strokeUniforms}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
          side={DoubleSide}
          vertexShader={/* glsl */ `
            attribute float aAlong;
            attribute float aAcross;
            attribute float aPill;
            varying float vAlong;
            varying float vAcross;
            varying float vPill;
            void main() {
              vAlong = aAlong;
              vAcross = aAcross;
              vPill = aPill;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={/* glsl */ `
            precision highp float;
            varying float vAlong;
            varying float vAcross;
            varying float vPill;
            uniform float uDraw;
            uniform float uDim;
            uniform vec3 uCyan;
            uniform vec3 uCyanSoft;
            uniform vec3 uBlue;

            void main() {
              // scrubbed reveal along the global path (soft drawing head)
              float vis = 1.0 - smoothstep(uDraw - 0.006, uDraw + 0.002, vAlong);
              if (vis < 0.003) discard;

              // crisp hairline core + tight glow falloff (defined edges)
              float a = abs(vAcross);
              float core = 1.0 - smoothstep(0.0, 0.3, a);
              float glow = 1.0 - smoothstep(0.0, 1.0, a);

              // white-hot "pen tip" at the drawing head
              float tip = exp(-abs(vAlong - uDraw) * 90.0) *
                          step(0.001, uDraw) * step(uDraw, 0.999);

              vec3 col = mix(uBlue, uCyan, glow) ;
              col = mix(col, uCyanSoft, core * 0.6);
              col += vec3(1.0) * (core * core * 0.85 + tip * 1.6);

              float intensity = (glow * 0.35 + core * 1.25) * vis + tip * 1.2;
              float dimK = 1.0 - uDim * (1.0 - vPill);
              gl_FragColor = vec4(col * intensity * dimK, intensity * dimK);
            }
          `}
        />
      </mesh>
    </group>
  );
}
