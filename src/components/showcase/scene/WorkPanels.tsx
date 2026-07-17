"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  ShaderMaterial,
  SRGBColorSpace,
  Texture,
  Vector2,
  Vector3,
} from "three";
import { PANELS } from "../panels-manifest";
import { progress, actProgress, clamp01, remap } from "../scroll-store";
import { WORK_QUEUE, workFocusIndex } from "../choreography";
import { syncState } from "../sync-store";
import { FLOOR_Y } from "./Stage";

// Thin 16:10 glass slabs (spec §3.3)
const PANEL_W = 2.3;
const PANEL_H = 1.44;
const RADIUS = 0.055;
const BASE_TILT = -0.07; // ~4° lean back
const HOVER_TILT = -0.14; // +8° hover-lift (glide-rule scale, panels only)

/**
 * One geometry for body + floor reflection: two identical quads; the second
 * (aMirror=1) is mirrored across the floor plane IN THE VERTEX SHADER, so a
 * panel + its reflection is exactly ONE draw call (shared geometry, material
 * clones — T-311 AC). Cheap shader material: emissive screen texture, rounded
 * corners, cyan edge light with a white-hot core. NEVER transmission.
 */
function createPanelGeometry(): BufferGeometry {
  const g = new BufferGeometry();
  const hw = PANEL_W / 2;
  const hh = PANEL_H / 2;
  const quad = [-hw, -hh, 0, hw, -hh, 0, -hw, hh, 0, hw, hh, 0];
  const uv = [0, 0, 1, 0, 0, 1, 1, 1];
  const positions = new Float32Array([...quad, ...quad]);
  const uvs = new Float32Array([...uv, ...uv]);
  const mirror = new Float32Array([0, 0, 0, 0, 1, 1, 1, 1]);
  const index = [0, 1, 2, 2, 1, 3, 4, 5, 6, 6, 5, 7];
  g.setAttribute("position", new BufferAttribute(positions, 3));
  g.setAttribute("uv", new BufferAttribute(uvs, 2));
  g.setAttribute("aMirror", new BufferAttribute(mirror, 1));
  g.setIndex(index);
  return g;
}

const VERT = /* glsl */ `
  attribute float aMirror;
  uniform float uFloorY;
  varying vec2 vUv;
  varying float vMirror;
  void main() {
    vUv = uv;
    vMirror = aMirror;
    vec4 w = modelMatrix * vec4(position, 1.0);
    if (aMirror > 0.5) w.y = 2.0 * uFloorY - w.y;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying float vMirror;
  uniform sampler2D uMap;
  uniform vec2 uCover;     // cover-fit uv scale
  uniform float uHover;
  uniform float uOpacity;
  uniform vec3 uCyan;
  uniform vec3 uCyanSoft;

  float sdRoundedBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }

  void main() {
    vec2 local = (vUv - 0.5) * vec2(${PANEL_W.toFixed(3)}, ${PANEL_H.toFixed(3)});
    float sd = sdRoundedBox(local, vec2(${(PANEL_W / 2).toFixed(3)}, ${(PANEL_H / 2).toFixed(3)}), ${RADIUS.toFixed(3)});
    float inside = 1.0 - smoothstep(-0.004, 0.004, sd);
    if (inside < 0.01) discard;

    // Emissive "live screen" — cover-fit
    vec2 uvFit = (vUv - 0.5) * uCover + 0.5;
    vec3 img = texture2D(uMap, uvFit).rgb;
    vec3 col = img * (0.82 + 0.38 * uHover);

    // Cyan edge light with white-hot core; swells on hover
    float edgeDist = abs(sd + 0.012);
    float glowW = 0.028 + 0.05 * uHover;
    float edge = 1.0 - smoothstep(0.0, glowW, edgeDist);
    float core = 1.0 - smoothstep(0.0, 0.008, edgeDist);
    vec3 edgeCol = mix(uCyan, vec3(1.0), core * 0.85);
    col += edgeCol * edge * (0.55 + 1.5 * uHover);
    // faint cool glass sheen toward the top of the slab
    col += uCyanSoft * (vUv.y * vUv.y) * 0.045;

    float alpha = inside * uOpacity;
    // Reflection quad: SOFT — a faint glassy sheen, not a mirrored copy
    float refl = 0.16 * pow(max(1.0 - vUv.y, 0.0), 2.6);
    alpha *= mix(1.0, refl, vMirror);
    col *= mix(1.0, 0.62, vMirror);

    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
    if (gl_FragColor.a < 0.01) discard;
  }
`;

const anchor = new Vector3();
const corner = new Vector3();

export default function WorkPanels() {
  const { camera, size } = useThree();
  const groupRefs = useRef<(Group | null)[]>([]);
  const textures = useTexture(PANELS.map((p) => p.file));

  useEffect(() => {
    textures.forEach((t: Texture) => {
      t.colorSpace = SRGBColorSpace;
      t.anisotropy = 4;
    });
  }, [textures]);

  const geometry = useMemo(() => createPanelGeometry(), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const materials = useMemo(
    () =>
      PANELS.map((p) => {
        // cover-fit: scale uv so the texture fills 16:10 without stretching
        const panelAspect = PANEL_W / PANEL_H;
        const texAspect = p.width / p.height;
        const cover =
          texAspect > panelAspect
            ? new Vector2(panelAspect / texAspect, 1)
            : new Vector2(1, texAspect / panelAspect);
        return new ShaderMaterial({
          vertexShader: VERT,
          fragmentShader: FRAG,
          transparent: true,
          depthWrite: false,
          side: DoubleSide,
          uniforms: {
            uMap: { value: null },
            uCover: { value: cover },
            uHover: { value: 0 },
            uOpacity: { value: 0 },
            uFloorY: { value: FLOOR_Y },
            uCyan: { value: new Color("#69edfe") },
            uCyanSoft: { value: new Color("#a6f4ff") },
          },
        });
      }),
    []
  );
  useEffect(() => () => materials.forEach((m) => m.dispose()), [materials]);

  // Sync store slots for the DOM tag + clickable-link layers
  useEffect(() => {
    syncState.panelTags = PANELS.map(() => ({ x: 0, y: 0, opacity: 0, chars: 0 }));
    syncState.panelHits = PANELS.map(() => ({
      x: 0,
      y: 0,
      w: 0,
      h: 0,
      active: false,
    }));
    return () => {
      syncState.panelTags = [];
      syncState.panelHits = [];
    };
  }, []);

  useFrame(() => {
    const v = progress();
    const g = workFocusIndex(v);
    const workP = actProgress("work", v);
    const buildP = actProgress("build", v);
    // Panels exist only around their act (plus the exit into the build act)
    const actGate =
      remap(workP, 0, 0.03) * (1 - remap(buildP, 0.22, 0.38));

    for (let i = 0; i < PANELS.length; i++) {
      const node = groupRefs.current[i];
      const mat = materials[i];
      const tag = syncState.panelTags[i];
      if (!node || !mat) continue;

      const x = (i - g) * WORK_QUEUE.spacing;
      const visible = actGate > 0.001 && Math.abs(x) < 8;
      node.visible = visible;
      const hit = syncState.panelHits[i];
      if (!visible) {
        if (tag) {
          tag.opacity = 0;
          tag.chars = 0;
        }
        if (hit) hit.active = false;
        continue;
      }

      // Hover-lift: purely position-derived → fires at fixed scroll
      // positions, equal holds for all six (queue plateaus in choreography)
      const hover = 1 - smooth01(remap(Math.abs(x), 0.55, 1.7));

      // Shallow right-to-left arc queue
      node.position.set(
        x,
        -0.15 + 0.05 * Math.cos(x * 0.5) + 0.18 * hover,
        0.3 - Math.abs(x) * 0.18
      );
      node.rotation.set(BASE_TILT + HOVER_TILT * hover, x * -0.04, 0);

      mat.uniforms.uHover.value = hover;
      mat.uniforms.uOpacity.value =
        actGate * (1 - smooth01(remap(Math.abs(x), 4.4, 6.2)));

      if (mat.uniforms.uMap.value !== textures[i]) {
        mat.uniforms.uMap.value = textures[i];
      }

      // --- clickable link overlay rect (§3b.3 — /projects/[slug]) -------
      // Project the panel's four corners; the DOM layer places an <a>
      // over the bounding box. Only clearly-visible panels are active
      // (pointer events + tab order gated in PanelLinksLayer).
      if (hit) {
        node.updateMatrixWorld();
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        for (let cy = -1; cy <= 1; cy += 2) {
          for (let cx = -1; cx <= 1; cx += 2) {
            corner
              .set((cx * PANEL_W) / 2, (cy * PANEL_H) / 2, 0)
              .applyMatrix4(node.matrixWorld)
              .project(camera);
            const sx = ((corner.x + 1) / 2) * size.width;
            const sy = ((1 - corner.y) / 2) * size.height;
            if (sx < minX) minX = sx;
            if (sy < minY) minY = sy;
            if (sx > maxX) maxX = sx;
            if (sy > maxY) maxY = sy;
          }
        }
        hit.x = minX;
        hit.y = minY;
        hit.w = maxX - minX;
        hit.h = maxY - minY;
        hit.active = mat.uniforms.uOpacity.value > 0.35;
      }

      // --- mono tag anchor (below the panel's front face) ---------------
      if (tag) {
        anchor.set(0, -PANEL_H / 2 - 0.22, 0.02);
        node.localToWorld(anchor);
        anchor.project(camera);
        tag.x = ((anchor.x + 1) / 2) * size.width;
        tag.y = ((1 - anchor.y) / 2) * size.height;
        tag.opacity = clamp01(remap(hover, 0.3, 0.85)) * actGate;
        tag.chars = Math.round(
          PANELS[i].tag.length * clamp01(remap(hover, 0.15, 0.9))
        );
      }
    }
  });

  return (
    <>
      {PANELS.map((p, i) => (
        <group
          key={p.slug}
          ref={(el) => {
            groupRefs.current[i] = el;
          }}
          visible={false}
        >
          <mesh geometry={geometry} material={materials[i]} />
        </group>
      ))}
    </>
  );
}

function smooth01(t: number) {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
}
