// Drive a Chrome instance over the DevTools Protocol (CDP).
// Usage: node pw.js [--page <urlSubstring>] <cmd> [args]
//   goto <url>                 navigate, wait 3s, screenshot
//   shot                       screenshot -> $SHOT (default ./shot.png)
//   text [startMarker] [n]     page innerText (optionally from a marker, n chars)
//   click <selector> [waitMs]  click first match (playwright selector)
//   clicktext <text> [waitMs]  click visible element with exact text (DOM, works on custom widgets)
//   fill <selector> <value...> fill input/textarea
//   check <selector>           check radio/checkbox (force)
//   radio <name> <value>       check input[type=radio][name][value]
//   xy <x> <y> [waitMs]        click CSS-pixel coordinates (screenshot px -> divide by devicePixelRatio)
//   select <selector> <value>  select option
//   eval <js>                  evaluate in page, print JSON
//   radios | checks | inputs   list visible form controls (name=value[*checked])
//   pages                      list open pages
//
// Environment:
//   STORE_CONSOLE_CDP_HOST  CDP host (default 127.0.0.1; CDP_HOST also accepted)
//   STORE_CONSOLE_CDP_PORT  CDP port (default 9222; CDP_PORT also accepted)
//   SHOT                    screenshot output path (default ./shot.png)
const { chromium } = require('playwright-core');
const HOST = process.env.STORE_CONSOLE_CDP_HOST || process.env.CDP_HOST || '127.0.0.1';
const PORT = process.env.STORE_CONSOLE_CDP_PORT || process.env.CDP_PORT || 9222;
const OUT = process.env.SHOT || process.cwd() + '/shot.png';
(async () => {
  const argv = process.argv.slice(2);
  let want = null;
  if (argv[0] === '--page') { want = argv[1]; argv.splice(0, 2); }
  const [cmd, ...args] = argv;
  const browser = await chromium.connectOverCDP(`http://${HOST}:${PORT}`);
  const ctx = browser.contexts()[0];
  const pages = ctx.pages().filter(p => !p.url().startsWith('devtools'));
  let page = (want ? pages.find(p => p.url().includes(want)) : pages[0]) || await ctx.newPage();
  const wait = (i, d) => page.waitForTimeout(args[i] ? parseInt(args[i]) : d);
  const shot = async () => { await page.screenshot({ path: OUT }); console.log('shot', OUT, 'url', page.url()); };
  const list = (sel) => page.evaluate((sel) => [...new Set([...document.querySelectorAll(sel)]
    .filter(e => e.offsetParent).map(e => `${e.name || e.id}=${e.value}${e.checked ? '*' : ''}`))].join('\n'), sel);
  try {
    switch (cmd) {
      case 'goto': await page.goto(args[0], { waitUntil: 'domcontentloaded', timeout: 60000 }); await page.waitForTimeout(3000); await shot(); break;
      case 'shot': await shot(); break;
      case 'text': {
        let t = await page.evaluate(() => document.body.innerText);
        if (args[0]) { const i = t.indexOf(args[0]); if (i >= 0) t = t.slice(i); }
        console.log(t.replace(/\n{2,}/g, '\n').slice(0, args[1] ? parseInt(args[1]) : 6000)); break;
      }
      case 'click': await page.locator(args[0]).first().click({ timeout: 15000 }); await wait(1, 2000); await shot(); break;
      case 'clicktext': {
        const ok = await page.evaluate((t) => {
          const el = [...document.querySelectorAll('button,a,span,div,label,li,[role]')]
            .filter(e => e.offsetParent && e.innerText && e.innerText.trim() === t).sort((a, b) => a.innerText.length - b.innerText.length)[0];
          if (!el) return false; el.click(); return true;
        }, args[0]);
        console.log(ok ? 'clicked' : 'NOT FOUND', args[0]); await wait(1, 2000); await shot(); break;
      }
      case 'fill': await page.locator(args[0]).first().fill(args.slice(1).join(' '), { timeout: 15000 }); await page.waitForTimeout(500); await shot(); break;
      case 'check': await page.locator(args[0]).first().check({ force: true, timeout: 15000 }); await shot(); break;
      case 'radio': await page.locator(`input[type=radio][name="${args[0]}"][value="${args[1]}"]`).first().check({ force: true, timeout: 15000 }); await shot(); break;
      case 'xy': await page.mouse.click(parseFloat(args[0]), parseFloat(args[1])); await wait(2, 2000); await shot(); break;
      case 'select': await page.locator(args[0]).first().selectOption(args[1]); await shot(); break;
      case 'eval': console.log(JSON.stringify(await page.evaluate(args.join(' ')), null, 1)); break;
      case 'radios': console.log(await list('input[type=radio]')); break;
      case 'checks': console.log(await list('input[type=checkbox]')); break;
      case 'inputs': console.log(await list('input,textarea,select')); break;
      case 'pages': pages.forEach(p => console.log(p.url())); break;
      default: console.log('unknown command', cmd);
    }
  } catch (e) { console.error('ERR', e.message.split('\n')[0]); await shot().catch(() => {}); process.exitCode = 1; }
  await browser.close();
})();
