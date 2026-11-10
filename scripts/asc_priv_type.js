// App Store Connect > App Privacy: complete one data type's "Set Up" flow.
// Usage: node asc_priv_type.js "Set Up Email Address" APP_FUNCTIONALITY,PRODUCT_PERSONALIZATION [linked=true] [tracked=false]
//
// Environment:
//   STORE_CONSOLE_CDP_HOST  CDP host (default 127.0.0.1; CDP_HOST also accepted)
//   STORE_CONSOLE_CDP_PORT  CDP port (default 9222; CDP_PORT also accepted)
const { chromium } = require('playwright-core');
const HOST = process.env.STORE_CONSOLE_CDP_HOST || process.env.CDP_HOST || '127.0.0.1';
const PORT = process.env.STORE_CONSOLE_CDP_PORT || process.env.CDP_PORT || 9222;
(async () => {
  const browser = await chromium.connectOverCDP(`http://${HOST}:${PORT}`);
  const page = browser.contexts()[0].pages().find(p => p.url().includes('appstoreconnect'));
  if (!page) { console.error('no appstoreconnect page'); process.exit(1); }
  const [label, purposes, linked = 'true', tracked = 'false'] = process.argv.slice(2);
  const next = async (l = 'Next') => { await page.locator(`button:has-text("${l}") >> visible=true`).last().click(); await page.waitForTimeout(2000); };
  await page.locator(`text="${label}"`).first().click(); await page.waitForTimeout(2500);
  for (const p of purposes.split(',')) await page.locator(`input[type=checkbox][name="${p}"]`).first().check({ force: true });
  await next();
  await page.locator(`input[type=radio][name="isLinked"][value="${linked}"]`).first().check({ force: true });
  await next(); await next(); await next();   // isLinked -> 2 definition pages -> isTracked
  await page.locator(`input[type=radio][name="isTracked"][value="${tracked}"]`).first().check({ force: true });
  await next('Save');
  const t = await page.evaluate(() => document.body.innerText);
  console.log(label, 'done | remaining Set Up:', (t.match(/Set Up [A-Z][A-Za-z ]+/g) || []).join(', ') || 'none');
  await browser.close();
})();
