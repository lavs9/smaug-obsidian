#!/bin/bash
# Smaug Runner - Fetch Twitter Bookmarks to Obsidian
# Run this from Obsidian using Shell Commands plugin

export PATH="/opt/homebrew/bin:$PATH"

SMAUG_DIR="/Users/mayanklavania/moonshot_projects/smaug-obsidian"

cd "$SMAUG_DIR"

case "${1:-run}" in
  fetch)
    npx smaug fetch ${2:-10}
    ;;
  run)
    npx smaug fetch 10
    # Try Claude, fall back to basic if it fails
    npx smaug run || node process-basic.js
    ;;
  basic)
    # Basic mode without Claude
    npx smaug fetch 10
    node process-basic.js
    ;;
  status)
    npx smaug status
    ;;
  *)
    echo "Usage: smaug-obsidian.sh [fetch|run|basic|status]"
    ;;
esac

