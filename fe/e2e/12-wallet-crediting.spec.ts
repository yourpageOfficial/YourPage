import { test, expect, type APIRequestContext } from "@playwright/test";

const API = "http://localhost:8080/api/v1";
const ADMIN = { email: "admin@yourpage.id", password: "admin123" };

async function login(request: APIRequestContext, email: string, password: string) {
  const res = await request.post(`${API}/auth/login`, { data: { email, password } });
  expect(res.ok(), `login ${email} -> HTTP ${res.status()}`).toBeTruthy();
  return (await res.json()).data.access_token as string;
}

async function registerSupporter(request: APIRequestContext) {
  const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const creds = { email: `wc${stamp}@example.com`, username: `wc${stamp}`, password: "TestPass123!" };
  const reg = await request.post(`${API}/auth/register`, { data: { ...creds, role: "supporter" } });
  expect(reg.ok(), `register -> HTTP ${reg.status()}`).toBeTruthy();
  return { ...creds, token: await login(request, creds.email, creds.password) };
}

test.describe("Wallet crediting", () => {
  /**
   * Registration does not create a wallet row, and AddCredits was a plain
   * UPDATE: for a user who had never opened their wallet it matched nothing,
   * reported success, and the credits vanished. The top-up still showed as
   * paid and the audit trail still recorded it.
   *
   * This test must never read the balance before approval — doing so creates
   * the wallet as a side effect and hides the defect, which is exactly why the
   * existing approval test passed while real users lost credits.
   */
  test("credits arrive for a user who never opened their wallet", async ({ request }) => {
    const user = await registerSupporter(request);
    const adminToken = await login(request, ADMIN.email, ADMIN.password);

    const created = await request.post(`${API}/wallet/topup`, {
      headers: { Authorization: `Bearer ${user.token}` },
      data: { amount_idr: "100000", method: "qris" },
    });
    expect(created.ok(), `topup -> HTTP ${created.status()}`).toBeTruthy();
    const topup = (await created.json()).data;
    expect(topup.credits).toBe(100);

    const approved = await request.post(`${API}/admin/credit-topups/${topup.id}/approve`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {},
    });
    expect(approved.ok(), `approve -> HTTP ${approved.status()}`).toBeTruthy();

    const balance = (await (await request.get(`${API}/wallet/balance`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })).json()).data.balance_credits;
    expect(balance, "an approved top-up must actually reach the wallet").toBe(100);
  });

  test("a second top-up adds to the existing balance", async ({ request }) => {
    const user = await registerSupporter(request);
    const adminToken = await login(request, ADMIN.email, ADMIN.password);
    const headers = { Authorization: `Bearer ${user.token}` };

    for (const amount of ["20000", "30000"]) {
      const created = await request.post(`${API}/wallet/topup`, { headers, data: { amount_idr: amount, method: "qris" } });
      expect(created.ok(), `topup ${amount} -> HTTP ${created.status()}`).toBeTruthy();
      const topup = (await created.json()).data;
      const ok = await request.post(`${API}/admin/credit-topups/${topup.id}/approve`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {},
      });
      expect(ok.ok()).toBeTruthy();
    }

    const balance = (await (await request.get(`${API}/wallet/balance`, { headers })).json()).data.balance_credits;
    expect(balance).toBe(50);
  });
});
