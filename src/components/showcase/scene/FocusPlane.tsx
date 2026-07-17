"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  CanvasTexture,
  Color,
  Group,
  LinearFilter,
  LinearMipmapLinearFilter,
  ShaderMaterial,
  SRGBColorSpace,
  Vector2,
  Vector3,
} from "three";
import { act1 } from "../config";
import { progress } from "../scroll-store";
import { focusAnnotationOpacity, focusPlanePose } from "../choreography";
import { syncState } from "../sync-store";

// Plane dimensions (world units) — one type slab leaning back on the
// page-world, big enough to read in a 9:16 center crop.
const PLANE_W = 4.6;
const PLANE_H = 1.9;
const TEX_W = 1024;
const TEX_H = 424;

/** Draw the canonical focus phrase to a canvas (crisp master). */
function drawPhrase(font: string): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = TEX_W;
  c.height = TEX_H;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, TEX_W, TEX_H);
  ctx.fillStyle = "#eef3f7";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // -0.02em tracking (the .display rule) via canvas letterSpacing
  ctx.letterSpacing = "-4px";
  ctx.font = `700 210px ${font}`;
  ctx.fillText(act1.focusPhrase, TEX_W / 2, TEX_H / 2 + 12);
  return c;
}

/** Heavy, deterministic blur: a halving downscale pyramid, kept SMALL —
 *  the GPU's bilinear magnification does the smooth upscale (no canvas/SVG
 *  filters — v6 canon; built ONCE; also keeps the texture budget tiny). */
function blurred(src: HTMLCanvasElement): HTMLCanvasElement {
  let current: HTMLCanvasElement = src;
  let w = TEX_W;
  let h = TEX_H;
  while (w > 96) {
    w = Math.round(w / 2);
    h = Math.max(2, Math.round(h / 2));
    const small = document.createElement("canvas");
    small.width = w;
    small.height = h;
    const sctx = small.getContext("2d")!;
    sctx.imageSmoothingEnabled = true;
    sctx.imageSmoothingQuality = "high";
    sctx.drawImage(current, 0, 0, w, h);
    current = small;
  }
  return current;
}

const anchorLocal = new Vector3();

/**
 * T-309 — Act 1 "Focus". A blurred type plane glides right-to-left under the
 * cursor (the floor-world moves, not the cursor); a scroll-scrubbed circular
 * focus region — a capsule wake from the entry edge to the cursor's position
 * — resolves it to the crisp canonical phrase "why you?".
 *
 * Everything is a pure function of the damped store value → perfectly
 * reversible. Element discipline: this ONE plane + the cursor + ONE
 * annotation (`UNDER 5 SECONDS`) — nothing else in the act.
 */
export default function FocusPlane() {
  const groupRef = useRef<Group>(null);
  const matRef = useRef<ShaderMaterial>(null);
  const { camera, size } = useThree();
  const [textures, setTextures] = useState<{
    crisp: CanvasTexture;
    blur: CanvasTexture;
  } | null>(null);

  // Build the two textures once the display font is genuinely loaded
  // (flattened Space Grotesk — same file the SDF word uses).
  useEffect(() => {
    let alive = true;
    let created: { crisp: CanvasTexture; blur: CanvasTexture } | null = null;
    const face = new FontFace(
      "ShowcaseFocusGrotesk",
      "url(/showcase/fonts/SpaceGrotesk-Bold-flat.ttf)"
    );
    face
      .load()
      .then((loaded) => {
        if (!alive) return;
        document.fonts.add(loaded);
        const crispCanvas = drawPhrase("ShowcaseFocusGrotesk");
        const mk = (cv: HTMLCanvasElement) => {
          const t = new CanvasTexture(cv);
          t.colorSpace = SRGBColorSpace;
          t.minFilter = LinearMipmapLinearFilter;
          t.magFilter = LinearFilter;
          t.anisotropy = 4;
          return t;
        };
        created = { crisp: mk(crispCanvas), blur: mk(blurred(crispCanvas)) };
        setTextures(created);
      })
      .catch(() => {
        /* font failure → plane stays hidden; DOM copy still tells the act */
      });
    return () => {
      alive = false;
      created?.crisp.dispose();
      created?.blur.dispose();
    };
  }, []);

  const uniforms = useMemo(
    () => ({
      uCrisp: { value: null as CanvasTexture | null },
      uBlur: { value: null as CanvasTexture | null },
      uOpacity: { value: 0 },
      uRadius: { value: 0.3 },
      uWakeA: { value: new Vector2(-2.6, 0.1) },
      uWakeB: { value: new Vector2(-2.6, 0.1) },
      uCyan: { value: new Color("#69edfe") },
    }),
    []
  );

  useFrame(() => {
    const g = groupRef.current;
    const m = matRef.current;
    if (!g || !m) return;
    const v = progress();
    const pose = focusPlanePose(v);

    g.position.x = pose.x;
    g.visible = pose.opacity > 0.001 && !!textures;

    if (textures) {
      m.uniforms.uCrisp.value = textures.crisp;
      m.uniforms.uBlur.value = textures.blur;
    }
    m.uniforms.uOpacity.value = pose.opacity;
    m.uniforms.uRadius.value = pose.radius;
    // Wake front = the cursor's ACTUAL position in plane-local space
    // (T-330: the Act 1 cursor moved +30vh/+20vw — the wake follows the
    // cursor's real world x, written by CursorRig every frame).
    const localCursorX = Math.max(
      -2.6,
      Math.min(2.6, syncState.cursorWorld.x - pose.x)
    );
    m.uniforms.uWakeB.value.set(localCursorX, 0.1);

    // --- `UNDER 5 SECONDS` annotation — pinned to the plane's right edge ---
    const a = syncState.annotations.focus;
    const opacity = focusAnnotationOpacity(v);
    if (g.visible && opacity > 0.01) {
      anchorLocal.set(PLANE_W * 0.34, PLANE_H * 0.38, 0.05);
      g.localToWorld(anchorLocal);
      anchorLocal.project(camera);
      a.x = ((anchorLocal.x + 1) / 2) * size.width;
      a.y = ((1 - anchorLocal.y) / 2) * size.height;
      a.opacity = opacity;
      a.visible = true;
    } else {
      a.visible = false;
      a.opacity = 0;
    }
  });

  return (
    <group ref={groupRef} position={[3.6, -0.25, -0.5]} rotation={[-0.42, 0, 0]} visible={false}>
      <mesh>
        <planeGeometry args={[PLANE_W, PLANE_H]} />
        <shaderMaterial
          ref={matRef}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          vertexShader={/* glsl */ `
            varying vec2 vUv;
            varying vec2 vLocal;
            void main() {
              vUv = uv;
              vLocal = vec2(position.x, position.y);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={/* glsl */ `
            precision highp float;
            varying vec2 vUv;
            varying vec2 vLocal;
            uniform sampler2D uCrisp;
            uniform sampler2D uBlur;
            uniform float uOpacity;
            uniform float uRadius;
            uniform vec2 uWakeA;
            uniform vec2 uWakeB;
            uniform vec3 uCyan;

            // Capsule (segment) SDF — the focus wake behind the cursor
            float sdCapsule(vec2 p, vec2 a, vec2 b) {
              vec2 pa = p - a, ba = b - a;
              float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-5), 0.0, 1.0);
              return length(pa - ba * h);
            }

            void main() {
              float d = sdCapsule(vLocal, uWakeA, uWakeB) - uRadius;
              // Soft focus boundary (~0.28 world units wide)
              float focus = 1.0 - smoothstep(-0.14, 0.14, d);

              vec4 blurTex = texture2D(uBlur, vUv);
              vec4 crispTex = texture2D(uCrisp, vUv);
              // Out-of-focus state reads dimmer + hazy; crisp is full-strength
              vec4 col = mix(blurTex * vec4(vec3(0.62), 0.72), crispTex, focus);

              // Thin cyan rim right at the focus boundary — the "lens edge"
              float rim = (1.0 - smoothstep(0.0, 0.08, abs(d))) *
                          max(blurTex.a, crispTex.a);
              col.rgb += uCyan * rim * 0.55;
              col.a = max(col.a, rim * 0.5);

              gl_FragColor = vec4(col.rgb, col.a * uOpacity);
              if (gl_FragColor.a < 0.003) discard;
            }
          `}
        />
      </mesh>
    </group>
  );
}
