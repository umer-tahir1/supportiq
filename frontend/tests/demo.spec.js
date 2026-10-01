import { test, expect } from "@playwright/test";
import fs from "node:fs";

// Credentials stay in the ignored local environment file, never in screenshots.
const settings = Object.fromEntries(
  fs
    .readFileSync("../.env", "utf8")
    .split("\n")
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const separator = line.indexOf("=");
      return [line.slice(0, separator), line.slice(separator + 1)];
    }),
);

test("complete customer-to-admin demo, charts, filters and refresh", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Let’s make things right." }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Admin|Dashboard|Owner/ }),
  ).toHaveCount(0);
  await page.screenshot({
    path: "../artifacts/portal-desktop.png",
    fullPage: true,
  });
  await page.getByLabel("Your name").fill("Demo Customer");
  await page.getByLabel("Email address").fill("demo.customer@example.com");
  await page.getByLabel("Order ID").fill("DEMO-STAR-001");
  await page
    .getByLabel("Subject", { exact: false })
    .fill("Demo: late delivery and cold food");
  await page
    .getByLabel("Your message")
    .fill(
      "My order arrived almost one hour late and the food was completely cold.",
    );
  await page.getByRole("button", { name: "Send your feedback" }).click();
  await expect(
    page.getByText("Your complaint has been submitted successfully."),
  ).toBeVisible();
  const ticketId = await page
    .locator(".confirmation-ticket strong")
    .innerText();
  await page.screenshot({
    path: "../artifacts/portal-confirmation.png",
    fullPage: true,
  });

  await page.keyboard.down("Meta");
  await page.keyboard.press("a");
  await page.keyboard.press("b");
  await page.keyboard.up("Meta");
  await expect(page).toHaveURL("/admin/login");
  await page.getByLabel("Work email").fill(settings.ADMIN_EMAIL);
  await page
    .getByLabel("Password", { exact: true })
    .fill(settings.ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in to SupportIQ" }).click();
  await expect(
    page.getByRole("heading", { name: "Overview", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("75,258", { exact: true }).first()).toBeVisible();
  await expect(
    page.getByRole("link", { name: new RegExp(ticketId) }).first(),
  ).toBeVisible();
  await expect(page.locator(".recharts-surface").first()).toBeVisible();
  await page.screenshot({
    path: "../artifacts/dashboard-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("link", { name: new RegExp(ticketId) })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "SupportIQ analysis" }),
  ).toBeVisible();
  await expect(
    page.getByText("Food Temperature", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("Negative", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.locator(".similar-result")).toHaveCount(5);
  await page.screenshot({
    path: "../artifacts/ticket-details.png",
    fullPage: true,
  });
  await page.getByLabel("Ticket status").selectOption("In Progress");
  await expect(page.getByLabel("Ticket status")).toHaveValue("In Progress");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "SupportIQ analysis" }),
  ).toBeVisible();
  await expect(page.getByLabel("Ticket status")).toHaveValue("In Progress");

  await page.getByRole("link", { name: "Tickets", exact: true }).click();
  await page.getByLabel("Search tickets").fill(ticketId);
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByLabel("Filter source").selectOption("customer_portal");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByRole("link", { name: "Analytics", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Model transparency" }),
  ).toBeVisible();
  await page.screenshot({
    path: "../artifacts/analytics-desktop.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Clusters", exact: true }).click();
  await expect(page.locator(".cluster-card")).toHaveCount(10);
  await page.screenshot({
    path: "../artifacts/clusters-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Explore these complaints" })
    .first()
    .click();
  await expect(page.getByLabel("Filter cluster")).toHaveValue("0");
  await page.getByRole("link", { name: "Similar Cases", exact: true }).click();
  await page.getByLabel("Complaint text").fill("Food spoiled and contaminated");
  await page.getByRole("button", { name: "Find similar cases" }).click();
  await expect(page.locator(".similar-result")).toHaveCount(5);
  await page.screenshot({
    path: "../artifacts/similar-cases.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL("/admin/login");
  expect(errors).toEqual([]);
});

test("protected routes, Control shortcut and ordinary select-all", async ({
  page,
}) => {
  await page.goto("/admin/tickets");
  await expect(page).toHaveURL("/admin/login");
  await page.goto("/");
  await page.getByLabel("Your name").fill("Select this text");
  await page.keyboard.press("Meta+a");
  await expect(page).toHaveURL("/");
  const selection = await page
    .getByLabel("Your name")
    .evaluate((input) => input.selectionEnd - input.selectionStart);
  expect(selection).toBe("Select this text".length);
  await page.keyboard.down("Control");
  await page.keyboard.press("a");
  await page.keyboard.press("b");
  await page.keyboard.up("Control");
  await expect(page).toHaveURL("/admin/login");
});

test("mobile portal fits without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Send your feedback" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "../artifacts/portal-mobile.png",
    fullPage: true,
  });
});
