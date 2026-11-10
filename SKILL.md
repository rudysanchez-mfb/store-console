---
name: store-console
description: Drive Google Play Console and App Store Connect in a real Chrome (Playwright over CDP on a copied profile) to fill store listings, declarations, age ratings, privacy, pricing, testing tracks and submissions. Use when asked to finish, fill out, update or check anything in Play Console or App Store Connect, or to automate a logged-in web console on this machine.
---

# Store console automation

Finish Play Console and App Store Connect forms by driving a real Chrome over the
DevTools Protocol (CDP). Resolve `$SKILL_DIR` to the directory this file was loaded
from, or set it to the root of this repository. Install dependencies with
`cd "$SKILL_DIR" && npm install` (`playwright-core` is the only dependency).

Do NOT use X11 desktop-control MCP servers or browser extensions for this: on Linux
Chrome is often a native Wayland client, and X11 automation cannot see or click it.

## 1. Launch

```bash
"$SKILL_DIR/scripts/launch.sh"          # copies profile essentials, starts Chrome on :9222
```

The launcher copies profile essentials (`Local State` and
`Default/{Cookies,Login Data,Preferences,Secure Preferences,Web Data}`) from the
source Chrome profile into the profile copy. Chrome 136+ refuses
`--remote-debugging-port` on the default profile, so a copy is required.

- Google (Play Console) sessions usually carry over from the copy. Apple does not:
  open `https://appstoreconnect.apple.com/apps`, sign in with the account that owns
  the app and complete 2FA in the Chrome window that opened, then wait for
  confirmation before continuing.
- Configuration (all optional):
  - `STORE_CONSOLE_CHROME_BIN` — Chrome/Chromium executable (auto-detected by default)
  - `STORE_CONSOLE_PROFILE_DIR` — profile copy directory (default `$TMPDIR/store-console-chrome`)
  - `STORE_CONSOLE_SOURCE_PROFILE` — Chrome profile to copy (default per OS)
  - `STORE_CONSOLE_CDP_PORT` — remote debugging port (default `9222`)
  - `SHOT` — screenshot path (default `./shot.png` in the current directory)
- Keep the profile copy out of version control: it holds live session cookies.

## 2. Drive

All commands: `node $SKILL_DIR/scripts/pw.js [--page <urlSubstring>] <cmd> ...`

| cmd | use |
|-----|-----|
| `goto <url>` | navigate + screenshot |
| `shot` / `text [marker] [n]` | see the page; `text` is cheaper than screenshots |
| `click <selector> [ms]` | Playwright selector (`text=`, `role=`, CSS, `>> visible=true`) |
| `clicktext <exact text>` | DOM click on custom widgets when `click` times out |
| `fill <selector> <value>` | inputs/textareas (`textarea[name=description]`) |
| `radio <name> <value>` / `check <sel>` | force-check radios/checkboxes |
| `xy <x> <y>` | coordinate click; CSS px = screenshot px / devicePixelRatio |
| `radios` / `checks` / `inputs` | list visible controls with names and values |
| `eval <js>` | anything else |

Use `--page appstoreconnect` or `--page play.google` when several tabs are open.
Read the page (`text` or `radios`) before clicking; after each submit-like click take
a `shot` and read the result. Scope dialog buttons: `[role=dialog] >> button:has-text("Save")`
or `dialog[open] >> button:has-text("Confirm")`.

Helpers for App Store Connect:
- `asc_wizard.js "name=value,..." [Next|Save|Done|-]` steps radio wizards (age rating,
  content rights) and prints the dialog text plus remaining radios.
- `asc_priv_type.js "Set Up <Type>" PURPOSE,PURPOSE [linked] [tracked]` completes one
  App Privacy data type end to end.

For longer field sets write a one-off script in a scratch directory that `require`s
`$SKILL_DIR/node_modules/playwright-core` and uses `page.locator(sel).fill(val)`.

## 3. Content

Listing copy, declaration answers, URLs, reviewer account details and current
submission state belong in your own project — for example a store-listing notes file.
Keep reviewer credentials in an untracked file or a secret manager; never commit them
to this repository. Reuse answers you have already approved; do not invent new ones.
When you change anything in a console, update your own store-listing notes.

Console-specific selectors and gotchas: `reference/play.md`, `reference/asc.md`.

## 4. Stop points and cleanup

- Never press the final submit in App Store Connect ("Add for Review" / "Submit for
  Review") or Play's production rollout unless the user explicitly asked for that step.
  Sending test tracks and content declarations for review is fine when asked to
  "finish setup".
- When done: `$SKILL_DIR/scripts/stop.sh` closes Chrome and deletes the profile copy
  (it contains live session cookies).
