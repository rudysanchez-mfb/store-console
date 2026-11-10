#!/usr/bin/env bash
# Close the debuggable Chrome and delete the profile copy (it holds session cookies).
#
# Usage: ./scripts/stop.sh [profile-copy-dir]
# Environment: STORE_CONSOLE_PROFILE_DIR (default $TMPDIR/store-console-chrome)
set -euo pipefail
P="${1:-${STORE_CONSOLE_PROFILE_DIR:-${TMPDIR:-/tmp}/store-console-chrome}}"
pkill -f "user-data-dir=$P" 2>/dev/null || true
sleep 1
rm -rf -- "$P"
echo "stopped; removed $P"
