import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
const baseURL = process.env.PITCH_BASE_URL || "http://127.0.0.1:3000";
const output = "docs/pitch";
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ channel: "chromium", slowMo: 160 });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  recordVideo: { dir: output, size: { width: 1440, height: 1000 } },
  reducedMotion: "reduce",
});
const page = await context.newPage();
page.setDefaultTimeout(60000);
const video = page.video();
let completed = false;
// These pauses are intentional reading time in the silent recording, not test synchronization.
const read = (ms = 3000) => page.waitForTimeout(ms);
const guide = page.getByRole("region", { name: "Guided demo" });
try {
  await page.goto(baseURL);
  await page.getByRole("button", { name: "Start pitch demo" }).click();
  await page.getByRole("button", { name: "Demo settings" }).click();
  await page.getByLabel("Disable map tiles (presentation only)").check();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page
    .getByRole("button", { name: "Use Demo Location", exact: true })
    .click();
  await read();
  await guide
    .getByRole("button", { name: "Continue as Health Center" })
    .click();
  await read();
  await page.getByRole("button", { name: "Review & submit draft" }).click();
  await page.getByLabel("I reviewed this fictional information").check();
  await page
    .getByRole("button", { name: "Review referral", exact: true })
    .click();
  await read();
  await page
    .getByRole("button", { name: "Submit local demo referral" })
    .click();
  await guide.getByRole("button", { name: "Continue as Hospital" }).click();
  await read();
  await page.getByRole("button", { name: "Acknowledge referral" }).click();
  await page
    .getByRole("button", { name: "Propose alternative", exact: true })
    .click();
  await read();
  await page.getByRole("button", { name: "Save proposed alternative" }).click();
  await guide
    .getByRole("button", { name: "Continue as Health Center" })
    .click();
  await page
    .getByRole("region", { name: "Doctor coordination" })
    .scrollIntoViewIfNeeded();
  await read();
  await page
    .getByRole("button", { name: "Accept coordinated alternative" })
    .click();
  await guide.getByRole("button", { name: "Continue as Hospital" }).click();
  await page.getByRole("button", { name: "Confirm plan", exact: true }).click();
  await read();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm plan", exact: true })
    .click();
  await guide.getByRole("button", { name: "Continue as Patient" }).click();
  await page
    .getByRole("region", { name: "Doctor coordination" })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: `${output}/confirmed-plan.png`,
    fullPage: true,
  });
  await page
    .getByRole("region", { name: "Doctor coordination" })
    .screenshot({ path: `${output}/doctor-coordination.png` });
  await read(5000);
  await page.getByRole("button", { name: "View route", exact: true }).click();
  await page.locator(".route-summary").scrollIntoViewIfNeeded();
  await page.locator('.route-summary[aria-busy="false"]').waitFor();
  console.log(await page.locator(".route-summary h3").innerText());
  await page
    .locator(".route-summary")
    .screenshot({ path: `${output}/routing-status.png` });
  await read(4000);
  if (await page.locator(".road-route").count()) {
    await page.locator(".map-panel").scrollIntoViewIfNeeded();
    await read();
  }
  await page.getByRole("button", { name: "Back to referral details" }).click();
  await guide.getByRole("button", { name: "Next: record arrival" }).click();
  await page.getByRole("button", { name: "Verify identity & arrival" }).click();
  await page.getByLabel("I verified identity and reviewed").check();
  await read();
  await page.getByRole("button", { name: "Mark arrived", exact: true }).click();
  await page
    .getByRole("button", { name: "Complete visit & follow-up" })
    .click();
  await page
    .getByLabel("Return / follow-up note for referring staff")
    .fill(
      "Fictional demo visit completed. Coordinate a planned local follow-up.",
    );
  await page
    .getByLabel("Separate patient follow-up instruction")
    .fill(
      "Demo visit completed. Contact your referring health center to arrange your planned follow-up.",
    );
  await read();
  await page.getByRole("button", { name: "Complete demo visit" }).click();
  await guide.getByRole("button", { name: "Continue as Patient" }).click();
  await page.locator(".next-step").scrollIntoViewIfNeeded();
  await page
    .locator(".next-step")
    .screenshot({ path: `${output}/patient-follow-up.png` });
  await read(5000);
  completed = true;
} catch (error) {
  await page.screenshot({
    path: `${output}/recording-error.png`,
    fullPage: true,
  });
  throw error;
} finally {
  await context.close();
  if (completed) {
    await video.saveAs(`${output}/backup-demo.webm`);
  }
  await video.delete();
  await browser.close();
}
console.log(
  `Saved silent fictional workflow recording: ${output}/backup-demo.webm`,
);
