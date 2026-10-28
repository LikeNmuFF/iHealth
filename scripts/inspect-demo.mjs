import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
const browser = await chromium.launch({ channel: "chromium" });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
let successfulTiles = 0;
page.on("response", (response) => {
  if (
    response.url().startsWith("https://tile.openstreetmap.org/") &&
    response.ok()
  )
    successfulTiles++;
});
mkdirSync("docs/preview", { recursive: true });
await page.goto("http://127.0.0.1:3000");
await page.getByRole("button", { name: /^Patient .*Enter demo/ }).click();
await page
  .getByRole("button", { name: "Use Demo Location", exact: true })
  .click();
try {
  await page.waitForResponse(
    (response) =>
      response.url().startsWith("https://tile.openstreetmap.org/") &&
      response.ok(),
    { timeout: 15000 },
  );
} catch {
  /* A failed provider remains an honest list-first demo. */
}
await page.locator(".care-marker").first().waitFor();
await page.screenshot({
  path: "docs/preview/patient-desktop.png",
  fullPage: true,
});
await page.setViewportSize({ width: 390, height: 844 });
await page.getByRole("button", { name: "Recenter map" }).click();
await page.screenshot({
  path: "docs/preview/patient-phone.png",
  fullPage: true,
});
const phoneHasPageOverflow = await page.evaluate(
  () => document.documentElement.scrollWidth > innerWidth,
);
const map = await page.locator(".care-map").boundingBox();
const markers = await page.locator(".care-marker").evaluateAll((nodes) =>
  nodes.map((node) => {
    const r = node.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  }),
);
const visiblePins = markers.filter(
  (p) =>
    p.x < map.x + map.width &&
    p.x + p.width > map.x &&
    p.y < map.y + map.height &&
    p.y + p.height > map.y,
).length;
await page.setViewportSize({ width: 1440, height: 1000 });
await page.getByLabel("Demo persona").selectOption("health_center");
await page.screenshot({
  path: "docs/preview/staff-desktop.png",
  fullPage: true,
});
console.log(
  JSON.stringify({
    successfulTiles,
    visiblePins,
    totalPins: markers.length,
    phoneHasPageOverflow,
  }),
);
await browser.close();
