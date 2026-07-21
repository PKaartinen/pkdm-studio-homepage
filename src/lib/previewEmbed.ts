/**
 * Detects when the site is being rendered inside an embed/preview iframe —
 * most importantly the admin heatmap preview.
 *
 * In preview mode the site must:
 *  - render the static homepage instead of the WebGL showcase (a full-height
 *    iframe makes 100vh equal the whole document, so a viewport-sized canvas
 *    would exceed the GPU's max renderbuffer size and crash the frame)
 *  - skip Lenis smooth scrolling
 *  - record no analytics events (previews are not real visits)
 *
 * Client-side only; returns false during SSR.
 */
export function isPreviewEmbed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (new URLSearchParams(window.location.search).get("pkdm_preview") === "1") {
      return true;
    }
  } catch {
    /* ignore */
  }
  try {
    // Any iframe embed (cross-origin access throws → also treated as embedded).
    return window.self !== window.top;
  } catch {
    return true;
  }
}
