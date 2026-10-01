import { test, expect } from "@playwright/test";
import fs from "node:fs";

const settings = Object.fromEntries(
  fs
    .readFileSync("../.env", "utf8")
    .split("\n")
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const split = line.indexOf("=");
      return [line.slice(0, split), line.slice(split + 1)];
    }),
);

test("ticket empty/error states and responsive admin navigation", async ({
  page,
}) => {
  await page.goto("/admin/login");
  await page.getByLabel("Work email").fill(settings.ADMIN_EMAIL);
  await page
    .getByLabel("Password", { exact: true })
    .fill(settings.ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in to SupportIQ" }).click();
  await expect(
    page.getByRole("heading", { name: "Overview", exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 820, height: 1180 });
  // ResizeObserver updates chart dimensions on the next frame after a resize.
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await page.screenshot({
    path: "../artifacts/dashboard-tablet.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("link", { name: "Tickets", exact: true }).click();
  await page.getByLabel("Search tickets").fill("no-such-ticket-xyzzy");
  await expect(
    page.getByRole("heading", { name: "Nothing here yet" }),
  ).toBeVisible();
  await page.route("**/api/complaints?**", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ detail: "Temporary test outage" }),
    }),
  );
  await page.getByLabel("Search tickets").fill("retry-this-search");
  await expect(
    page.getByRole("heading", { name: "We couldn’t load this data" }),
  ).toBeVisible();
  await page.unroute("**/api/complaints?**");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(
    page.getByRole("heading", { name: "Nothing here yet" }),
  ).toBeVisible();
});
