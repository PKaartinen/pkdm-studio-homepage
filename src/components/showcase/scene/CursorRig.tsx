"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MathUtils, Vector3 } from "three";
import type { Group } from "three";
import { progress, remap } from "../scroll-store";
import {
  clickPose,
  cursorTarget,
  cursorViewportOffset,
  heroBlend,
  HERO_DROP_VH,
} from "../choreography";
import { syncState } from "../sync-store";
import { tourState } from "../tour-store";
import GlassCursor from "./GlassCursor";

const ray = new Vector3();
const ndcTmp = new Vector3();

// -------------------------------------------------------------------------
// GLIDE RULE (hard canon, asserted): a cursor GLIDES. It never rolls, never
// flips, never goes upside-down. Total tilt on any axis stays ≤ 15°.
// Pointer lean is damped and capped at ±5°.
// -------------------------------------------------------------------------
const MAX_TILT = MathUtils.degToRad(15);
const LEAN_CAP = MathUtils.degToRad(5);

// Base pose chosen so pose + max lean + breathing stays inside MAX_TILT.
const BASE_ROT = { x: 0.06, y: -0.17, z: -0.1 };

function clampTilt(v: number): number {
  const c = MathUtils.clamp(v, -MAX_TILT, MAX_TILT);
  if (process.env.NODE_ENV !== "production") {
    console.assert(
      Math.abs(v) <= MAX_TILT + 1e-6,
      `Glide rule violated: tilt ${MathUtils.radToDeg(v).toFixed(2)}° > 15°`
    );
  }
  return c;
}

/**
 * Cursor rig — hero anchor follows the measured "convert." rect (overlap
 * holds at every viewport width) + T-307 idle motion: two-phase hover-bob,
 * damped pointer lean (≤±5°), caustic pulse sync. Reduced motion → static.
 */
export default function CursorRig({
  cursorRef,
  variant,
}: {
  cursorRef: React.RefObject<Group | null>;
  variant: number;
}) {
  const { camera, size, pointer } = useThree();
  const innerRef = useRef<Group>(null);
  const lean = useRef({ x: 0, y: 0 });
  // T-314 — real-cursor sync engagement (damped, hysteresis radii)
  const engage = useRef(0);
  const lastPress = useRef(0);
  // Real pointer in screen px via a WINDOW listener — the scrolling DOM
  // layer sits above the canvas, so the R3F pointer never updates here.
  const realPtr = useRef({ x: 0, y: 0, has: false });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      realPtr.current.x = e.clientX;
      realPtr.current.y = e.clientY;
      realPtr.current.has = true;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const reduceMotion = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  // T-314 — the user's real click triggers the 3D press exactly once per
  // click (cooldown; no spam). Inert under tour mode + reduced motion.
  useEffect(() => {
    if (reduceMotion) return;
    const onClick = () => {
      if (tourState.active) return;
      const now = performance.now();
      if (engage.current < 0.5) return;
      if (now - lastPress.current < 700) return;
      lastPress.current = now;
      syncState.finale.pressAt = now;
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [reduceMotion]);

  useFrame((state, delta) => {
    const g = cursorRef.current;
    const rect = syncState.wordRect;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const v = progress();

    // --- Hero anchor from the DOM twin (layout-follow) --------------------
    let heroX = 0;
    let heroY = 0;
    let hasRect = false;
    if (rect && rect.width > 0) {
      const px = rect.left + rect.width / 2 + rect.fontSize * 0.95;
      // §3b.1 — hero cursor sits ~10vh lower so its bottom half catches the
      // grid/caustic refraction on the very first frame.
      const py =
        rect.top +
        rect.height / 2 +
        rect.fontSize * 0.55 +
        size.height * (HERO_DROP_VH / 100);
      const ndcX = (px / size.width) * 2 - 1;
      const ndcY = -((py / size.height) * 2 - 1);
      ray.set(ndcX, ndcY, 0.5).unproject(camera);
      ray.sub(camera.position).normalize();
      const dist = (0 - camera.position.z) / ray.z;
      heroX = camera.position.x + ray.x * dist;
      heroY = camera.position.y + ray.y * dist;
      hasRect = true;
    }

    // --- T-308/T-330 master choreography: hero anchor → SPLINE path -------
    // (§3b.6: cursorTarget is a C1 Hermite spline through 2D waypoints —
    // no straight segment-to-segment travel anywhere in the timeline)
    const ct = cursorTarget(v);
    const w = hasRect ? heroBlend(v) : 1;
    let tx = MathUtils.lerp(heroX, ct.x, w);
    let ty = MathUtils.lerp(heroY, ct.y, w);
    if (!hasRect && w < 1) return; // hero not measured yet — wait one frame

    // --- §3b notes 2 & 5 — per-act viewport offsets (exact vh/vw shifts) --
    // Convert through the live camera at the cursor's z=0 plane: project the
    // target, shift in NDC (1vh = 0.02 NDC, 1vw = 0.02 NDC), unproject back.
    const off = cursorViewportOffset(v);
    if (off.vw !== 0 || off.vh !== 0) {
      ndcTmp.set(tx, ty, 0).project(camera);
      ndcTmp.x += (off.vw / 100) * 2;
      ndcTmp.y -= (off.vh / 100) * 2;
      ndcTmp.unproject(camera);
      tx = ndcTmp.x;
      ty = ndcTmp.y;
    }

    // --- T-313 finale: hover micro magnetic pull + the CLICK press-down ---
    // Pure function of the damped value (+ the T-314 interactive envelope,
    // which is time-based and NEVER touches the scrubbed choreography).
    let pressTilt = 0;
    const pose = clickPose(v);
    if (pose.grow > 0) {
      const fin = syncState.finale;
      // micro magnetic pull toward the button center during the hover state
      tx += (fin.buttonWorld.x - tx) * 0.1 * pose.hover;
      const press = MathUtils.clamp(
        pose.press + fin.interactivePress,
        -0.35,
        1
      );
      // press DOWN toward the button; slight lift on the spring overshoot
      ty -= Math.max(0, press) * 0.52 + Math.min(0, press) * 0.18;
      pressTilt = Math.max(0, press) * 0.08; // stays inside the 15° clamp

      // --- T-314 — real-cursor sync near the finale CTA -------------------
      // Signature interaction (Should, cut-safe): as the user's pointer
      // nears the CTA, the giant cursor aligns with it (damped, positional
      // cap) and presses when they click. Engage/disengage with hysteresis;
      // scaled away during the scripted press so it NEVER fights the scroll
      // choreography. Inert under tour mode + reduced motion.
      if (!reduceMotion && !tourState.active && realPtr.current.has) {
        const psx = realPtr.current.x;
        const psy = realPtr.current.y;
        const dPx = Math.hypot(psx - fin.button.x, psy - fin.button.y);
        const ENGAGE_R = 200;
        const DISENGAGE_R = 300;
        const targetEngage =
          pose.p > 0.4 && fin.button.visible
            ? dPx < ENGAGE_R
              ? 1
              : dPx > DISENGAGE_R
                ? 0
                : engage.current > 0.5
                  ? 1
                  : 0
            : 0;
        // heavy damping (≥0.9 retention per frame at 60fps)
        const ke = 1 - Math.exp(-delta / 0.35);
        engage.current += (targetEngage - engage.current) * ke;
        const eff =
          engage.current *
          (1 - Math.max(0, press)) * // any press (scripted OR real) wins
          remap(pose.p, 0.4, 0.48);
        if (eff > 0.001) {
          // pointer world position on the cursor's z=0 plane
          const ndcX = (psx / size.width) * 2 - 1;
          const ndcY = -((psy / size.height) * 2 - 1);
          ray
            .set(ndcX, ndcY, 0.5)
            .unproject(camera)
            .sub(camera.position)
            .normalize();
          const dist = (0 - camera.position.z) / ray.z;
          // Align the cursor TIP with the pointer (the tip sits down-left
          // of the body center) — the two cursors meet point-to-point.
          const pwx = camera.position.x + ray.x * dist + 0.5;
          const pwy = camera.position.y + ray.y * dist + 0.72;
          // positional cap: the cursor never strays far from its park pose
          const CAP = 0.6; // world units at z=0
          let ox = (pwx - tx) * eff;
          let oy = (pwy - ty) * eff;
          const om = Math.hypot(ox, oy);
          if (om > CAP) {
            ox = (ox / om) * CAP;
            oy = (oy / om) * CAP;
          }
          tx += ox;
          ty += oy;
        }
        fin.engaged = eff;
      } else {
        engage.current = 0;
        fin.engaged = 0;
      }
    }

    // --- Idle hover-bob: two offset sine phases (house organic motion) ----
    let bob = 0;
    if (!reduceMotion) {
      bob = Math.sin(t * 0.8) * 0.7 + Math.sin(t * 1.31 + 1.7) * 0.3;
      ty += bob * 0.075;
      tx += Math.sin(t * 0.53 + 0.6) * 0.03;
    }
    syncState.bob = bob;

    g.position.x = MathUtils.lerp(g.position.x, tx, 0.18);
    g.position.y = MathUtils.lerp(g.position.y, ty, 0.18);

    // World position for the focus wake (FocusPlane) + screen position for
    // QA path traces (pure derivations of the damped value — reversible).
    syncState.cursorWorld.x = g.position.x;
    syncState.cursorWorld.y = g.position.y;
    ndcTmp.set(g.position.x, g.position.y, 0).project(camera);
    const sx = ((ndcTmp.x + 1) / 2) * size.width;
    const sy = ((1 - ndcTmp.y) / 2) * size.height;
    syncState.cursorScreen.x = sx;
    syncState.cursorScreen.y = sy;
    (window as unknown as { __cursorScreen?: { x: number; y: number } }).__cursorScreen =
      { x: sx, y: sy };

    // --- Damped lean toward the real pointer (≤ ±5°) ----------------------
    const k = 1 - Math.exp(-delta / 0.28); // heavy damping, no jitter
    const targetLeanY = reduceMotion
      ? 0
      : MathUtils.clamp(pointer.x * LEAN_CAP, -LEAN_CAP, LEAN_CAP);
    const targetLeanX = reduceMotion
      ? 0
      : MathUtils.clamp(-pointer.y * LEAN_CAP * 0.7, -LEAN_CAP, LEAN_CAP);
    lean.current.y += (targetLeanY - lean.current.y) * k;
    lean.current.x += (targetLeanX - lean.current.x) * k;

    // --- Compose rotation; breathing micro-tilt; CLAMP (glide rule) -------
    const breathZ = reduceMotion ? 0 : Math.sin(t * 0.66 + 0.9) * 0.02;
    g.rotation.x = clampTilt(BASE_ROT.x + lean.current.x + pressTilt);
    g.rotation.y = clampTilt(BASE_ROT.y + lean.current.y);
    g.rotation.z = clampTilt(BASE_ROT.z + breathZ);

    if (process.env.NODE_ENV !== "production") {
      // QA probe: max observed |rotation| in degrees (tilt-clamp evidence)
      const w = window as unknown as { __cursorMaxTiltDeg?: number };
      const m = Math.max(
        Math.abs(g.rotation.x),
        Math.abs(g.rotation.y),
        Math.abs(g.rotation.z)
      );
      w.__cursorMaxTiltDeg = Math.max(
        w.__cursorMaxTiltDeg ?? 0,
        MathUtils.radToDeg(m)
      );
    }
  });

  return (
    <group ref={cursorRef} position={[1.18, -0.18, 0]} rotation={[BASE_ROT.x, BASE_ROT.y, BASE_ROT.z]}>
      <group ref={innerRef} scale={0.85}>
        <GlassCursor variant={variant} />
      </group>
    </group>
  );
}
