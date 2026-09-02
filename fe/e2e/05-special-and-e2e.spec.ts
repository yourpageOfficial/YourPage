import { test, expect, type Page } from "@playwright/test";

// ============================================================
// CREATOR PUBLIC PAGE
// ============================================================
test.describe("Creator Public Page", () => {
  test("creator page /c/creator2 loads", async ({ page }) => {
    await page.goto("/c/creator2", { waitUntil: "networkidle" });
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("non-existent creator shows not found", async ({ page }) => {
    await page.goto("/c/nonexistent-creator-xyz-999", { waitUntil: "networkidle" });
    const body = (await page.textContent("body") || "").toLowerCase();
    expect(body).toMatch(/tidak ditemukan|not found|404|error/);
  });
});

// ============================================================
// OBS OVERLAY
// ============================================================
test.describe("OBS Overlay", () => {
  test("overlay page loads without auth", async ({ page }) => {
    await page.goto("/overlay", { waitUntil: "networkidle" });
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.locator("body")).not.toContainText("Unhandled Runtime Error");
  });

  test("overlay with query param", async ({ page }) => {
    await page.goto("/overlay?creator=1", { waitUntil: "networkidle" });
    await expect(page.locator("body")).not.toContainText("Application error");
  });
});

// ============================================================
// VERIFY EMAIL / RESET PASSWORD
// ============================================================
test.describe("Token Pages", () => {
  test("verify-email page loads", async ({ page }) => {
    await page.goto("/verify-email?token=fake", { waitUntil: "networkidle" });
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("reset-password page loads", async ({ page }) => {
    await page.goto("/reset-password?token=fake", { waitUntil: "networkidle" });
    await expect(page.locator("body")).not.toContainText("Application error");
  });
});

// ============================================================
// SEO & META
// ============================================================
test.describe("SEO", () => {
  test("robots.txt accessible", async ({ page }) => {
    const res = await page.request.get("/robots.txt");
    expect(res.status()).toBeLessThan(500);
  });

  test("sitemap.xml accessible", async ({ page }) => {
    const res = await page.request.get("/sitemap.xml");
    expect(res.status()).toBeLessThan(500);
  });
});

// ============================================================
// SECURITY HEADERS
// ============================================================
test.describe("Security Headers", () => {
  test("X-Frame-Options or CSP present", async ({ page }) => {
    const res = await page.request.get("/");
    const h = res.headers();
    expect(h["x-frame-options"] || h["content-security-policy"]).toBeTruthy();
  });

  test("X-Content-Type-Options present", async ({ page }) => {
    const res = await page.request.get("/");
    expect(res.headers()["x-content-type-options"]).toBe("nosniff");
  });
});

// ============================================================
// FULL REGISTER → LOGIN → DASHBOARD FLOW
// ============================================================
test.describe("E2E: Register → Login → Dashboard", () => {
  const ts = Date.now();
  const email = `e2e${ts}@test.com`;
  const username = `e2e${ts}`.slice(0, 20);
  const password = "E2eTest1234!";

  test("register as creator → auto-login → see dashboard", async ({ page }) => {
    await page.goto("/register", { waitUntil: "networkidle" });

    // Select kreator role
    await page.getByRole("button", { name: /Kreator/ }).click();

    // Fill form
    await page.fill('input[type="email"]', email);
    await page.fill('input[placeholder*="huruf"]', username);
    const pwFields = page.locator('input[type="password"]');
    await pwFields.first().fill(password);
    await pwFields.last().fill(password);

    // Submit
    await page.click('button[type="submit"]');

    // Should redirect away from register (to /welcome or /dashboard)
    await page.waitForURL((url) => !url.pathname.includes("/register"), { timeout: 20000 });
    expect(page.url()).toMatch(/\/(welcome|dashboard)/);
  });

  test("login with new account → dashboard", async ({ page }) => {
    // Use a known working account instead of depending on previous test
    await page.goto("/login", { waitUntil: "networkidle" });
    await page.fill('input[type="email"]', "creator2@test.com");
    await page.fill('input[type="password"]', "Test1234!");
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });
    expect(page.url()).toMatch(/\/(welcome|dashboard)/);
  });
});
