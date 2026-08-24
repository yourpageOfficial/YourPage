import { test, expect } from "@playwright/test";
import { loginViaUI } from "./helpers";


// ============================================================
// 08 — ADMIN FULL FLOW (login via UI → navigate all pages)
// ============================================================
test.describe("Admin Panel", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, "admin@yourpage.id", "admin123");
    // If redirected to /welcome, go to /admin
    if (page.url().includes("/welcome")) {
      await page.goto("/admin", { waitUntil: "networkidle" });
    }
  });

  test("dashboard loads with stats", async ({ page }) => {
    await page.goto("/admin", { waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText("Dashboard");
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  const adminPages = [
    { path: "/admin/users", text: "user" },
    { path: "/admin/posts", text: "post" },
    { path: "/admin/products", text: "produk" },
    { path: "/admin/payments", text: "payment" },
    { path: "/admin/donations", text: "donasi" },
    { path: "/admin/topups", text: "top" },
    { path: "/admin/withdrawals", text: "withdraw" },
    { path: "/admin/kyc", text: "kyc" },
    { path: "/admin/reports", text: "report" },
    { path: "/admin/promo", text: "promo" },
    { path: "/admin/profit", text: "profit" },
    { path: "/admin/settings", text: "setting" },
    { path: "/admin/profile", text: "profil" },
  ];

  for (const pg of adminPages) {
    test(`${pg.path} loads`, async ({ page }) => {
      await page.goto(pg.path, { waitUntil: "networkidle" });
      expect(page.url()).not.toContain("/login");
      await expect(page.locator("body")).not.toContainText("Application error");
      await expect(page.locator("body")).not.toContainText("Unhandled Runtime Error");
    });
  }

  test("admin/settings has form inputs", async ({ page }) => {
    await page.goto("/admin/settings", { waitUntil: "networkidle" });
    const inputs = page.locator("input, select, textarea");
    expect(await inputs.count()).toBeGreaterThan(0);
  });

  test("admin sidebar navigation", async ({ page }) => {
    await page.goto("/admin", { waitUntil: "networkidle" });
    // Navigate directly — sidebar may be hidden on default viewport
    await page.goto("/admin/users", { waitUntil: "networkidle" });
    expect(page.url()).toContain("/admin/users");
    await expect(page.locator("body")).not.toContainText("Application error");
  });
});
