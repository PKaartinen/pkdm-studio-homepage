"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  MathUtils,
  Mesh,
  MeshPhysicalMaterial,
  PlaneGeometry,
  Shape,
  ShaderMaterial,
  Vector3,
} from "three";
import { progress } from "../scroll-store";
import { clickPose, FINALE } from "../choreography";
import { syncState } from "../sync-store";
import { FLOOR_Y } from "./Stage";

// ---------------------------------------------------------------------------
// T-313 — the giant glass button. Grows out of the BuildSkeleton's flat CTA
// pill (exact world hand-off), receives the rim-light convergence + hover
// swell, then depresses and springs back under the cursor's click. NEVER
// transmission (hard canon: the cursor is the only transmissive mesh) — the
// glass read comes from a cheap physical body + an additive fresnel rim
// shell, exactly the work-panel recipe. The DOM CTA pixel-parks on this
// button's projected center every frame (B2-Q4 resolved in the DOM layer).
//
// T-314 — the interactive press envelope is computed HERE once per frame
// (single writer) and mirrored to syncState.finale so CursorRig + Stage stay
// in perfect sync with the button's own depress.
// ---------------------------------------------------------------------------

const DEPTH = 0.13;

/** Interactive press envelope — same shape as the scrubbed press (down
 *  ~90ms, eased spring-back with overshoot ~600ms). Time-based + event-
 *  driven, so it never touches scrub reversibility. */
export function interactivePressEnvelope(nowMs: number): number {
  const at = syncState.finale.pressAt;
  if (!at) return 0;
  const dt = (nowMs - at) / 1000;
  if (dt < 0 || dt > 0.75) return 0;
  if (dt < 0.09) {
    const u = dt / 0.09;
    return u * u * (3 - 2 * u);
  }
  const rel = (dt - 0.09) / 0.66;
  return Math.cos(rel * Math.PI * 2.2) * Math.exp(-rel * 4.2);
}

function createButtonGeometry(): ExtrudeGeometry {
  const w = FINALE.pillW;
  const h = FINALE.pillH;
  const r = h / 2;
  const s = new Shape();
  const hw = w / 2 - r;
  const hh = h / 2;
  s.moveTo(-hw, -hh);
  s.lineTo(hw, -hh);
  s.absarc(hw, 0, r, -Math.PI / 2, Math.PI / 2, false);
  s.lineTo(-hw, hh);
  s.absarc(-hw, 0, r, Math.PI / 2, (3 * Math.PI) / 2, false);
  const g = new ExtrudeGeometry(s, {
    depth: DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.045,
    bevelSize: 0.04,
    bevelSegments: 4,
    curveSegments: 24,
  });
  g.translate(0, 0, -DEPTH / 2);
  return g;
}

const RIM_VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
const RIM_FRAG = /* glsl */ `
  precision highp float;
  varying vec3 vNormal;
  varying vec3 vView;
  uniform float uGlow;
  uniform vec3 uCyan;
  uniform vec3 uCyanSoft;
  void main() {
    float fres = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 2.2);
    // defined rim with a white-hot core at grazing angles (rays not smoke)
    float core = pow(fres, 3.0);
    vec3 col = mix(uCyan, uCyanSoft, core) + vec3(1.0) * core * 0.7;
    float a = fres * uGlow;
    gl_FragColor = vec4(col * a, a);
  }
`;

// Convergence ray — a thin luminous hairline sliding in toward the button
const RAY_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const RAY_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uK;
  uniform vec3 uCyan;
  void main() {
    // crisp hairline core across, brightening toward the inner (button) end
    float across = 1.0 - smoothstep(0.0, 0.5, abs(vUv.y - 0.5));
    float core = pow(across, 6.0);
    float along = pow(vUv.x, 1.6); // uv.x = 1 at the button end
    vec3 col = uCyan + vec3(1.0) * core * 0.8;
    float a = (0.25 * across + core) * along * uK;
    gl_FragColor = vec4(col * a, a);
  }
`;

// Focusing glow disc on the floor beneath the button
const DISC_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uK;
  uniform vec3 uCyan;
  uniform vec3 uDeep;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float fall = exp(-d * d * 5.0);
    float core = exp(-d * d * 18.0);
    vec3 col = mix(uDeep, uCyan, fall) * fall + vec3(1.0) * core * 0.35;
    float a = fall * uK;
    gl_FragColor = vec4(col * a, a);
  }
`;

const tmp = new Vector3();
const press3 = { down: new Vector3(0, Math.sin(FINALE.pillWorld.rotX), Math.cos(FINALE.pillWorld.rotX)) };

export default function FinaleButton() {
  const { camera, size } = useThree();
  const groupRef = useRef<Group>(null);
  const bodyRef = useRef<Mesh>(null);
  const rimMat = useRef<ShaderMaterial>(null);
  const rayL = useRef<Mesh>(null);
  const rayR = useRef<Mesh>(null);
  const rayMatL = useRef<ShaderMaterial>(null);
  const rayMatR = useRef<ShaderMaterial>(null);
  const discMat = useRef<ShaderMaterial>(null);
  const discRef = useRef<Mesh>(null);

  const geometry = useMemo(() => createButtonGeometry(), []);
  const rayGeometry = useMemo(() => new PlaneGeometry(4.2, 0.09, 1, 1), []);
  const discGeometry = useMemo(() => new PlaneGeometry(4.6, 4.6, 1, 1), []);
  const bodyMaterial = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: new Color("#eaf6fb"),
        transparent: true,
        opacity: 0.34,
        roughness: 0.1,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        envMapIntensity: 2.4,
        emissive: new Color("#062433"),
        emissiveIntensity: 0.55,
        depthWrite: false,
      }),
    []
  );
  useEffect(
    () => () => {
      geometry.dispose();
      rayGeometry.dispose();
      discGeometry.dispose();
      bodyMaterial.dispose();
    },
    [geometry, rayGeometry, discGeometry, bodyMaterial]
  );

  const rimUniforms = useMemo(
    () => ({
      uGlow: { value: 0 },
      uCyan: { value: new Color("#69edfe") },
      uCyanSoft: { value: new Color("#a6f4ff") },
    }),
    []
  );
  const rayUniformsL = useMemo(
    () => ({ uK: { value: 0 }, uCyan: { value: new Color("#69edfe") } }),
    []
  );
  const rayUniformsR = useMemo(
    () => ({ uK: { value: 0 }, uCyan: { value: new Color("#69edfe") } }),
    []
  );
  const discUniforms = useMemo(
    () => ({
      uK: { value: 0 },
      uCyan: { value: new Color("#69edfe") },
      uDeep: { value: new Color("#0167b4") },
    }),
    []
  );

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    const v = progress();
    const pose = clickPose(v);
    const fin = syncState.finale;

    // T-314 — interactive press envelope (single writer; CursorRig + Stage read)
    const ip = interactivePressEnvelope(performance.now());
    fin.interactivePress = ip;
    if (ip !== 0) {
      const dt = (performance.now() - fin.pressAt) / 1000;
      const r = MathUtils.clamp((dt - 0.06) / 1.1, 0, 1);
      fin.ripple2.r = 20 * (1 - (1 - r) * (1 - r));
      fin.ripple2.amp =
        r <= 0 ? 0 : Math.pow(1 - r, 1.4) * 0.26;
    } else if (fin.ripple2.amp !== 0) {
      const dt = fin.pressAt ? (performance.now() - fin.pressAt) / 1000 : 99;
      const r = MathUtils.clamp((dt - 0.06) / 1.1, 0, 1);
      fin.ripple2.r = 20 * (1 - (1 - r) * (1 - r));
      fin.ripple2.amp = r >= 1 ? 0 : Math.pow(1 - r, 1.4) * 0.26;
    }

    const visible = pose.grow > 0.001;
    g.visible = visible;
    if (!visible) {
      fin.button.visible = false;
      fin.button.opacity = 0;
      return;
    }

    // Park point: unproject the accepted seam (65vw / 76svh) at the pill's
    // z-plane through the LIVE camera — the DOM CTA and the 3D button meet
    // at the same pixel at every viewport size (B2-Q4).
    const ndcX = (FINALE.parkVW / 100) * 2 - 1;
    const ndcY = -((FINALE.parkVH / 100) * 2 - 1);
    tmp.set(ndcX, ndcY, 0.5).unproject(camera);
    tmp.sub(camera.position).normalize();
    const dist = (FINALE.pillWorld.z - camera.position.z) / tmp.z;
    const parkX = camera.position.x + tmp.x * dist;
    const parkY = camera.position.y + tmp.y * dist;

    // Grow from the exact skeleton-pill spot to the park point
    const px = MathUtils.lerp(FINALE.pillWorld.x, parkX, pose.grow);
    const py = MathUtils.lerp(FINALE.pillWorld.y, parkY, pose.grow);
    let pz = FINALE.pillWorld.z;

    // THE CLICK — depress along the button's normal + spring-back
    const press = MathUtils.clamp(pose.press + ip, -0.35, 1);
    const dy = press3.down.y * press * 0.11;
    const dz = press3.down.z * press * 0.11;

    g.position.set(px, py - dy, pz - dz);
    const s =
      FINALE.handoffScale * MathUtils.lerp(1, FINALE.growScale, pose.grow);
    g.scale.set(s, s, s * (1 - 0.22 * Math.max(0, press)));

    // Glow: convergence + hover swell + press flash
    const glow =
      0.28 * pose.converge +
      0.85 * pose.hover +
      Math.max(0, press) * 0.7 +
      Math.max(0, -press) * 2.2;
    if (rimMat.current) rimMat.current.uniforms.uGlow.value = 0.35 + glow;
    bodyMaterial.opacity = 0.34 * pose.grow + 0.08;
    bodyMaterial.emissiveIntensity = 0.55 + glow * 0.5;

    // Rim-light convergence rays slide in from up-left / up-right
    const k = pose.converge * (1 - Math.max(0, press) * 0.4);
    if (rayMatL.current) rayMatL.current.uniforms.uK.value = k * 0.9;
    if (rayMatR.current) rayMatR.current.uniforms.uK.value = k * 0.9;
    const slide = (1 - pose.converge) * 1.6;
    if (rayL.current) rayL.current.position.set(-2.3 - slide, 1.15 + slide * 0.55, -0.1);
    if (rayR.current) rayR.current.position.set(2.3 + slide, 1.15 + slide * 0.55, -0.1);

    // Focusing floor glow beneath the button
    if (discMat.current)
      discMat.current.uniforms.uK.value =
        (0.3 * pose.converge + 0.5 * pose.hover + Math.max(0, press)) *
        pose.grow;
    if (discRef.current) {
      const f = 1 - 0.35 * pose.converge; // light focuses in
      discRef.current.scale.set(f, f, 1);
      discRef.current.position.set(px, FLOOR_Y + 0.02, pz);
    }

    // Publish: screen center for the DOM CTA + world pos for ripple/cursor
    fin.buttonWorld.x = px;
    fin.buttonWorld.y = py;
    fin.buttonWorld.z = pz;
    tmp.set(px, py, pz).project(camera);
    fin.button.x = ((tmp.x + 1) / 2) * size.width;
    fin.button.y = ((1 - tmp.y) / 2) * size.height;
    fin.button.opacity = pose.ctaOpacity;
    fin.button.visible = pose.ctaOpacity > 0.01;
  });

  return (
    <>
      <group
        ref={groupRef}
        position={[FINALE.pillWorld.x, FINALE.pillWorld.y, FINALE.pillWorld.z]}
        rotation={[FINALE.pillWorld.rotX, 0, 0]}
        visible={false}
      >
        <mesh ref={bodyRef} geometry={geometry} material={bodyMaterial} />
        {/* Additive fresnel rim shell — the electric-glass edge */}
        <mesh geometry={geometry} scale={[1.035, 1.06, 1.1]}>
          <shaderMaterial
            ref={rimMat}
            uniforms={rimUniforms}
            vertexShader={RIM_VERT}
            fragmentShader={RIM_FRAG}
            transparent
            depthWrite={false}
            blending={AdditiveBlending}
            side={DoubleSide}
          />
        </mesh>
        {/* Rim-light convergence hairlines */}
        <mesh ref={rayL} geometry={rayGeometry} rotation={[0, 0, -0.46]}>
          <shaderMaterial
            ref={rayMatL}
            uniforms={rayUniformsL}
            vertexShader={RAY_VERT}
            fragmentShader={RAY_FRAG}
            transparent
            depthWrite={false}
            blending={AdditiveBlending}
          />
        </mesh>
        <mesh
          ref={rayR}
          geometry={rayGeometry}
          rotation={[0, 0, Math.PI + 0.46]}
        >
          <shaderMaterial
            ref={rayMatR}
            uniforms={rayUniformsR}
            vertexShader={RAY_VERT}
            fragmentShader={RAY_FRAG}
            transparent
            depthWrite={false}
            blending={AdditiveBlending}
          />
        </mesh>
      </group>
      {/* Focusing glow pool on the floor beneath the button */}
      <mesh
        ref={discRef}
        geometry={discGeometry}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[FINALE.pillWorld.x, FLOOR_Y + 0.02, FINALE.pillWorld.z]}
      >
        <shaderMaterial
          ref={discMat}
          uniforms={discUniforms}
          vertexShader={RAY_VERT}
          fragmentShader={DISC_FRAG}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
    </>
  );
}
