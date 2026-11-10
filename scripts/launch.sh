#!/usr/bin/env bash
# Launch a debuggable Chrome/Chromium with a COPY of your browser profile.
#
# Chrome 136+ refuses --remote-debugging-port on the default profile, so this
# script copies the profile essentials into a throwaway directory and launches
# against the copy. Google sessions normally carry over; Apple sessions usually
# do not (sign in + 2FA in the launched window).
#
# Usage:
#   ./scripts/launch.sh [profile-copy-dir] [port] [start-url]
#
# Environment overrides:
#   STORE_CONSOLE_CHROME_BIN      Chrome/Chromium executable path
#   STORE_CONSOLE_PROFILE_DIR     Profile copy directory
#   STORE_CONSOLE_SOURCE_PROFILE  Source Chrome profile directory
#   STORE_CONSOLE_CDP_PORT        Remote debugging port (default 9222)
set -euo pipefail

PORT="${2:-${STORE_CONSOLE_CDP_PORT:-9222}}"
P="${1:-${STORE_CONSOLE_PROFILE_DIR:-${TMPDIR:-/tmp}/store-console-chrome}}"

case "$(uname -s)" in
  Darwin) DEFAULT_SOURCE="$HOME/Library/Application Support/Google/Chrome" ;;
  Linux)  DEFAULT_SOURCE="${XDG_CONFIG_HOME:-$HOME/.config}/google-chrome" ;;
  *)      DEFAULT_SOURCE="" ;;
esac
SRC="${STORE_CONSOLE_SOURCE_PROFILE:-$DEFAULT_SOURCE}"

chrome_bin() {
  if [ -n "${STORE_CONSOLE_CHROME_BIN:-}" ]; then printf '%s' "$STORE_CONSOLE_CHROME_BIN"; return; fi
  for c in google-chrome google-chrome-stable chromium chromium-browser chrome; do
    if command -v "$c" >/dev/null 2>&1; then command -v "$c"; return; fi
  done
  for p in \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "/Applications/Chromium.app/Contents/MacOS/Chromium"; do
    if [ -x "$p" ]; then printf '%s' "$p"; return; fi
  done
  printf '%s' ""
}

CHROME="$(chrome_bin)"
if [ -z "$CHROME" ]; then
  echo "error: Chrome/Chromium not found. Set STORE_CONSOLE_CHROME_BIN." >&2
  exit 1
fi

if curl -s "http://127.0.0.1:$PORT/json/version" >/dev/null 2>&1; then
  echo "Chrome already listening on $PORT"; exit 0
fi

mkdir -p "$P/Default/Network"
cp "$SRC/Local State" "$P/" 2>/dev/null || true
for f in Cookies "Login Data" Preferences "Secure Preferences" "Web Data" "Network/Cookies"; do
  cp "$SRC/Default/$f" "$P/Default/$f" 2>/dev/null || true
done

nohup "$CHROME" --user-data-dir="$P" --remote-debugging-port="$PORT" \
  --no-first-run --no-default-browser-check --window-size=1400,1000 \
  "${3:-about:blank}" >/dev/null 2>&1 &

for _ in $(seq 1 60); do
  if curl -s "http://127.0.0.1:$PORT/json/version" >/dev/null 2>&1; then
    echo "Chrome up on $PORT, profile $P"; exit 0
  fi
  sleep 0.5
done
echo "error: Chrome did not come up on $PORT" >&2; exit 1
