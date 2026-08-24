import { test, expect, type APIRequestContext } from "@playwright/test";

const API = "http://localhost:8080/api/v1";

async function registerCreator(request: APIRequestContext) {
  const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const creds = { email: `st${stamp}@example.com`, username: `st${stamp}`, password: "TestPass123!" };
  const reg = await request.post(`${API}/auth/register`, { data: { ...creds, role: "creator" } });
  expect(reg.ok(), `register -> HTTP ${reg.status()}`).toBeTruthy();
  const login = await request.post(`${API}/auth/login`, { data: { email: creds.email, password: creds.password } });
  const token = (await login.json()).data.access_token as string;
  const me = await request.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
  const body = (await me.json()).data;
  return { ...creds, token, slug: (body.page_slug || creds.username) as string };
}

/**
 * Every creator-configurable field, its endpoint, the value to write, and the
 * key it must come back under on the public creator page.
 *
 * The point of this table is that a field cannot quietly become write-only:
 * both bugs found so far (tags, donation presets) were settings that saved
 * successfully and were then never returned or never used.
 */
const PROFILE_FIELDS: Array<{ field: string; send: unknown; publicKey: string; expect?: unknown }> = [
  { field: "display_name", send: "Kreator Uji", publicKey: "display_name" },
  { field: "bio", send: "Bio untuk pengujian round-trip", publicKey: "bio" },
  { field: "page_color", send: "#123ABC", publicKey: "page_color" },
  { field: "chat_price_idr", send: 7000, publicKey: "chat_price_idr" },
  { field: "chat_allow_from", send: "supporter_only", publicKey: "chat_allow_from" },
  { field: "donation_goal_title", send: "Beli mikrofon", publicKey: "donation_goal_title" },
  { field: "donation_goal_amount", send: 2500000, publicKey: "donation_goal_amount" },
  { field: "welcome_message", send: "Halo, terima kasih sudah mampir!", publicKey: "welcome_message" },
  { field: "category", send: "gaming", publicKey: "category" },
  { field: "overlay_style", send: "pop", publicKey: "overlay_style" },
];

test.describe("Creator settings round-trip", () => {
  test("every profile field saved is returned by the public page", async ({ request }) => {
    const creator = await registerCreator(request);
    const headers = { Authorization: `Bearer ${creator.token}` };

    const payload: Record<string, unknown> = {};
    for (const f of PROFILE_FIELDS) payload[f.field] = f.send;

    const saved = await request.put(`${API}/auth/me`, { headers, data: payload });
    expect(saved.ok(), `save profile -> HTTP ${saved.status()}: ${await saved.text()}`).toBeTruthy();

    const pub = await request.get(`${API}/creators/${creator.slug}`);
    expect(pub.ok(), `public page -> HTTP ${pub.status()}`).toBeTruthy();
    const data = (await pub.json()).data;

    const missing: string[] = [];
    for (const f of PROFILE_FIELDS) {
      const got = data[f.publicKey];
      if (got !== (f.expect ?? f.send)) missing.push(`${f.publicKey}: expected ${JSON.stringify(f.expect ?? f.send)}, got ${JSON.stringify(got)}`);
    }
    expect(missing, `fields that did not survive the round-trip:\n${missing.join("\n")}`).toEqual([]);
  });

  test("social links survive the round-trip", async ({ request }) => {
    const creator = await registerCreator(request);
    const headers = { Authorization: `Bearer ${creator.token}` };
    const links = { instagram: "kreatoruji", youtube: "kanaluji", tiktok: "", x: "" };

    const saved = await request.put(`${API}/auth/me`, { headers, data: { social_links: links } });
    expect(saved.ok(), `save -> HTTP ${saved.status()}`).toBeTruthy();

    const data = (await (await request.get(`${API}/creators/${creator.slug}`)).json()).data;
    expect(data.social_links.instagram).toBe("kreatoruji");
    expect(data.social_links.youtube).toBe("kanaluji");
  });

  test("tags are saved, returned, and rendered on the page", async ({ page, request }) => {
    const creator = await registerCreator(request);
    const headers = { Authorization: `Bearer ${creator.token}` };

    const saved = await request.put(`${API}/creator/tags`, { headers, data: { tags: ["gaming", "vtuber"] } });
    expect(saved.ok(), `save tags -> HTTP ${saved.status()}`).toBeTruthy();

    const data = (await (await request.get(`${API}/creators/${creator.slug}`)).json()).data;
    expect(data.tags).toEqual(["gaming", "vtuber"]);

    // Returned is not enough — they were previously stored and never shown.
    await page.goto(`/c/${creator.slug}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText("gaming", { exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("vtuber", { exact: true })).toBeVisible();
  });

  test("overlay appearance settings survive the round-trip", async ({ request }) => {
    const creator = await registerCreator(request);
    const headers = { Authorization: `Bearer ${creator.token}` };

    const settings = {
      overlay_style: "drop",
      overlay_text_template: "{donor} -> {amount}",
      overlay_accent_color: "#00AABB",
      overlay_text_color: "#112233",
      overlay_font: "Poppins",
      overlay_duration_ms: 6000,
      overlay_position: "bottom-right",
      overlay_sound_volume: 45,
      overlay_tts_enabled: false,
      overlay_tts_min_credits: 25,
    };
    const saved = await request.put(`${API}/overlay/settings`, { headers, data: settings });
    expect(saved.ok(), `save overlay -> HTTP ${saved.status()}: ${await saved.text()}`).toBeTruthy();

    // The overlay reads its own config endpoint, so that is what must reflect it.
    const meRes = await request.get(`${API}/auth/me`, { headers });
    const creatorId = (await meRes.json()).data.id;
    const cfg = (await (await request.get(`${API}/overlay/${creatorId}/config`)).json()).data;

    const mismatched: string[] = [];
    for (const [k, v] of Object.entries(settings)) {
      if (cfg[k] !== v) mismatched.push(`${k}: expected ${JSON.stringify(v)}, got ${JSON.stringify(cfg[k])}`);
    }
    expect(mismatched, `overlay settings lost:\n${mismatched.join("\n")}`).toEqual([]);
  });

  test("donation settings survive the round-trip", async ({ request }) => {
    const creator = await registerCreator(request);
    const headers = { Authorization: `Bearer ${creator.token}` };

    const saved = await request.put(`${API}/creator/donation-settings`, {
      headers,
      data: { donation_enabled: true, donation_min_amount: 2000, donation_preset_amounts: [2000, 7000, 20000] },
    });
    expect(saved.ok(), `save -> HTTP ${saved.status()}`).toBeTruthy();

    const data = (await (await request.get(`${API}/creators/${creator.slug}`)).json()).data;
    expect(data.donation_preset_amounts).toEqual([2000, 7000, 20000]);
    expect(data.donation_min_amount).toBe(2000);
    expect(data.donation_enabled).toBe(true);
  });

  test("leaderboard settings survive the round-trip", async ({ request }) => {
    const creator = await registerCreator(request);
    const headers = { Authorization: `Bearer ${creator.token}` };
    const creatorId = (await (await request.get(`${API}/auth/me`, { headers })).json()).data.id;

    const saved = await request.put(`${API}/leaderboard/${creatorId}/settings`, {
      headers,
      data: { is_enabled: true, period: "monthly", max_entries: 7, show_amount: false, title: "Pendukung Teratas" },
    });
    expect(saved.ok(), `save -> HTTP ${saved.status()}: ${await saved.text()}`).toBeTruthy();

    const board = (await (await request.get(`${API}/leaderboard/${creatorId}`)).json()).data;
    expect(board.settings.period).toBe("monthly");
    expect(board.settings.max_entries).toBe(7);
    expect(board.settings.show_amount).toBe(false);
  });
});
