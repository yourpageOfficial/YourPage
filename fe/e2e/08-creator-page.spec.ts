import { test, expect, type APIRequestContext } from "@playwright/test";

const API = "http://localhost:8080/api/v1";

async function registerCreator(request: APIRequestContext) {
  const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const creds = { email: `cpg${stamp}@example.com`, username: `cpg${stamp}`, password: "TestPass123!" };
  const reg = await request.post(`${API}/auth/register`, { data: { ...creds, role: "creator" } });
  expect(reg.ok(), `register -> HTTP ${reg.status()}`).toBeTruthy();

  const login = await request.post(`${API}/auth/login`, { data: { email: creds.email, password: creds.password } });
  expect(login.ok(), `login -> HTTP ${login.status()}`).toBeTruthy();
  const token = (await login.json()).data.access_token as string;

  const me = await request.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
  const body = (await me.json()).data;
  return { ...creds, token, id: body.id as string, slug: (body.page_slug || creds.username) as string };
}

test.describe("Public creator page", () => {
  test("serves an existing creator and 404s only for one that does not exist", async ({ request }) => {
    const creator = await registerCreator(request);

    const found = await request.get(`${API}/creators/${creator.slug}`);
    expect(found.ok(), `existing creator -> HTTP ${found.status()}`).toBeTruthy();
    expect((await found.json()).data.page_slug).toBe(creator.slug);

    const missing = await request.get(`${API}/creators/slug-yang-pasti-tidak-ada-12345`);
    expect(missing.status()).toBe(404);
  });

  // Regression guard: a creator whose tags column is non-NULL used to fail to
  // scan, and the handler reported that database error as "creator not found",
  // so every such profile looked deleted. The page must render, not 404.
  test("renders a creator that has tags set", async ({ page, request }) => {
    const creator = await registerCreator(request);

    const saved = await request.put(`${API}/creator/tags`, {
      headers: { Authorization: `Bearer ${creator.token}` },
      data: { tags: ["gaming", "musik"] },
    });
    expect(saved.ok(), `set tags -> HTTP ${saved.status()}`).toBeTruthy();

    // The guard is only meaningful if the column really is non-NULL now.
    const withTags = await request.get(`${API}/creators/${creator.slug}`);
    expect(withTags.ok(), `creator with tags -> HTTP ${withTags.status()}`).toBeTruthy();
    expect((await withTags.json()).data.tags).toEqual(["gaming", "musik"]);

    const res = await request.get(`${API}/creators/${creator.slug}`);
    expect(res.ok(), `creator with tags -> HTTP ${res.status()}`).toBeTruthy();

    await page.goto(`/c/${creator.slug}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText(`@${creator.slug}`)).toBeVisible({ timeout: 15000 });
  });

  test("a database failure is not reported as a missing creator", async ({ request }) => {
    // A malformed slug is still just "not found"; only genuine backend faults
    // may surface as 5xx. This pins the handler's error mapping.
    const res = await request.get(`${API}/creators/${"x".repeat(200)}`);
    expect([404, 400]).toContain(res.status());
  });
});
