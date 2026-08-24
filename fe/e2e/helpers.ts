import { expect, type Page } from "@playwright/test";

/**
 * Dismisses the cookie consent banner, which is fixed to the bottom of the
 * viewport and can sit over controls the tests need to click.
 */
export async function dismissCookieBanner(page: Page) {
  const decline = page.getByRole("button", { name: "Tolak", exact: true });
  if (await decline.isVisible().catch(() => false)) {
    await decline.click().catch(() => {});
  }
}

/**
 * Logs in through the real UI.
 *
 * The suite performs dozens of logins from one IP and /auth/login is rate
 * limited (5 rps, burst 10), so a transient rejection is expected rather than
 * a product failure — hence the bounded retry with backoff.
 */
export async function loginViaUI(page: Page, email: string, password: string) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.goto("/login", { waitUntil: "load" });
      await dismissCookieBanner(page);

      await page.getByPlaceholder("nama@email.com").fill(email);
      await page.getByPlaceholder("Masukkan password").fill(password);

      // Submitting only works once React has hydrated. Against `next dev` a
      // chunk request can be aborted by an in-flight recompile, leaving the
      // form as plain HTML that reloads the page instead of calling the API —
      // so require the login request itself, not just a click.
      const loginPosted = page
        .waitForResponse(
          (r) => r.url().includes("/auth/login") && r.request().method() === "POST",
          { timeout: 10000 }
        )
        .catch(() => null);

      await page.getByRole("button", { name: "Masuk", exact: true }).click();

      if (!(await loginPosted)) {
        throw new Error("login request was never sent (page likely not hydrated yet)");
      }
      await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });
      return;
    } catch (err) {
      lastError = err;
      await page.waitForTimeout(1000);
    }
  }

  expect(lastError, `login for ${email} failed after 3 attempts: ${lastError}`).toBeUndefined();
}
