# store-console

Automate the **Google Play Console** and **App Store Connect** web consoles with
Playwright over the **[Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/) (CDP)**.

Console UIs are JavaScript-heavy, require a signed-in session, and frequently expose
custom components that resist plain HTTP or DOM scraping. Instead of reverse-engineering
private APIs or risking your main browser profile, `store-console` launches a real
Chrome/Chromium against a throwaway copy of your profile, attaches with Playwright, and
gives you small CLI primitives (`goto`, `click`, `fill`, `radio`, `text`, `shot`, ...)
plus two App Store Connect wizards for the fiddly multi-step dialogs.

- **No API keys.** You authenticate in the browser, exactly as a human would.
- **No credentials in the repo.** Sessions live in a temporary profile copy you delete.
- **Portable.** Configure the Chrome binary and profile location with environment
  variables; sensible defaults work on Linux and macOS.

## How it works

```
┌──────────────────┐     copy profile essentials     ┌────────────────────────┐
│ your Chrome      │ ──────────────────────────────▶ │ throwaway profile dir  │
│ profile          │   Local State, Cookies,         │ ($TMPDIR/...)          │
└──────────────────┘   Login Data, Preferences...    └──────────┬─────────────┘
                                                                 │ --remote-debugging-port=9222
                                                                 ▼
                                                     ┌────────────────────────┐
                                                     │ Chrome / Chromium      │
                                                     │ (real, headed)         │
                                                     └──────────┬─────────────┘
                                                                 │ CDP over HTTP/WebSocket
                                                                 ▼
                                                     ┌────────────────────────┐
                                                     │ Playwright (Node)      │
                                                     │ scripts/pw.js + helpers│
                                                     └────────────────────────┘
```

Chrome **136+ refuses `--remote-debugging-port` on the default profile**, which is why a
copy is required. The copy keeps only the files needed to restore sessions
(`Local State`, `Cookies`, `Login Data`, `Preferences`, `Secure Preferences`, `Web Data`).
Everything then runs against the copy, and `stop.sh` deletes it.

## Requirements

- Node.js **>= 18**
- Chrome or Chromium installed (auto-detected, or set `STORE_CONSOLE_CHROME_BIN`)
- Linux or macOS (the launcher uses `pkill`/`nohup`/`curl`; Windows users can run the
  Node scripts directly against any Chrome started with `--remote-debugging-port`)

## Install

```bash
git clone https://github.com/rudysanchez-mfb/store-console.git
cd store-console
npm install
```

`playwright-core` is the only dependency. It does **not** download browsers; it attaches
to the Chrome you already have. That is intentional.

## Quick start

```bash
# 1. Launch a debuggable Chrome with a copy of your profile (CDP on :9222)
./scripts/launch.sh

# 2. See what is open
node scripts/pw.js pages

# 3. Navigate and look
node scripts/pw.js goto https://play.google.com/console/
node scripts/pw.js text "Dashboard" 4000

# 4. Drive a form
node scripts/pw.js click 'text=App content'
node scripts/pw.js radio 'hasNewsApp' 'true'
node scripts/pw.js fill 'textarea[name=description]' 'Your listing copy'
node scripts/pw.js shot

# 5. Tear down (closes Chrome and deletes the profile copy)
./scripts/stop.sh
```

Screenshots go to `$SHOT` (default `./shot.png`). Run commands from a scratch directory
so screenshots do not land in the repo.

## Session / profile workflow

The profile copy is the "session jar": it is a disposable snapshot of the parts of your
browser profile that carry cookies and logins.

1. `launch.sh` copies those files from your real profile into
   `$TMPDIR/store-console-chrome` (override with `STORE_CONSOLE_PROFILE_DIR`).
2. Chrome starts with `--user-data-dir=<copy>` and `--remote-debugging-port=<port>`.
3. **Google / Play Console** sessions generally restore automatically from the copied
   cookies.
4. **Apple / App Store Connect** sessions usually do **not** restore. Open
   `https://appstoreconnect.apple.com/apps` in the launched window, sign in, and complete
   2FA. The session then lives in the copy for the rest of the run.
5. `stop.sh` kills that Chrome instance and removes the copy, including all session
   cookies. Never commit the copy; `node_modules/` and profile copies are git-ignored.

If port `9222` is taken, pass a different port or set `STORE_CONSOLE_CDP_PORT`:

```bash
STORE_CONSOLE_CDP_PORT=9333 ./scripts/launch.sh
STORE_CONSOLE_CDP_PORT=9333 node scripts/pw.js pages
```

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `STORE_CONSOLE_CHROME_BIN` | auto-detect (`google-chrome`, `chromium`, macOS app path) | Chrome/Chromium executable |
| `STORE_CONSOLE_PROFILE_DIR` | `$TMPDIR/store-console-chrome` | Throwaway profile copy directory |
| `STORE_CONSOLE_SOURCE_PROFILE` | `~/.config/google-chrome` (Linux) / `~/Library/Application Support/Google/Chrome` (macOS) | Profile to copy |
| `STORE_CONSOLE_CDP_PORT` | `9222` | CDP remote-debugging port |
| `STORE_CONSOLE_CDP_HOST` | `127.0.0.1` | CDP host for the Node scripts |
| `SHOT` | `./shot.png` | Screenshot output path |

`CDP_PORT` / `CDP_HOST` are also accepted as short aliases.

## CLI reference (`scripts/pw.js`)

`node scripts/pw.js [--page <urlSubstring>] <cmd> [args...]`

| Command | Description |
|---|---|
| `goto <url>` | Navigate, wait 3s, screenshot |
| `shot` | Screenshot to `$SHOT` |
| `text [startMarker] [n]` | Page `innerText`, optionally from a marker, `n` chars |
| `click <selector> [waitMs]` | Click first Playwright match |
| `clicktext <exact text> [waitMs]` | DOM click on an element whose trimmed text matches; good for custom widgets |
| `fill <selector> <value...>` | Fill an input/textarea |
| `check <selector>` | Force-check a radio/checkbox |
| `radio <name> <value>` | Force-check `input[type=radio][name][value]` |
| `xy <x> <y> [waitMs]` | Click CSS-pixel coordinates |
| `select <selector> <value>` | Select an option |
| `eval <js>` | Evaluate JS in the page and print JSON |
| `radios`, `checks`, `inputs` | List visible controls as `name=value` (`*` = checked) |
| `pages` | List open page URLs |

Use `--page appstoreconnect` or `--page play.google` to target a tab by URL substring.
Read the page before clicking (`text`, `radios`, `inputs`) and take a `shot` after
submit-like actions.

## App Store Connect wizards

`scripts/asc_wizard.js` steps radio-based dialogs (age rating, content rights):

```bash
# name=value pairs, then the button to press (Next|Save|Done|- where - means don't)
node scripts/asc_wizard.js "violenceCartoonOrFantasy=NONE,horrorOrFearThemes=NONE" Next
```

It prints the dialog/page text and the remaining visible `RADIOS` so you can discover the
next step's field names.

`scripts/asc_priv_type.js` completes a single App Privacy data type end to end:

```bash
node scripts/asc_priv_type.js "Set Up Email Address" APP_FUNCTIONALITY,PRODUCT_PERSONALIZATION true false
```

## Reference guides

- [`reference/play.md`](reference/play.md) — Play Console navigation, declarations,
  testing tracks, releases, publishing overview, gotchas.
- [`reference/asc.md`](reference/asc.md) — App Store Connect version page, app
  information, age rating, App Privacy, pricing, gotchas.
- [`SKILL.md`](SKILL.md) — the same workflow packaged as a Claude skill, if you use
  skill-based agent harnesses.

## Safety and stop points

- **Never** press the final submit in App Store Connect ("Add for Review" / "Submit for
  Review") or a Play production rollout unless you explicitly intend to submit.
  Sending a test track or content declaration for review is fine when you are asked to
  "finish setup".
- Treat the profile copy as a secret. `stop.sh` deletes it; do not back it up or commit
  it. `Cookies` and `Login Data` are git-ignored on purpose.
- This tool automates consoles you are authorized to use. Read and respect Google's and
  Apple's terms, and only automate accounts and apps you own or administer.

## Repository layout

```
store-console/
├── LICENSE              Apache-2.0
├── NOTICE               copyright + trademark notice
├── README.md
├── SKILL.md             agent-skill packaging of this workflow
├── package.json
├── package-lock.json
├── scripts/
│   ├── launch.sh        copy profile + start Chrome with CDP
│   ├── stop.sh          kill Chrome + delete profile copy
│   ├── pw.js            CDP driver primitives
│   ├── asc_wizard.js    App Store Connect radio wizard stepper
│   └── asc_priv_type.js App Store Connect App Privacy data type flow
└── reference/
    ├── play.md          Play Console notes
    └── asc.md           App Store Connect notes
```

## Validation

```bash
# Syntax-check every JS file
for f in scripts/*.js; do node --check "$f"; done

# Syntax-check every shell script
for f in scripts/*.sh; do bash -n "$f"; done
```

## License

Apache License 2.0. See [LICENSE](LICENSE). Copyright 2026 Rudy Sanchez.

This project is not affiliated with, endorsed by, or sponsored by Google LLC or Apple Inc.
