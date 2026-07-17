import { headers } from "next/headers";
import ShowcaseDeviceGate from "@/components/showcase/device-gate";
import ShowcaseStaticPage from "@/components/showcase/static-page";

// T-315 — two-stage gate, stage 1 (server UA hint, v6 canon): mobile UAs get
// the pure Server Component static page, so a phone's tree never references
// any 3D client code. iPad is deliberately NOT matched here — iPadOS reports
// a macOS UA; stage 2 (device-gate.tsx: reduced-motion / max-width 767px /
// hover:none / pointer:coarse) catches it on the client.
const MOBILE_UA =
  /iPhone|iPod|Windows Phone|IEMobile|Opera Mini|BlackBerry|webOS|Android.+Mobile/i;

export default async function ShowcasePage() {
  const ua = (await headers()).get("user-agent") ?? "";
  if (MOBILE_UA.test(ua)) return <ShowcaseStaticPage />;
  return <ShowcaseDeviceGate />;
}
