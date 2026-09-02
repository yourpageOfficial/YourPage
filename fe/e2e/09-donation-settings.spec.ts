import { test, expect, type APIRequestContext } from "@playwright/test";
import { dismissCookieBanner } from "./helpers";

const API = "http://localhost:8080/api/v1";

async function registerCreator(request: APIRequestContext) {
  const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const creds = { email: `dn${stamp}@example.com`, username: `dn${stamp}`, password: "TestPass123!" };
  const reg = await request.post(`${API}/auth/register`, { data: { ...creds, role: "creator" } });
  expect(reg.ok(), `register -> HTTP ${reg.status()}`).toBeTruthy();
  const login = await request.post(`${API}/auth/login`, { data: { email: creds.email, password: creds.password } });
  const token = (await login.json()).data.access_token as string;
  const me = await request.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
  const body = (await me.json()).data;
  return { ...creds, token, slug: (body.page_slug || creds.username) as string };
}

test.describe("Creator donation settings", () => {
  // These were saved but never returned by the public page, and the creator
  // page ignored them entirely in favour of a hardcoded 5/10/25/50/100.
  test("custom preset amounts reach the public page and its donate form", async ({ page, request }) => {
    const creator = await registerCreator(request);

    const saved = await request.put(`${API}/creator/donation-settings`, {
      headers: { Authorization: `Bearer ${creator.token}` },
      data: { donation_enabled: true, donation_min_amount: 5000, donation_preset_amounts: [5000, 15000, 30000] },
    });
    expect(saved.ok(), `save settings -> HTTP ${saved.status()}`).toBeTruthy();

    const pub = await request.get(`${API}/creators/${creator.slug}`);
    expect(pub.ok()).toBeTruthy();
    const data = (await pub.json()).data;
    expect(data.donation_preset_amounts).toEqual([5000, 15000, 30000]);
    expect(data.donation_min_amount).toBe(5000);

    // The form works in Credits, so Rp15.000 must appear as 15.
    await page.goto(`/c/${creator.slug}`, { waitUntil: "domcontentloaded" });
    await dismissCookieBanner(page);
    await page.getByRole("button", { name: /Donasi/ }).first().click();
    await expect(page.getByRole("button", { name: "15", exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("button", { name: "30", exact: true })).toBeVisible();
    // 10 and 100 are defaults this creator did not choose.
    await expect(page.getByRole("button", { name: "100", exact: true })).toHaveCount(0);
  });

  test("disabling donations hides the donate button", async ({ page, request }) => {
    const creator = await registerCreator(request);

    const saved = await request.put(`${API}/creator/donation-settings`, {
      headers: { Authorization: `Bearer ${creator.token}` },
      data: { donation_enabled: false },
    });
    expect(saved.ok(), `disable -> HTTP ${saved.status()}`).toBeTruthy();

    const pub = await request.get(`${API}/creators/${creator.slug}`);
    expect((await pub.json()).data.donation_enabled).toBe(false);

    await page.goto(`/c/${creator.slug}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText(`@${creator.slug}`)).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("button", { name: /^Donasi/ })).toHaveCount(0);
  });
});
