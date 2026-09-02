import { test, expect } from "@playwright/test";
import { loginViaUI } from "./helpers";



// ============================================================
// SUPPORTER PAGES — full flow via UI
// ============================================================
test.describe("Supporter Pages", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, "testsupporter@test.com", "Test1234!");
  });

  const supporterPages = [
    "/s",
    "/s/wallet",
    "/s/transactions",
    "/s/donations",
    "/s/products",
    "/s/posts",
    "/s/settings",
  ];

  for (const path of supporterPages) {
    test(`${path} loads`, async ({ page }) => {
      await page.goto(path, { waitUntil: "networkidle" });
      expect(page.url()).not.toContain("/login");
      await expect(page.locator("body")).not.toContainText("Application error");
      await expect(page.locator("body")).not.toContainText("Unhandled Runtime Error");
    });
  }

  test("supporter feed shows wallet info", async ({ page }) => {
    await page.goto("/s", { waitUntil: "networkidle" });
    const body = (await page.textContent("body") || "").toLowerCase();
    expect(body).toMatch(/saldo|credit|wallet|explore/);
  });

  test("wallet shows balance", async ({ page }) => {
    await page.goto("/s/wallet", { waitUntil: "networkidle" });
    const body = (await page.textContent("body") || "").toLowerCase();
    expect(body).toMatch(/saldo|credit|wallet|balance/);
  });
});

// ============================================================
// SHARED AUTHENTICATED PAGES (supporter)
// ============================================================
test.describe("Shared Auth Pages — Supporter", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, "testsupporter@test.com", "Test1234!");
  });

  const sharedPages = [
    "/feed",
    "/notifications",
    "/chat",
    "/profile",
    "/wallet",
    "/wallet/topup",
    "/library/posts",
    "/library/products",
    "/donations/sent",
    "/upgrade",
  ];

  for (const path of sharedPages) {
    test(`${path} loads`, async ({ page }) => {
      await page.goto(path, { waitUntil: "networkidle" });
      expect(page.url()).not.toContain("/login");
      await expect(page.locator("body")).not.toContainText("Application error");
      await expect(page.locator("body")).not.toContainText("Unhandled Runtime Error");
    });
  }

  test("notifications page renders", async ({ page }) => {
    await page.goto("/notifications", { waitUntil: "networkidle" });
    const body = (await page.textContent("body") || "").toLowerCase();
    expect(body).toMatch(/notifikasi|notification|belum ada/);
  });

  test("top-up page has amount input", async ({ page }) => {
    await page.goto("/wallet/topup", { waitUntil: "networkidle" });
    const inputs = page.locator("input, button");
    expect(await inputs.count()).toBeGreaterThan(0);
  });
});

// ============================================================
// SHARED AUTHENTICATED PAGES (creator)
// ============================================================
test.describe("Shared Auth Pages — Creator", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, "creator2@test.com", "Test1234!");
  });

  for (const path of ["/feed", "/wallet", "/chat", "/notifications", "/profile"]) {
    test(`creator can access ${path}`, async ({ page }) => {
      await page.goto(path, { waitUntil: "networkidle" });
      expect(page.url()).not.toContain("/login");
      await expect(page.locator("body")).not.toContainText("Application error");
    });
  }
});
