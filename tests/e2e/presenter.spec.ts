import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("pitch mode keeps approvals real, shows doctor coordination, and restarts a rehearsal safely", async ({
  page,
}) => {
  await page.route("**/tile.openstreetmap.org/**", (route) => route.abort());
  await page.goto("/");
  await page.getByRole("button", { name: "Start pitch demo" }).click();
  const guide = page.getByRole("region", { name: "Guided demo" });
  const coordination = page.getByRole("region", {
    name: "Doctor coordination",
  });
  const currentStatus = () =>
    page.evaluate(
      () =>
        JSON.parse(
          localStorage.getItem("ihealth-hapisabela-demo-v1")!,
        ).referrals.find((r: { id: string }) => r.id === "ref-1").status,
    );
  await expect(page.locator(".presentation-mode")).toBeVisible();
  await expect(guide).toContainText("PITCH DEMO");
  expect(await currentStatus()).toBe("draft");
  await guide
    .getByRole("button", { name: "Continue as Health Center" })
    .click();
  await expect(page.getByLabel("Active demo facility")).toHaveValue(
    "staff-hc-a",
  );
  await expect(coordination).toContainText("Dr. Celia Dela Paz (demo)");
  await expect(coordination).toContainText("Not confirmed yet");
  expect(await currentStatus()).toBe("draft");
  await page.getByRole("button", { name: "Review & submit draft" }).click();
  await page.getByLabel("I reviewed this fictional information").check();
  await page
    .getByRole("button", { name: "Review referral", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Submit local demo referral" })
    .click();
  await guide.getByRole("button", { name: "Continue as Hospital" }).click();
  expect(await currentStatus()).toBe("submitted");
  await expect(
    page.getByRole("navigation", { name: "Staff navigation", exact: true }),
  ).toBeHidden();
  await page.getByRole("button", { name: "Acknowledge referral" }).click();
  await page
    .getByRole("button", { name: "Propose alternative", exact: true })
    .click();
  await page.getByRole("button", { name: "Save proposed alternative" }).click();
  await expect(coordination).toContainText("Awaiting referring staff");
  await guide
    .getByRole("button", { name: "Continue as Health Center" })
    .click();
  await page
    .getByRole("button", { name: "Accept coordinated alternative" })
    .click();
  await expect(coordination).toContainText("Accepted by referring staff");
  await expect(coordination).toContainText("Not confirmed yet");
  expect(await currentStatus()).toBe("alternative_accepted");
  await guide.getByRole("button", { name: "Continue as Hospital" }).click();
  await page.getByRole("button", { name: "Confirm plan", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm plan", exact: true })
    .click();
  await guide.getByRole("button", { name: "Continue as Patient" }).click();
  await expect(coordination.locator("li").nth(2)).toContainText(
    "Dr. Sofia Lim (demo)",
  );
  await expect(coordination.locator("li").nth(2)).toContainText(
    "Confirmed by receiving staff",
  );
  await expect(guide).toContainText("DEMO-REF-0001");
  const saved = await page.evaluate(() =>
    localStorage.getItem("ihealth-hapisabela-demo-v1"),
  );
  await guide.getByRole("button", { name: "Standard view" }).click();
  await expect(page.locator(".presentation-mode")).toHaveCount(0);
  await guide.getByRole("button", { name: "Presentation view" }).click();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("ihealth-hapisabela-demo-v1"),
    ),
  ).toBe(saved);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await coordination.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: "test-results/pitch-doctor-plan.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(
    guide.getByRole("button", { name: "Restart rehearsal" }),
  ).toBeVisible();
  await guide.getByRole("button", { name: "Restart rehearsal" }).click();
  await page.getByRole("button", { name: "Keep demo changes" }).click();
  expect(await currentStatus()).toBe("confirmed");
  await guide.getByRole("button", { name: "Restart rehearsal" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Reset Demo", exact: true })
    .click();
  await expect(page.locator(".presentation-mode")).toBeVisible();
  await expect(guide).toContainText("STEP 1 OF 6");
  await expect(
    page.getByLabel("Fictional patient", { exact: true }),
  ).toHaveValue("user-DEMO-P001");
  expect(await currentStatus()).toBe("draft");
  await guide.getByRole("button", { name: "Standard view" }).click();
  await guide.getByRole("button", { name: "Restart rehearsal" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Reset Demo", exact: true })
    .click();
  await expect(guide).toContainText("STEP 1 OF 6");
  await expect(page.locator(".presentation-mode")).toHaveCount(0);
  await guide.getByRole("button", { name: "Exit guide" }).click();
  await expect(guide).toHaveCount(0);
  await expect(page.locator(".presentation-mode")).toHaveCount(0);
});
