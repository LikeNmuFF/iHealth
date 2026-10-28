import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import roadRoute from "../fixtures/isabela-road-route.json" with { type: "json" };
const role = async (page: Page, value: string) =>
  page.getByLabel("Switch view").selectOption(value);
const facility = async (page: Page, value: string) =>
  page.getByLabel("Active demo facility").selectOption(value);
const enter = async (page: Page, name: string) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: new RegExp(`^${name} .*Enter demo`) })
    .click();
};
const openAna = async (page: Page) => {
  await page
    .getByRole("navigation", { name: "Staff navigation" })
    .getByRole("button", { name: "All Referrals", exact: true })
    .click();
  await page
    .getByRole("button", { name: "DEMO-REF-0001", exact: true })
    .filter({ visible: true })
    .click();
};
test.beforeEach(async ({ page }) => {
  await page.route("**/tile.openstreetmap.org/**", (route) => route.abort());
  await page.route("**/route/v1/driving/**", (route) =>
    route.fulfill({ json: roadRoute }),
  );
});

test("road routing failure shows no shortcut line and recovers through retry", async ({
  page,
}) => {
  let fail = true;
  let requests = 0;
  await page.route("**/route/v1/driving/**", async (route) => {
    requests++;
    if (fail) await route.abort();
    else await route.fulfill({ json: roadRoute });
  });
  await enter(page, "Patient");
  await page
    .getByRole("textbox", { name: "Search facilities", exact: true })
    .fill("Hospital A");
  await page.locator(".facility-card").click();
  await page
    .getByRole("button", { name: "View directions", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Choose a starting point for road directions",
    }),
  ).toBeVisible();
  expect(requests).toBe(0);
  await expect(page.locator(".road-route")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Use Demo Location", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Road route unavailable", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".leaflet-overlay-pane path")).toHaveCount(0);
  fail = false;
  await page.getByRole("button", { name: "Retry road route" }).click();
  await expect(
    page.getByRole("heading", { name: /2\.24 km road distance/ }),
  ).toBeVisible();
  await expect(page.locator(".road-route")).toBeVisible();
  await expect(page.getByText(/road ends about 103 m/)).toBeVisible();
  expect(requests).toBe(2);
  await page.screenshot({
    path: "test-results/road-routing.png",
    fullPage: true,
  });
});

test("guided demo explains each handoff and opens the correct referral without manual role searches", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start guided demo" }).click();
  const guide = page.getByRole("region", { name: "Guided demo" });
  await expect(
    guide.getByRole("heading", { name: "Patient explores care facilities" }),
  ).toBeVisible();
  await guide
    .getByRole("button", { name: "Continue as Health Center" })
    .click();
  await expect(page.getByLabel("Active demo facility")).toHaveValue(
    "staff-hc-a",
  );
  await page.getByRole("button", { name: "Review & submit draft" }).click();
  await expect(
    guide.getByRole("button", { name: "Continue as Health Center" }),
  ).toBeDisabled();
  await page.getByLabel("I reviewed this fictional information").check();
  await page
    .getByRole("button", { name: "Review referral", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Submit local demo referral" })
    .click();
  await guide.getByRole("button", { name: "Continue as Hospital" }).click();
  await expect(page.getByLabel("Active demo facility")).toHaveValue(
    "staff-hospital-a",
  );
  await page.getByRole("button", { name: "Acknowledge referral" }).click();
  await expect(guide).toContainText("requested doctor is unavailable");
  await page
    .getByRole("button", { name: "Propose alternative", exact: true })
    .click();
  await page.getByRole("button", { name: "Save proposed alternative" }).click();
  await guide
    .getByRole("button", { name: "Continue as Health Center" })
    .click();
  await page
    .getByRole("button", { name: "Accept coordinated alternative" })
    .click();
  await guide.getByRole("button", { name: "Continue as Hospital" }).click();
  await page.getByRole("button", { name: "Confirm plan", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm plan", exact: true })
    .click();
  await guide.getByRole("button", { name: "Continue as Patient" }).click();
  await expect(
    page.getByRole("heading", { name: "Confirmed destination" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "View route", exact: true }).click();
  await page.getByRole("button", { name: "Back to referral details" }).click();
  await guide.getByRole("button", { name: "Next: record arrival" }).click();
  await page.getByRole("button", { name: "Verify identity & arrival" }).click();
  await page.getByLabel("I verified identity and reviewed").check();
  await page.getByRole("button", { name: "Mark arrived", exact: true }).click();
  await page
    .getByRole("button", { name: "Complete visit & follow-up" })
    .click();
  await page
    .getByLabel("Return / follow-up note for referring staff")
    .fill(
      "Fictional visit complete. Review follow-up with the referring team.",
    );
  await page.getByRole("button", { name: "Complete demo visit" }).click();
  await guide.getByRole("button", { name: "Continue as Patient" }).click();
  await expect(guide).toContainText("Demo journey complete");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("button", { name: "All demo views" }).click();
  await page.getByRole("button", { name: "Start guided demo" }).click();
  await expect(guide).toContainText("Demo journey complete");
});

test("referral search and origin survive opening details, while mobile staff navigation stays visible", async ({
  page,
}) => {
  await enter(page, "Hospital");
  const staff = page.getByRole("navigation", {
    name: "Staff navigation",
    exact: true,
  });
  await staff
    .getByRole("button", { name: "Incoming Referrals", exact: false })
    .click();
  await page
    .getByRole("textbox", { name: "Search referrals" })
    .fill("DEMO-REF-0002");
  await page
    .getByRole("button", { name: "DEMO-REF-0002", exact: true })
    .filter({ visible: true })
    .click();
  await page.getByRole("button", { name: "Back to referrals" }).click();
  await expect(
    page.getByRole("textbox", { name: "Search referrals" }),
  ).toHaveValue("DEMO-REF-0002");
  await expect(page.getByLabel("Referral direction")).toHaveValue("incoming");
  await page
    .getByRole("button", { name: "DEMO-REF-0002", exact: true })
    .filter({ visible: true })
    .click();
  await facility(page, "staff-hospital-b");
  await expect(
    page.getByRole("heading", { name: "Referral overview" }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  const mobile = page.getByRole("navigation", {
    name: "Mobile staff navigation",
  });
  await expect(mobile).toBeVisible();
  await mobile.getByRole("button", { name: "Patients", exact: true }).click();
  await expect(
    mobile.getByRole("button", { name: "Patients", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await mobile.getByRole("button", { name: "More" }).click();
  await expect(
    staff.getByRole("button", { name: "Facility Profile" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(mobile.getByRole("button", { name: "More" })).toBeFocused();
  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight }),
  );
  await mobile.getByRole("button", { name: "More" }).click();
  await staff.getByRole("button", { name: "Facility Profile" }).click();
  await expect(
    page.getByRole("heading", { name: "Demo Hospital B", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
test("all four views coordinate the same referral, preserve it on reload, and reset", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await enter(page, "Health Center");
  await page.screenshot({
    path: "test-results/staff-desktop.png",
    fullPage: true,
  });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await openAna(page);
  await page.getByRole("button", { name: "Review & submit draft" }).click();
  await page.getByLabel("I reviewed this fictional information").check();
  await page
    .getByRole("button", { name: "Review referral", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Review referral information" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Submit local demo referral" })
    .click();
  await expect(
    page.getByText("Local demo saved.", { exact: false }),
  ).toBeVisible();
  await role(page, "hospital");
  await facility(page, "staff-hospital-b");
  await expect(
    page.getByRole("button", { name: "DEMO-REF-0001", exact: true }),
  ).toHaveCount(0);
  await facility(page, "staff-hospital-a");
  await openAna(page);
  await page.getByRole("button", { name: "Acknowledge referral" }).click();
  await page
    .getByRole("button", { name: "Propose alternative", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByLabel("Receiving doctor")).toHaveValue("dr-ob-2");
  await page.getByRole("button", { name: "Save proposed alternative" }).click();
  await role(page, "health_center");
  await openAna(page);
  await page
    .getByRole("button", { name: "Accept coordinated alternative" })
    .click();
  await role(page, "hospital");
  await openAna(page);
  await page.getByRole("button", { name: "Confirm plan", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm plan", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Confirmed destination" }),
  ).toBeVisible();
  await role(page, "patient");
  await page
    .getByRole("navigation", { name: "Patient navigation" })
    .getByRole("button", { name: "My Referrals" })
    .click();
  await page.getByRole("button", { name: /DEMO-REF-0001/ }).click();
  await expect(
    page.getByRole("heading", { name: "Confirmed destination" }),
  ).toBeVisible();
  await expect(
    page.getByText("Dr. Sofia Lim (demo)", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Submitted information" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "View route", exact: true }).click();
  await page
    .getByRole("button", { name: "Use Demo Location", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: /2\.24 km road distance/ }),
  ).toBeVisible();
  await expect(page.locator(".road-route")).toBeVisible();
  expect(
    (await page.locator(".road-route").getAttribute("d"))!.split("L").length,
  ).toBeGreaterThan(10);
  await expect(page.getByText(/Dashed line: Direct connection/)).toHaveCount(0);
  const maps = page.getByRole("link", { name: /Open in Google Maps/ });
  await expect(maps).toHaveAttribute("href", /api=1/);
  expect(await maps.getAttribute("href")).not.toMatch(/Ana|DEMO|diagnosis/);
  await role(page, "hospital");
  await openAna(page);
  await page.getByRole("button", { name: "Verify identity & arrival" }).click();
  await page.getByRole("button", { name: "Mark arrived", exact: true }).click();
  await expect(
    page.getByText(
      "Confirm identity verification and review registration changes.",
    ),
  ).toBeVisible();
  await page.getByLabel("I verified identity and reviewed").check();
  await page.getByRole("button", { name: "Mark arrived", exact: true }).click();
  await page
    .getByRole("button", { name: "Complete visit & follow-up" })
    .click();
  await page
    .getByLabel("Return / follow-up note for referring staff")
    .fill("Fictional visit complete. Coordinate a local return appointment.");
  await page
    .getByLabel("Separate patient follow-up instruction")
    .fill("Contact your referring center to arrange your planned follow-up.");
  await page.getByRole("button", { name: "Complete demo visit" }).click();
  await role(page, "health_center");
  await openAna(page);
  await expect(
    page.getByRole("heading", { name: "Return note to referring facility" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Fictional visit complete. Coordinate a local return appointment.",
      { exact: true },
    ),
  ).toBeVisible();
  await role(page, "clinic");
  await expect(
    page.getByRole("heading", { name: "Referral overview" }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Staff navigation" })
    .getByRole("button", { name: /^Incoming Referrals/ })
    .click();
  await expect(
    page.getByRole("button", { name: "DEMO-REF-0004", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "DEMO-REF-0004", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirm plan", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm plan", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Confirmed destination" }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: /^Patient .*Enter demo/ }).click();
  await page
    .getByRole("navigation", { name: "Patient navigation" })
    .getByRole("button", { name: "My Referrals" })
    .click();
  await page.getByRole("button", { name: /DEMO-REF-0001/ }).click();
  await expect(
    page.getByText("Visit completed", { exact: true }).first(),
  ).toBeVisible();
  await page
    .getByLabel("Fictional patient", { exact: true })
    .selectOption("user-DEMO-P002");
  await page
    .getByRole("navigation", { name: "Patient navigation" })
    .getByRole("button", { name: "My Referrals" })
    .click();
  await expect(page.getByRole("button", { name: /DEMO-REF-0001/ })).toHaveCount(
    0,
  );
  const persisted = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("ihealth-hapisabela-demo-v1")!),
  );
  expect(persisted.origin).toBeUndefined();
  expect(persisted.locationHistory).toBeUndefined();
  await page.getByRole("button", { name: "Demo settings" }).click();
  await page.getByRole("button", { name: "Reset Demo", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Reset Demo", exact: true })
    .click();
  await page
    .getByLabel("Fictional patient", { exact: true })
    .selectOption("user-DEMO-P001");
  await page
    .getByRole("navigation", { name: "Patient navigation" })
    .getByRole("button", { name: "My Referrals" })
    .click();
  await expect(
    page.getByRole("button", { name: /DEMO-REF-0001.*Draft/ }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("denied location, synchronized filters, failed tiles, manual point and no-results recovery", async ({
  page,
  context,
}) => {
  await context.clearPermissions();
  await enter(page, "Patient");
  await expect(page.getByText("Distance not set").first()).toBeVisible();
  await page
    .getByRole("button", { name: "Use My Location", exact: true })
    .click();
  await expect(
    page.getByText(
      "Location permission denied. Choose a starting point or use the demo location.",
    ),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Use Demo Location", exact: true })
    .click();
  await expect(page.getByText("Demo starting point selected")).toBeVisible();
  await page.getByLabel("Service", { exact: true }).selectOption("ob");
  await expect(page.locator(".facility-card")).toHaveCount(3);
  await page
    .getByRole("textbox", { name: "Search facilities", exact: true })
    .fill("Hospital A");
  await expect(page.locator(".facility-card")).toHaveCount(1);
  await expect(page.locator(".care-marker")).toHaveCount(1);
  await page.locator(".facility-card").click();
  await expect(
    page.getByRole("region", { name: "Selected facility details" }),
  ).toBeVisible();
  await expect(page.locator(".care-marker.selected")).toHaveCount(1);
  await expect(page.getByText(/Map tiles could not be loaded/)).toBeVisible();
  await page
    .getByRole("button", { name: "Choose Starting Point", exact: true })
    .click();
  await page.locator(".care-map").click({ position: { x: 180, y: 250 } });
  await expect(
    page.getByText("Manual starting point selected", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Search facilities", exact: true })
    .fill("no-such-facility");
  await expect(
    page.getByRole("heading", { name: "No matching facilities" }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Selected facility details" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Clear search facilities" }).click();
  await expect(
    page.getByRole("textbox", { name: "Search facilities", exact: true }),
  ).toBeFocused();
  await expect(page.locator(".facility-card")).toHaveCount(3);
  await page.screenshot({
    path: "test-results/patient-desktop.png",
    fullPage: true,
  });
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations).toEqual([]);
});
test("phone layout, native select keyboard, simulated offline, dialog focus and print privacy", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await enter(page, "Patient");
  await expect(
    page.getByRole("navigation", { name: "Mobile patient navigation" }),
  ).toBeVisible();
  const type = page.getByLabel("Facility type", { exact: true });
  await type.focus();
  await type.press("ArrowDown");
  await type.press("Enter");
  await expect(type).toBeFocused();
  await page
    .getByRole("button", { name: "Use Demo Location", exact: true })
    .click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await expect(page.locator(".leaflet-control-attribution")).toBeVisible();
  await page.screenshot({
    path: "test-results/patient-phone.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Demo settings" }).click();
  await page.getByLabel("Simulate Offline (presentation only)").check();
  await page.getByLabel("Disable map tiles (presentation only)").check();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Demo settings" }),
  ).toBeFocused();
  await expect(
    page.getByText(/Simulated offline · presentation control/),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Mobile patient navigation" })
    .getByRole("button", { name: "My Referrals" })
    .click();
  await page.getByRole("button", { name: /DEMO-REF-0001/ }).click();
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".print-summary")).toBeVisible();
  await expect(page.locator(".print-summary")).not.toContainText("Ana Reyes");
  await expect(page.locator(".print-summary")).not.toContainText("Allergies");
  await page.emulateMedia({ media: "screen" });
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("versioned reload, cross-tab updates/reset, device coordinates remain transient, PWA cache scope", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({
    latitude: 6.705,
    longitude: 121.966,
    accuracy: 20,
  });
  await enter(page, "Patient");
  await page
    .getByRole("button", { name: "Use My Location", exact: true })
    .click();
  await expect(page.getByText("Device starting point selected")).toBeVisible();
  const raw = await page.evaluate(() =>
    localStorage.getItem("ihealth-hapisabela-demo-v1")!,
  );
  expect(raw).not.toContain('"source":"device"');
  expect(raw).not.toContain('"accuracy"');
  const other = await context.newPage();
  await other.route("**/tile.openstreetmap.org/**", (r) => r.abort());
  await enter(other, "Health Center");
  await openAna(other);
  await other
    .getByRole("button", { name: "Cancel referral", exact: true })
    .click();
  await other
    .getByLabel("Reason", { exact: true })
    .fill("Fictional cancellation coordinated by staff.");
  await other
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel referral", exact: true })
    .click();
  await page
    .getByRole("navigation", { name: "Patient navigation" })
    .getByRole("button", { name: "My Referrals" })
    .click();
  await expect(
    page.getByRole("button", { name: /DEMO-REF-0001.*Cancelled/ }),
  ).toBeVisible();
  await other.getByRole("button", { name: "Demo settings" }).click();
  await other.getByRole("button", { name: "Reset Demo", exact: true }).click();
  await other
    .getByRole("dialog")
    .getByRole("button", { name: "Reset Demo", exact: true })
    .click();
  await page
    .getByRole("navigation", { name: "Patient navigation" })
    .getByRole("button", { name: "Explore", exact: true })
    .click();
  await expect(
    page.getByText("Choose a starting point to see distances"),
  ).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  const cacheUrls = await page.evaluate(async () => {
    const urls: string[] = [];
    for (const name of await caches.keys()) {
      for (const request of await (await caches.open(name)).keys())
        urls.push(request.url);
    }
    return urls;
  });
  expect(
    cacheUrls.every((url) =>
      /\/(offline\.html|icon\.png|logo\/mark\.png|icons\/icon-(192|512|maskable-512)\.png)$/.test(
        url,
      ),
    ),
  ).toBe(true);
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "You’re offline." }),
  ).toBeVisible();
  await context.setOffline(false);
  await other.close();
});
