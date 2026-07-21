// Captures the DESKTOP homepage (the 3D showcase) as stacked viewport slices
// for the admin heatmap. The showcase is scroll-scrubbed and deterministic per
// scrollY, so screenshotting each viewport-height step and stacking the slices
// reproduces exactly what a desktop visitor saw at every scroll depth —
// something an iframe can't do (the WebGL canvas can't render at full document
// height, and the mobile/static page is a different experience entirely).
//
// Usage:
//   npm run heatmap:capture              → captures https://www.pkdmstudio.com
//   npm run heatmap:capture -- --base http://localhost:3000
//
// Output: public/heatmap/home-desktop/slice-NN.webp + manifest.json
// Re-run whenever the desktop homepage changes visually.
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const puppeteer = require("puppeteer-core");

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, "../public/heatmap/home-desktop");

const baseArg = process.argv.indexOf("--base");
const BASE = baseArg > -1 ? process.argv[baseArg + 1] : "https://www.pkdmstudio.com";

// Must match DEVICE_WIDTHS.desktop in src/app/admin/heatmap/page.tsx.
const VIEW_W = 1280;
const VIEW_H = 800;

const CHROME_PATHS = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
];
const executablePath = CHROME_PATHS.find((p) => {
  try {
    return require("node:fs").existsSync(p);
  } catch {
    return false;
  }
});
if (!executablePath) {
  console.error("✗ No Chrome/Chromium found. Install Google Chrome and retry.");
  process.exit(1);
}

console.log(`Capturing desktop homepage from ${BASE} …`);
const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ["--hide-scrollbars", "--force-color-profile=srgb"],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: VIEW_W, height: VIEW_H, deviceScaleFactor: 1 });
  // Belt & braces: never record this capture session in analytics (the
  // HeadlessChrome UA is already filtered server-side).
  await page.evaluateOnNewDocument(() => {
    try {
      localStorage.setItem("pkdm_no_track", "1");
    } catch {}
  });

  await page.goto(`${BASE}/`, { waitUntil: "networkidle0", timeout: 90000 });
  // Loader gate + scrub settle (same allowance as the checkpoint captures).
  await new Promise((r) => setTimeout(r, 5000));

  const probe = await page.evaluate(() => ({
    docH: document.documentElement.scrollHeight,
    hasWebGLCanvas: Array.from(document.querySelectorAll("canvas")).some((c) => {
      try {
        return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
      } catch {
        return false;
      }
    }),
  }));

  if (!probe.hasWebGLCanvas) {
    console.error(
      "✗ The 3D showcase did not mount (static page rendered instead) — aborting so we don't capture the wrong variant."
    );
    process.exit(1);
  }
  if (probe.docH <= VIEW_H * 2) {
    console.error(`✗ Unexpected document height ${probe.docH}px — aborting.`);
    process.exit(1);
  }

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  const fullSlices = Math.floor(probe.docH / VIEW_H);
  const remainder = probe.docH - fullSlices * VIEW_H;
  const slices = [];

  const capture = async (scrollY, file, height) => {
    await page.evaluate((y) => window.scrollTo(0, y), scrollY);
    // Critically-damped scrub (tau 0.09s) snaps exact within ~0.5s; give it 1s.
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({
      path: path.join(outDir, file),
      type: "webp",
      quality: 82,
    });
    slices.push({ file, height });
    console.log(`  ✓ ${file} @ scrollY=${Math.round(scrollY)}`);
  };

  for (let i = 0; i < fullSlices; i++) {
    await capture(i * VIEW_H, `slice-${String(i).padStart(2, "0")}.webp`, VIEW_H);
  }
  if (remainder > 4) {
    // Tail: scroll to the bottom; the admin UI crops this slice to `height`
    // via CSS (object-fit cover anchored to the bottom).
    await capture(
      probe.docH - VIEW_H,
      `slice-${String(fullSlices).padStart(2, "0")}.webp`,
      remainder
    );
  }

  const manifest = {
    width: VIEW_W,
    viewport: VIEW_H,
    docHeight: probe.docH,
    slices,
    base: BASE,
    capturedAt: new Date().toISOString(),
  };
  writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(
    `✓ ${slices.length} slices, document ${probe.docH}px → public/heatmap/home-desktop/`
  );
} finally {
  await browser.close();
}
