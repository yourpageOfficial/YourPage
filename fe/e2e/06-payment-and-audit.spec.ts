import { test, expect, type APIRequestContext } from "@playwright/test";
import { loginViaUI, dismissCookieBanner } from "./helpers";

const API = "http://localhost:8080/api/v1";
const ADMIN = { email: "admin@yourpage.id", password: "admin123" };

// A 1x1 PNG, generated inline so the repo carries no binary fixture.
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

async function apiLogin(request: APIRequestContext, email: string, password: string) {
  const res = await request.post(`${API}/auth/login`, { data: { email, password } });
  expect(res.ok(), `login ${email} -> HTTP ${res.status()}`).toBeTruthy();
  return (await res.json()).data.access_token as string;
}

async function registerSupporter(request: APIRequestContext) {
  const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const creds = { email: `e2e${stamp}@example.com`, username: `e2e${stamp}`, password: "TestPass123!" };
  const res = await request.post(`${API}/auth/register`, {
    data: { ...creds, role: "supporter" },
  });
  expect(res.ok(), `register -> HTTP ${res.status()}`).toBeTruthy();
  const token = (await res.json()).data.access_token as string;
  return { ...creds, token: token || (await apiLogin(request, creds.email, creds.password)) };
}

function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

async function balanceOf(request: APIRequestContext, token: string): Promise<number> {
  const res = await request.get(`${API}/wallet/balance`, { headers: auth(token) });
  expect(res.ok()).toBeTruthy();
  return (await res.json()).data.balance_credits;
}

// ============================================================
// QRIS manual top-up — the primary funding path
// ============================================================
test.describe("QRIS top-up", () => {
  test("creates a topup carrying a unique code and stays pending until an admin approves", async ({ request }) => {
    const user = await registerSupporter(request);

    const res = await request.post(`${API}/wallet/topup`, {
      headers: auth(user.token),
      data: { amount_idr: "50000", method: "qris" },
    });
    expect(res.ok(), `topup -> HTTP ${res.status()}`).toBeTruthy();
    const topup = (await res.json()).data;

    expect(topup.method).toBe("qris");
    expect(topup.status).toBe("pending");
    expect(topup.credits).toBe(50);
    // The unique code is what lets an admin match a bank transfer to a request,
    // so the charged amount must be the base amount plus that code.
    expect(topup.unique_code).toBeGreaterThan(0);
    expect(topup.amount_idr).toBe(50000 + topup.unique_code);

    // Credits must NOT be granted before approval.
    expect(await balanceOf(request, user.token)).toBe(0);
  });

  test("rejects amounts outside the allowed range", async ({ request }) => {
    const user = await registerSupporter(request);

    // 422 = the request was well-formed but violates a business rule.
    const tooSmall = await request.post(`${API}/wallet/topup`, {
      headers: auth(user.token),
      data: { amount_idr: "5000", method: "qris" },
    });
    expect(tooSmall.status()).toBe(422);

    const tooLarge = await request.post(`${API}/wallet/topup`, {
      headers: auth(user.token),
      data: { amount_idr: "200000000", method: "qris" },
    });
    expect(tooLarge.status()).toBe(422);

    // An amount near int64 max must be refused, not wrapped around.
    const overflow = await request.post(`${API}/wallet/topup`, {
      headers: auth(user.token),
      data: { amount_idr: "9223372036854775000", method: "qris" },
    });
    expect(overflow.status()).toBe(422);
  });

  test("a supporter cannot read another user's topup", async ({ request }) => {
    const owner = await registerSupporter(request);
    const stranger = await registerSupporter(request);

    const created = await request.post(`${API}/wallet/topup`, {
      headers: auth(owner.token),
      data: { amount_idr: "10000", method: "qris" },
    });
    expect(created.ok(), `topup -> HTTP ${created.status()}: ${await created.text()}`).toBeTruthy();
    const topupID = (await created.json()).data.id;

    const res = await request.get(`${API}/wallet/topup/${topupID}`, { headers: auth(stranger.token) });
    expect(res.status()).toBe(403);
  });
});

// ============================================================
// Admin approval — the point where real credits are minted
// ============================================================
test.describe("Admin topup approval", () => {
  test("approving credits the wallet exactly once, even under concurrent approvals", async ({ request }) => {
    const user = await registerSupporter(request);
    const adminToken = await apiLogin(request, ADMIN.email, ADMIN.password);

    const created = await request.post(`${API}/wallet/topup`, {
      headers: auth(user.token),
      data: { amount_idr: "30000", method: "qris" },
    });
    expect(created.ok(), `topup -> HTTP ${created.status()}: ${await created.text()}`).toBeTruthy();
    const topup = (await created.json()).data;
    expect(await balanceOf(request, user.token)).toBe(0);

    // Fire several approvals at once: an admin double-click alone is enough to
    // produce this, and each one credits real money.
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        request.post(`${API}/admin/credit-topups/${topup.id}/approve`, {
          headers: auth(adminToken),
          data: {},
        })
      )
    );
    const statuses = results.map((r) => r.status()).sort();
    expect(statuses.filter((s) => s === 200)).toHaveLength(1);
    expect(statuses.filter((s) => s === 409)).toHaveLength(4);

    expect(await balanceOf(request, user.token)).toBe(30);
  });

  test("rejecting leaves the balance untouched and blocks a later approval", async ({ request }) => {
    const user = await registerSupporter(request);
    const adminToken = await apiLogin(request, ADMIN.email, ADMIN.password);

    const created = await request.post(`${API}/wallet/topup`, {
      headers: auth(user.token),
      data: { amount_idr: "20000", method: "qris" },
    });
    expect(created.ok(), `topup -> HTTP ${created.status()}: ${await created.text()}`).toBeTruthy();
    const topup = (await created.json()).data;

    const rejected = await request.post(`${API}/admin/credit-topups/${topup.id}/reject`, {
      headers: auth(adminToken),
      data: { admin_note: "bukti tidak jelas" },
    });
    expect(rejected.ok()).toBeTruthy();
    expect(await balanceOf(request, user.token)).toBe(0);

    const lateApproval = await request.post(`${API}/admin/credit-topups/${topup.id}/approve`, {
      headers: auth(adminToken),
      data: {},
    });
    expect(lateApproval.status()).toBe(409);
    expect(await balanceOf(request, user.token)).toBe(0);
  });
});

// ============================================================
// Payment method configuration + secret handling
// ============================================================
test.describe("Admin payment methods", () => {
  test("stored Stripe secrets are only ever returned masked", async ({ request }) => {
    const adminToken = await apiLogin(request, ADMIN.email, ADMIN.password);
    const secret = "sk_test_E2ESECRET4242";

    const saved = await request.put(`${API}/admin/settings`, {
      headers: auth(adminToken),
      data: { stripe_enabled: true, stripe_secret_key: secret, stripe_webhook_secret: "whsec_E2E9999" },
    });
    expect(saved.ok()).toBeTruthy();
    const savedBody = await saved.json();
    expect(savedBody.data.stripe_secret_key).not.toContain(secret);
    expect(savedBody.data.stripe_secret_key).toContain("4242");

    const fetched = await request.get(`${API}/admin/settings`, { headers: auth(adminToken) });
    const fetchedBody = await fetched.json();
    expect(fetchedBody.data.stripe_secret_key).not.toContain(secret);
    expect(fetchedBody.data.stripe_secret_key).toContain("4242");

    // Re-saving the mask (what the form submits when the admin edits nothing
    // else) must not overwrite the stored key with its own placeholder.
    await request.put(`${API}/admin/settings`, {
      headers: auth(adminToken),
      data: { stripe_secret_key: fetchedBody.data.stripe_secret_key },
    });
    const after = await (await request.get(`${API}/admin/settings`, { headers: auth(adminToken) })).json();
    expect(after.data.stripe_secret_key).toContain("4242");

    // Restore: leave the platform on QRIS only.
    await request.put(`${API}/admin/settings`, {
      headers: auth(adminToken),
      data: { stripe_enabled: false, stripe_secret_key: "", stripe_webhook_secret: "" },
    });
  });

  test("the public payment-methods endpoint exposes no secrets", async ({ request }) => {
    const res = await request.get(`${API}/platform/payment-methods`);
    expect(res.ok()).toBeTruthy();
    const raw = await res.text();

    expect(raw).not.toContain("secret");
    expect(raw).not.toContain("sk_");
    expect(raw).not.toContain("whsec_");
    const body = JSON.parse(raw);
    expect(body.data).toHaveProperty("qris_enabled");
    expect(body.data).toHaveProperty("stripe_enabled");
  });

  test("a disabled method cannot be used for a top-up", async ({ request }) => {
    const user = await registerSupporter(request);
    // Stripe is left disabled by the platform default.
    const res = await request.post(`${API}/wallet/topup`, {
      headers: auth(user.token),
      data: { amount_idr: "20000", method: "stripe" },
    });
    expect(res.status()).toBe(422);
  });
});

// ============================================================
// Webhook must not be callable without a valid signature
// ============================================================
test.describe("Stripe webhook", () => {
  test("rejects an unsigned event", async ({ request }) => {
    const res = await request.post(`${API}/webhooks/stripe`, {
      data: { type: "checkout.session.completed", data: { object: { id: "cs_fake", payment_status: "paid" } } },
    });
    expect(res.status()).toBe(401);
  });

  test("rejects a forged signature", async ({ request }) => {
    const res = await request.post(`${API}/webhooks/stripe`, {
      headers: { "Stripe-Signature": `t=${Math.floor(Date.now() / 1000)},v1=deadbeef` },
      data: { type: "checkout.session.completed", data: { object: { id: "cs_fake", payment_status: "paid" } } },
    });
    expect(res.status()).toBe(401);
  });
});

// ============================================================
// Audit trail
// ============================================================
test.describe("Payment audit trail", () => {
  test("records the top-up and its approval with actor and amount", async ({ request }) => {
    const user = await registerSupporter(request);
    const adminToken = await apiLogin(request, ADMIN.email, ADMIN.password);

    const created = await request.post(`${API}/wallet/topup`, {
      headers: auth(user.token),
      data: { amount_idr: "40000", method: "qris" },
    });
    expect(created.ok(), `topup -> HTTP ${created.status()}: ${await created.text()}`).toBeTruthy();
    const topup = (await created.json()).data;

    await request.post(`${API}/admin/credit-topups/${topup.id}/approve`, {
      headers: auth(adminToken),
      data: {},
    });

    const audit = await request.get(`${API}/admin/payment-audit?limit=50`, { headers: auth(adminToken) });
    expect(audit.ok()).toBeTruthy();
    const entries = (await audit.json()).data as any[];

    const forThisTopup = entries.filter((e) => e.reference_id === topup.id);
    const events = forThisTopup.map((e) => e.event);
    expect(events).toContain("topup.created");
    expect(events).toContain("topup.approved");

    const approval = forThisTopup.find((e) => e.event === "topup.approved");
    expect(approval.amount_idr).toBe(topup.amount_idr);
    expect(approval.credits).toBe(40);
    expect(approval.actor_role).toBe("admin");
  });

  test("requires authentication", async ({ request }) => {
    const res = await request.get(`${API}/admin/payment-audit`);
    expect(res.status()).toBe(401);
  });
});

// ============================================================
// Top-up UI
// ============================================================
test.describe("Top-up page UI", () => {
  test("shows the QRIS option and the unique code after choosing an amount", async ({ page, request }) => {
    const user = await registerSupporter(request);
    await loginViaUI(page, user.email, user.password);

    await page.goto("/wallet/topup", { waitUntil: "domcontentloaded" });
    await dismissCookieBanner(page);
    await expect(page.getByRole("heading", { name: /Top-up Credit/i })).toBeVisible();

    await page.getByRole("button", { name: /QRIS/ }).first().click();
    await page.getByRole("button", { name: /Rp\s*50/ }).first().click();
    await page.getByRole("button", { name: /Lanjut/ }).click();

    // Step 2 must state the exact transfer amount and the unique code.
    await expect(page.getByText(/Transfer tepat sebesar/i)).toBeVisible();
    // "Kode unik" appears both as a label and inside surrounding copy.
    await expect(page.getByText(/Kode unik/i).first()).toBeVisible();
  });

  test("uploading proof moves the request to awaiting-verification", async ({ page, request }) => {
    const user = await registerSupporter(request);
    await loginViaUI(page, user.email, user.password);

    await page.goto("/wallet/topup", { waitUntil: "domcontentloaded" });
    await dismissCookieBanner(page);
    await page.getByRole("button", { name: /Rp\s*50/ }).first().click();
    await page.getByRole("button", { name: /Lanjut/ }).click();
    await expect(page.getByText(/Kode unik/i).first()).toBeVisible();

    await page.getByPlaceholder(/Nama di rekening/i).fill("E2E Tester");
    await page.setInputFiles('input[type="file"]', {
      name: "bukti.png",
      mimeType: "image/png",
      buffer: PNG_1PX,
    });
    await page.getByRole("button", { name: /Kirim Bukti Transfer/i }).click();

    await expect(page.getByText(/Menunggu verifikasi admin/i)).toBeVisible({ timeout: 20000 });
    // Still no credits: approval is a human step.
    expect(await balanceOf(request, user.token)).toBe(0);
  });
});
