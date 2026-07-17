"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  ShaderMaterial,
  Vector2,
} from "three";
import type { Group } from "three";
import { syncState } from "../sync-store";
import { progress } from "../scroll-store";
import { clickPose } from "../choreography";

export const FLOOR_Y = -1.42;

/**
 * The void floor — "the webpage canvas" (spec §2a): a barely-visible hairline
 * design-canvas grid that brightens locally under the cursor's cyan caustic
 * light pool. Additive shader; crisp AA hairlines (rays-not-smoke: defined
 * edges, white-hot core in the pool center, zero fog washes).
 */
export default function Stage({
  cursorRef,
}: {
  cursorRef: React.RefObject<Group | null>;
}) {
  const matRef = useRef<ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uCursor: { value: new Vector2(1.85, 0) },
      uPulse: { value: 1 },
      uCyan: { value: new Color("#69edfe") },
      uCyanSoft: { value: new Color("#a6f4ff") },
      uBlue: { value: new Color("#1f9fd6") },
      uDeep: { value: new Color("#0167b4") },
      // T-313 — click ripple shockwave (vertex displacement, NO fluid sim).
      // Ripple 1 = the scrubbed finale click (pure function of the store).
      // Ripple 2 = the interactive real-click ripple (T-314, time-based).
      uRippleC: { value: new Vector2(1.3, 0.33) },
      uRipple1: { value: new Vector2(0, 0) }, // (radius, amplitude)
      uRipple2: { value: new Vector2(0, 0) },
    }),
    []
  );

  useFrame((state) => {
    const m = matRef.current;
    if (!m) return;
    m.uniforms.uTime.value = state.clock.elapsedTime;
    // Pulse synced to the hover-bob (T-307): light breathes with the motion.
    m.uniforms.uPulse.value = 1 + syncState.bob * 0.14;
    const g = cursorRef.current;
    if (g) {
      m.uniforms.uCursor.value.set(g.position.x, g.position.z);
    }
    // T-313 — the scrubbed click ripple, reversible by construction
    const pose = clickPose(progress());
    const fin = syncState.finale;
    m.uniforms.uRippleC.value.set(fin.buttonWorld.x, fin.buttonWorld.z);
    m.uniforms.uRipple1.value.set(pose.rippleR, pose.rippleAmp);
    // T-314 — interactive ripple (event-driven; zero when idle)
    m.uniforms.uRipple2.value.set(fin.ripple2.r, fin.ripple2.amp);
  });

  return (
    <mesh position={[0, FLOOR_Y, -2]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[70, 44, 300, 190]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        side={DoubleSide}
        vertexShader={/* glsl */ `
          varying vec2 vWorld;
          varying float vRipple;
          uniform vec2 uRippleC;
          uniform vec2 uRipple1;
          uniform vec2 uRipple2;

          // Expanding ring wave packet — crest at dist == radius
          float ringWave(float d, vec2 rip, out float glow) {
            float x = d - rip.x;
            float env = exp(-x * x * 3.2) * rip.y;
            glow = env;
            return env * cos(x * 3.4);
          }

          void main() {
            vec4 wp = modelMatrix * vec4(position, 1.0);
            float d = distance(wp.xz, uRippleC);
            float g1; float g2;
            wp.y += ringWave(d, uRipple1, g1);
            wp.y += ringWave(d, uRipple2, g2);
            vRipple = g1 + g2;
            vWorld = wp.xz;
            gl_Position = projectionMatrix * viewMatrix * wp;
          }
        `}
        fragmentShader={/* glsl */ `
          precision highp float;
          varying vec2 vWorld;
          varying float vRipple;
          uniform float uTime;
          uniform vec2 uCursor;
          uniform float uPulse;
          uniform vec3 uCyan;
          uniform vec3 uCyanSoft;
          uniform vec3 uBlue;
          uniform vec3 uDeep;

          // AA hairline grid in world space
          float gridLine(vec2 p, float spacing) {
            vec2 g = abs(fract(p / spacing - 0.5) - 0.5) * spacing;
            float d = min(g.x, g.y);
            float w = fwidth(d) * 1.2;
            return 1.0 - smoothstep(0.0, w + 0.012, d);
          }

          // Fake caustic — interfering moving waves, sharpened to a web
          float caustic(vec2 p, float t) {
            vec2 q = p * 2.7;
            float a = sin(q.x * 1.7 + t * 0.9) * sin(q.y * 1.4 - t * 0.7);
            float b = sin((q.x + q.y) * 1.15 + t * 1.3) * sin((q.x - q.y) * 1.65 + t * 0.5);
            float c = a + b;
            float web = pow(clamp(0.5 + 0.5 * c, 0.0, 1.0), 8.0);
            float web2 = pow(clamp(0.5 - 0.5 * c, 0.0, 1.0), 8.0);
            return web + web2 * 0.6;
          }

          void main() {
            float dist = distance(vWorld, uCursor);

            // Light pool falloff around the cursor's floor projection
            float pool = exp(-dist * dist * 0.42) * uPulse;

            // Hairline grid: barely visible in the void, brightens in pool
            float line = gridLine(vWorld, 0.62);
            float gridBase = 0.07;
            float gridBoost = 0.5 * pool;
            vec3 gridCol = mix(uDeep, uCyan, clamp(pool * 1.4, 0.0, 1.0));
            vec3 col = line * (gridBase + gridBoost) * gridCol * 2.0;

            // Caustic pattern inside the pool, cyan with white-hot core
            float ca = caustic(vWorld, uTime) * pool;
            vec3 caCol = mix(uBlue, uCyanSoft, clamp(ca * 1.6, 0.0, 1.0));
            col += ca * caCol * 1.1;
            // White-hot core at pool center
            float core = exp(-dist * dist * 1.6) * uPulse;
            col += core * ca * vec3(1.0) * 0.8;

            // Gentle deep-blue ambient so the floor plane reads (no murk)
            float amb = exp(-dist * 0.22) * 0.05;
            col += amb * uDeep;

            // T-313 — the ripple ring lights the grid it rolls across:
            // cyan front with a white-hot crest (defined edges, no fog)
            float ring = clamp(vRipple * 3.2, 0.0, 1.2);
            vec3 ringCol = mix(uCyan, uCyanSoft, ring * 0.6);
            col += ring * ringCol * (0.5 + line * 1.6);
            col += pow(ring, 3.0) * vec3(1.0) * 0.35;

            float alpha = clamp(max(max(col.r, col.g), col.b), 0.0, 1.0);
            gl_FragColor = vec4(col, alpha);
          }
        `}
      />
    </mesh>
  );
}
