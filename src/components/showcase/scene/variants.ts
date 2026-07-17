// ---------------------------------------------------------------------------
// Glass material variants for Checkpoint A (T-304). All obey the hard canon:
// exactly ONE transmissive mesh, samples ≤ 6, resolution ≤ 512, colorless
// body — ALL cyan arrives as light through the glass (dispersion fringes
// #a6f4ff → #69edfe → #1f9fd6, deep-blue #0167b4 fill), never body color.
// ---------------------------------------------------------------------------

export type GlassVariant = {
  name: string;
  note: string;
  thickness: number;
  ior: number;
  chromaticAberration: number;
  roughness: number;
  anisotropicBlur: number;
  distortion: number;
  clearcoat: number;
  attenuationDistance: number;
  attenuationColor: string;
  envMapIntensity: number;
};

export const GLASS_VARIANTS: GlassVariant[] = [
  {
    name: "V1 — Crystal",
    note: "Thin, water-clear, restrained dispersion. Jewelry-grade.",
    thickness: 0.65,
    ior: 1.5,
    chromaticAberration: 0.28,
    roughness: 0.04,
    anisotropicBlur: 0.08,
    distortion: 0.06,
    clearcoat: 1,
    attenuationDistance: 3.5,
    attenuationColor: "#eaf9ff",
    envMapIntensity: 1.0,
  },
  {
    name: "V2 — Cast",
    note: "Thick cast slab, heavier refraction, medium dispersion.",
    thickness: 1.5,
    ior: 1.45,
    chromaticAberration: 0.55,
    roughness: 0.1,
    anisotropicBlur: 0.22,
    distortion: 0.12,
    clearcoat: 1,
    attenuationDistance: 2.4,
    attenuationColor: "#e2f6ff",
    envMapIntensity: 1.1,
  },
  {
    name: "V3 — Electric",
    note: "High-IOR, maximum dispersion — fringes read loudest.",
    thickness: 1.05,
    ior: 1.72,
    chromaticAberration: 0.95,
    roughness: 0.02,
    anisotropicBlur: 0.05,
    distortion: 0.08,
    clearcoat: 1,
    attenuationDistance: 3.0,
    attenuationColor: "#eef9ff",
    envMapIntensity: 1.25,
  },
  {
    name: "V4 — Satin",
    note: "Slight satin surface, softened interior, calmer highlights.",
    thickness: 1.25,
    ior: 1.5,
    chromaticAberration: 0.42,
    roughness: 0.2,
    anisotropicBlur: 0.45,
    distortion: 0.1,
    clearcoat: 0.6,
    attenuationDistance: 2.6,
    attenuationColor: "#e6f7ff",
    envMapIntensity: 1.0,
  },
];
