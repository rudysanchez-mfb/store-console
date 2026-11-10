// App Store Connect wizard stepper (age rating, content rights, any radio-based dialog).
// Usage: node asc_wizard.js "name=value,name=value" [Next|Save|Done|-]
//   checks each radio by name/value, clicks the button (- = don't), prints wizard text + visible radios.
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
  for (const [n, v] of (process.argv[2] || '').split(',').filter(Boolean).map(s => s.split('='))) {
    const r = page.locator(`input[type=radio][name="${n}"][value="${v}"]`);
    if (await r.count()) await r.first().check({ force: true }); else console.log('MISSING', n, v);
  }
  const next = process.argv[3] || 'Next';
  if (next !== '-') { await page.locator(`button:has-text("${next}") >> visible=true`).last().click(); await page.waitForTimeout(2500); }
  const t = await page.evaluate(() => document.body.innerText);
  const dlg = await page.evaluate(() => { const d = document.querySelector('[role=dialog]'); return d ? d.innerText : null; });
  console.log((dlg || t).replace(/\n{2,}/g, '\n').slice(0, 2500));
  const radios = await page.evaluate(() => [...document.querySelectorAll('input[type=radio]')].filter(r => r.offsetParent).map(r => r.name + '=' + r.value + (r.checked ? '*' : '')));
  console.log('RADIOS', [...new Set(radios)].join(' '));
  await browser.close();
})();
