import { test, expect, type APIRequestContext, type Page } from "@playwright/test";

const API = "http://localhost:8080/api/v1";

async function registerCreator(request: APIRequestContext) {
  const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const creds = { email: `ovl${stamp}@example.com`, username: `ovl${stamp}`, password: "TestPass123!" };
  const reg = await request.post(`${API}/auth/register`, { data: { ...creds, role: "creator" } });
  expect(reg.ok(), `register -> HTTP ${reg.status()}`).toBeTruthy();

  const login = await request.post(`${API}/auth/login`, { data: { email: creds.email, password: creds.password } });
  expect(login.ok(), `login -> HTTP ${login.status()}`).toBeTruthy();
  const token = (await login.json()).data.access_token as string;

  const me = await request.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
  const id = (await me.json()).data.id as string;
  return { ...creds, token, id };
}

/**
 * Waits until the page's alert stream is genuinely connected. Redis pub/sub has
 * no replay, so publishing before the overlay has subscribed loses the alert
 * and would make this suite flaky for the wrong reason.
 */
async function waitForStreamOpen(page: Page, creatorId: string) {
  const connected = await page.evaluate(
    (cid) =>
      new Promise<boolean>((resolve) => {
        const es = new EventSource(`/api/v1/overlay/${cid}/stream`);
        es.onopen = () => resolve(true);
        es.onerror = () => resolve(false);
        setTimeout(() => resolve(false), 8000);
      }),
    creatorId
  );
  expect(connected, "overlay alert stream did not connect").toBeTruthy();
}

test.describe("OBS overlay", () => {
  test("renders a donation alert pushed over the live stream", async ({ page, request }) => {
    const creator = await registerCreator(request);

    await page.goto(`/overlay?id=${creator.id}`, { waitUntil: "load" });
    await waitForStreamOpen(page, creator.id);

    const sent = Date.now();
    const res = await request.post(`${API}/overlay/test`, {
      headers: { Authorization: `Bearer ${creator.token}` },
      data: { credits: 250, message: "Pesan uji dari e2e" },
    });
    expect(res.ok(), `test alert -> HTTP ${res.status()}`).toBeTruthy();

    // This is the regression guard: the alert travels over Server-Sent Events,
    // and any layer that gzips or buffers that stream (the Go gzip middleware,
    // Next's compressor, nginx proxy buffering) silently prevents it from ever
    // arriving. curl does not reproduce it because it omits Accept-Encoding.
    const alert = page.locator(".yp-alert");
    await expect(alert).toBeVisible({ timeout: 10000 });
    expect(Date.now() - sent, "alert should arrive in well under a second").toBeLessThan(5000);

    await expect(alert).toContainText("250 Credit");
    await expect(alert).toContainText("Pesan uji dari e2e");
  });

  test("shows no app chrome — an OBS source must not display site UI", async ({ page, request }) => {
    const creator = await registerCreator(request);
    await page.goto(`/overlay?id=${creator.id}`, { waitUntil: "load" });

    // A cookie banner or bottom nav here would be composited onto the stream.
    await expect(page.getByText(/Kami menggunakan cookies/i)).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Terima", exact: true })).toHaveCount(0);
    await expect(page.locator("nav")).toHaveCount(0);
  });

  test("queues concurrent alerts instead of dropping them", async ({ page, request }) => {
    const creator = await registerCreator(request);
    await page.goto(`/overlay?id=${creator.id}`, { waitUntil: "load" });
    await waitForStreamOpen(page, creator.id);

    // Two donations landing back to back must both be shown; the previous
    // implementation overwrote the first with the second.
    await request.post(`${API}/overlay/test`, {
      headers: { Authorization: `Bearer ${creator.token}` },
      data: { credits: 10, message: "Donasi pertama" },
    });
    await request.post(`${API}/overlay/test`, {
      headers: { Authorization: `Bearer ${creator.token}` },
      data: { credits: 20, message: "Donasi kedua" },
    });

    await expect(page.locator(".yp-alert")).toContainText("Donasi pertama", { timeout: 10000 });
    // The second one plays after the first finishes rather than replacing it.
    await expect(page.locator(".yp-alert")).toContainText("Donasi kedua", { timeout: 30000 });
  });

  test("config endpoint serves render settings without requiring auth", async ({ request }) => {
    const creator = await registerCreator(request);
    const res = await request.get(`${API}/overlay/${creator.id}/config`);
    expect(res.ok(), `config -> HTTP ${res.status()}`).toBeTruthy();

    const cfg = (await res.json()).data;
    expect(cfg).toHaveProperty("overlay_style");
    expect(cfg).toHaveProperty("overlay_duration_ms");
    expect(Array.isArray(cfg.tiers)).toBeTruthy();
  });

  test("rejects overlay settings that are not on the allowed list", async ({ request }) => {
    const creator = await registerCreator(request);
    const headers = { Authorization: `Bearer ${creator.token}` };

    // These values end up in CSS on a page embedded in OBS, so they are
    // constrained server-side rather than trusted.
    for (const bad of [
      { overlay_accent_color: "red; background:url(https://evil.example)" },
      { overlay_font: "'; import 'evil" },
      { overlay_style: "definitely-not-an-animation" },
      { overlay_duration_ms: 999999 },
      { overlay_sound_volume: 500 },
    ]) {
      const res = await request.put(`${API}/overlay/settings`, { headers, data: bad });
      expect(res.status(), `expected rejection for ${JSON.stringify(bad)}`).toBe(422);
    }

    const ok = await request.put(`${API}/overlay/settings`, {
      headers,
      data: { overlay_accent_color: "#123ABC", overlay_style: "pop", overlay_duration_ms: 5000 },
    });
    expect(ok.ok(), `valid settings -> HTTP ${ok.status()}`).toBeTruthy();
  });

  test("test alert requires a creator account", async ({ request }) => {
    const res = await request.post(`${API}/overlay/test`, { data: { credits: 10 } });
    expect(res.status()).toBe(401);
  });
});
