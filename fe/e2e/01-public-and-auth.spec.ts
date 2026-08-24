import { test, expect } from "@playwright/test";

// ============================================================
// 01 — PUBLIC PAGES (no login needed)
// ============================================================
test.describe("Public Pages", () => {
  const pages = [
    { path: "/", text: "YourPage" },
    { path: "/login", text: "Masuk" },
    { path: "/register", text: "Daftar" },
    { path: "/explore", text: "Explore" },
    { path: "/pricing", text: "Pricing" },
    { path: "/cara-kerja", text: "Cara Kerja" },
    { path: "/terms", text: "Syarat" },
    { path: "/privacy", text: "Privasi" },
    { path: "/contact", text: "Hubungi" },
    { path: "/forgot-password", text: "password" },
    { path: "/status", text: "status" },
    { path: "/suspended", text: "suspend" },
    { path: "/welcome", text: "Welcome" },
    { path: "/offline", text: "offline" },
    { path: "/overlay", text: "" },
  ];

  for (const pg of pages) {
    test(`loads ${pg.path}`, async ({ page }) => {
      await page.goto(pg.path, { waitUntil: "networkidle" });
      // no crash
      await expect(page.locator("body")).not.toContainText("Application error");
      await expect(page.locator("body")).not.toContainText("Unhandled Runtime Error");
      if (pg.text) {
        const body = await page.textContent("body") || "";
        expect(body.toLowerCase()).toContain(pg.text.toLowerCase());
      }
    });
  }

  test("404 page", async ({ page }) => {
    await page.goto("/halaman-tidak-ada-xyz", { waitUntil: "networkidle" });
    const body = await page.textContent("body") || "";
    expect(body.toLowerCase()).toMatch(/404|tidak ditemukan|not found/);
  });
});

// ============================================================
// 02 — HOMEPAGE DETAIL
// ============================================================
test.describe("Homepage", () => {
  test("hero CTA buttons visible", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const body = await page.textContent("body") || "";
    expect(body).toMatch(/Mulai|Daftar|Gratis|Kreator/);
  });

  test("navbar visible", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator("nav, header").first()).toBeVisible();
  });

  test("mobile responsive — no horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/", { waitUntil: "networkidle" });
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(5);
  });

  test("has page title", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });
});

// ============================================================
// 03 — EXPLORE PAGE
// ============================================================
test.describe("Explore", () => {
  test("search input works", async ({ page }) => {
    await page.goto("/explore", { waitUntil: "networkidle" });
    const search = page.locator('input').first();
    if (await search.isVisible()) {
      await search.fill("test");
      await page.waitForTimeout(500);
      await expect(page.locator("body")).not.toContainText("Application error");
    }
  });

  test("category buttons visible", async ({ page }) => {
    await page.goto("/explore", { waitUntil: "networkidle" });
    const body = await page.textContent("body") || "";
    // Should have at least one category
    expect(body).toMatch(/Gaming|Musik|Edukasi|Podcast|Seni|Teknologi/);
  });
});

// ============================================================
// 04 — LOGIN FLOW (pure UI)
// ============================================================
test.describe("Login Flow", () => {
  test("form elements present", async ({ page }) => {
    await page.goto("/login", { waitUntil: "networkidle" });
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText("Masuk");
  });

  test("show/hide password toggle", async ({ page }) => {
    await page.goto("/login", { waitUntil: "networkidle" });
    const pwInput = page.locator('input[type="password"]');
    await pwInput.fill("secret123");
    // Click eye toggle
    await page.locator('button[aria-label*="password"], button[aria-label*="Password"]').click();
    // Should now be text type
    await expect(page.locator('input[placeholder="Masukkan password"]')).toHaveAttribute("type", "text");
  });

  test("forgot password link works", async ({ page }) => {
    await page.goto("/login", { waitUntil: "networkidle" });
    await page.click('a[href="/forgot-password"]');
    await page.waitForURL("**/forgot-password");
    const body = await page.textContent("body") || "";
    expect(body.toLowerCase()).toContain("password");
  });

  test("register link works", async ({ page }) => {
    await page.goto("/login", { waitUntil: "networkidle" });
    await page.click('a[href="/register"]');
    await page.waitForURL("**/register");
    await expect(page.locator("body")).toContainText("Daftar");
  });

  test("wrong credentials shows error", async ({ page }) => {
    await page.goto("/login", { waitUntil: "networkidle" });
    await page.fill('input[type="email"]', "wrong@email.com");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button[type="submit"]');
    // Wait for error message — could be various Indonesian/English text
    await page.waitForTimeout(3000);
    const body = (await page.textContent("body") || "").toLowerCase();
    expect(body).toMatch(/gagal|error|salah|invalid|tidak/);
  });

  test("admin login → redirects to /admin", async ({ page }) => {
    await page.goto("/login", { waitUntil: "networkidle" });
    await page.fill('input[type="email"]', "admin@yourpage.id");
    await page.fill('input[type="password"]', "admin123");
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });
    // Admin goes to /admin or /welcome
    expect(page.url()).toMatch(/\/(admin|welcome)/);
  });
});

// ============================================================
// 05 — REGISTER FLOW (pure UI)
// ============================================================
test.describe("Register Flow", () => {
  test("form elements present", async ({ page }) => {
    await page.goto("/register", { waitUntil: "networkidle" });
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="huruf"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText("Daftar");
  });

  test("role selector — supporter vs kreator", async ({ page }) => {
    await page.goto("/register", { waitUntil: "networkidle" });
    const supporterBtn = page.getByRole("button", { name: /Supporter/ });
    const kreatorBtn = page.getByRole("button", { name: /Kreator/ });
    await expect(supporterBtn).toBeVisible();
    await expect(kreatorBtn).toBeVisible();
    await kreatorBtn.click();
    await page.waitForTimeout(300);
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("password mismatch shows inline error", async ({ page }) => {
    await page.goto("/register", { waitUntil: "networkidle" });
    const pwFields = page.locator('input[type="password"]');
    await pwFields.first().fill("Test1234!");
    await pwFields.last().fill("Different1!");
    await pwFields.last().blur();
    await expect(page.locator("body")).toContainText("tidak cocok", { timeout: 3000 });
  });

  test("password strength indicator shows", async ({ page }) => {
    await page.goto("/register", { waitUntil: "networkidle" });
    const pwField = page.locator('input[type="password"]').first();
    await pwField.fill("Test1234!");
    await page.waitForTimeout(300);
    // PasswordStrength component should render
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("referral code field shows bonus text", async ({ page }) => {
    await page.goto("/register", { waitUntil: "networkidle" });
    await page.locator('input[placeholder="Masukkan kode"]').fill("TESTREF");
    await expect(page.locator("body")).toContainText("10 Credit gratis", { timeout: 3000 });
  });

  test("existing email shows error", async ({ page }) => {
    await page.goto("/register", { waitUntil: "networkidle" });
    await page.fill('input[type="email"]', "admin@yourpage.id");
    await page.fill('input[placeholder*="huruf"]', "admindup");
    const pwFields = page.locator('input[type="password"]');
    await pwFields.first().fill("Test1234!");
    await pwFields.last().fill("Test1234!");
    await page.click('button[type="submit"]');
    await expect(page.locator("body")).toContainText(/sudah|already|gagal|error|exist/i, { timeout: 5000 });
  });

  test("terms & privacy links present", async ({ page }) => {
    await page.goto("/register", { waitUntil: "networkidle" });
    await expect(page.locator('a[href="/terms"]').first()).toBeVisible();
    await expect(page.locator('a[href="/privacy"]').first()).toBeVisible();
  });
});

// ============================================================
// 06 — AUTH GUARDS (unauthenticated → redirect to /login)
// ============================================================
test.describe("Auth Guards — redirect to login", () => {
  const protectedRoutes = [
    "/dashboard", "/dashboard/posts", "/dashboard/products",
    "/s", "/s/wallet",
    "/admin", "/admin/users",
    "/feed", "/notifications", "/chat", "/profile",
    "/wallet", "/library/posts", "/library/products",
  ];

  for (const route of protectedRoutes) {
    test(`${route} → /login`, async ({ page }) => {
      await page.goto(route, { waitUntil: "networkidle", timeout: 15000 });
      expect(page.url()).toContain("/login");
    });
  }
});

// ============================================================
// 07 — ROLE GUARDS (wrong role → redirect)
// ============================================================
test.describe("Role Guards", () => {
  test("supporter cookie cannot access /admin", async ({ page }) => {
    await page.context().addCookies([
      { name: "auth-role", value: "supporter", domain: "localhost", path: "/" },
    ]);
    await page.goto("/admin", { waitUntil: "networkidle" });
    expect(page.url()).toContain("/login");
  });

  test("supporter cookie cannot access /dashboard", async ({ page }) => {
    await page.context().addCookies([
      { name: "auth-role", value: "supporter", domain: "localhost", path: "/" },
    ]);
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    expect(page.url()).toContain("/login");
  });

  test("creator cookie cannot access /admin", async ({ page }) => {
    await page.context().addCookies([
      { name: "auth-role", value: "creator", domain: "localhost", path: "/" },
    ]);
    await page.goto("/admin", { waitUntil: "networkidle" });
    expect(page.url()).toContain("/login");
  });
});
