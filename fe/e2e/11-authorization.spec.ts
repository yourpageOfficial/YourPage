import { test, expect, type APIRequestContext } from "@playwright/test";

const API = "http://localhost:8080/api/v1";

async function register(request: APIRequestContext, role: "creator" | "supporter") {
  const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const creds = { email: `az${stamp}@example.com`, username: `az${stamp}`, password: "TestPass123!" };
  const reg = await request.post(`${API}/auth/register`, { data: { ...creds, role } });
  expect(reg.ok(), `register -> HTTP ${reg.status()}`).toBeTruthy();
  const login = await request.post(`${API}/auth/login`, { data: { email: creds.email, password: creds.password } });
  const token = (await login.json()).data.access_token as string;
  const me = await request.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
  const body = (await me.json()).data;
  return { ...creds, token, id: body.id as string, slug: (body.page_slug || creds.username) as string };
}

test.describe("Authorization boundaries", () => {
  // A creator could rewrite any other creator's leaderboard: the handler took
  // the creator id straight from the URL and never checked it against the
  // caller. Renaming it, hiding it, or changing what it shows all worked.
  test("a creator cannot modify another creator's leaderboard", async ({ request }) => {
    const victim = await register(request, "creator");
    const attacker = await register(request, "creator");

    const before = (await (await request.get(`${API}/leaderboard/${victim.id}`)).json()).data.settings;

    const attack = await request.put(`${API}/leaderboard/${victim.id}/settings`, {
      headers: { Authorization: `Bearer ${attacker.token}` },
      data: { title: "PWNED", is_enabled: false, max_entries: 1 },
    });
    expect(attack.status(), "another creator's settings must be forbidden").toBe(403);

    const after = (await (await request.get(`${API}/leaderboard/${victim.id}`)).json()).data.settings;
    expect(after.title).toBe(before.title);
    expect(after.is_enabled).toBe(before.is_enabled);
  });

  test("a creator can still modify their own leaderboard", async ({ request }) => {
    const creator = await register(request, "creator");
    const res = await request.put(`${API}/leaderboard/${creator.id}/settings`, {
      headers: { Authorization: `Bearer ${creator.token}` },
      data: { title: "Pendukung Terbaik", max_entries: 5 },
    });
    expect(res.ok(), `own settings -> HTTP ${res.status()}`).toBeTruthy();

    const board = (await (await request.get(`${API}/leaderboard/${creator.id}`)).json()).data;
    expect(board.settings.title).toBe("Pendukung Terbaik");
    expect(board.settings.max_entries).toBe(5);
  });

  test("a supporter cannot reach creator-only endpoints", async ({ request }) => {
    const supporter = await register(request, "supporter");
    const headers = { Authorization: `Bearer ${supporter.token}` };

    for (const path of ["/creator/earnings", "/creator/sales", "/media-share/queue"]) {
      const res = await request.get(`${API}${path}`, { headers });
      expect(res.status(), `${path} must be forbidden for a supporter`).toBe(403);
    }
  });

  test("a creator cannot reach admin endpoints", async ({ request }) => {
    const creator = await register(request, "creator");
    const headers = { Authorization: `Bearer ${creator.token}` };

    for (const path of ["/admin/users", "/admin/settings", "/admin/payment-audit", "/admin/kyc"]) {
      const res = await request.get(`${API}${path}`, { headers });
      expect(res.status(), `${path} must be forbidden for a creator`).toBe(403);
    }
  });
});

test.describe("Identity documents", () => {
  // KYC images used to go to the anonymously readable public bucket, so an ID
  // card was fetchable by anyone holding the URL.
  test("an uploaded ID document is not publicly readable", async ({ request }) => {
    const creator = await register(request, "creator");
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64"
    );

    const up = await request.post(`${API}/upload/private`, {
      headers: { Authorization: `Bearer ${creator.token}` },
      multipart: { file: { name: "ktp.png", mimeType: "image/png", buffer: png } },
    });
    expect(up.ok(), `private upload -> HTTP ${up.status()}`).toBeTruthy();
    const url = (await up.json()).data.url as string;
    expect(url).toContain("private-media");

    // Fetched with no credentials at all, exactly as a stranger would.
    const anon = await request.get(`http://localhost:3000${url}`);
    expect(anon.status(), "an ID document must not be anonymously readable").toBe(403);
  });
});
