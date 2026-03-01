# Smaug Obsidian 🐉

Archive your Twitter/X bookmarks directly into your **Obsidian vault** — automatically, with full content extraction and AI-powered categorization.

*Like a dragon hoarding treasure, Smaug collects the valuable things you bookmark and organizes them straight into your second brain.*

```
  🔥  🔥  🔥  🔥  🔥  🔥  🔥  🔥  🔥  🔥  🔥  🔥
       _____ __  __   _   _   _  ____
      / ____|  \/  | / \ | | | |/ ___|
      \___ \| |\/| |/ _ \| | | | |  _
       ___) | |  | / ___ \ |_| | |_| |
      |____/|_|  |_/_/  \_\___/ \____|

   🐉 The dragon stirs... treasures to hoard!
```

## Contents

- [What's Different in This Fork](#whats-different-in-this-fork)
- [Quick Start](#quick-start)
- [Obsidian Plugin](#obsidian-plugin)
- [Shell Script Integration](#shell-script-integration)
- [What It Does](#what-it-does)
- [Configuration](#configuration)
- [Categories](#categories)
- [Running Manually](#running-manually)
- [Basic Mode (No Claude)](#basic-mode-no-claude)
- [Output](#output)
- [Troubleshooting](#troubleshooting)
- [Credits](#credits)

---

## What's Different in This Fork

This is a fork of [alexknowshtml/smaug](https://github.com/alexknowshtml/smaug), adapted to write bookmarks **directly into an Obsidian vault** rather than a local folder.

Key additions in this fork:

| Feature | Description |
|---------|-------------|
| **Obsidian Plugin** | Native Obsidian plugin (`plugin/`) — trigger Smaug from the ribbon or command palette |
| **Obsidian Vault Output** | `archiveFile` and category folders point directly into your Obsidian vault path |
| **YouTube Category** | New built-in category: YouTube videos filed to `knowledge/videos/` |
| **OpenRouter AI** | Optional OpenRouter integration for AI processing (not just Claude Code) |
| **Basic Mode** | `process-basic.js` — fallback processor that works without Claude (e.g. when spending cap is hit) |
| **Shell Script** | `smaug-obsidian.sh` — a unified runner for fetch/run/basic/status, designed to be triggered from Obsidian's Shell Commands plugin |
| **IST Timezone** | Defaults to `Asia/Kolkata` instead of `America/New_York` |

---

## Quick Start

```bash
# 1. Install bird CLI (Twitter API wrapper)
# See https://github.com/steipete/bird

# 2. Clone and install
git clone https://github.com/lavs9/smaug-obsidian.git
cd smaug-obsidian
npm install

# 3. Edit smaug.config.json with your credentials and vault path
# (see Configuration section below)

# 4. Run
./smaug-obsidian.sh run
# or
npx smaug run
```

---

## Obsidian Plugin

The `plugin/` directory contains a native Obsidian plugin that lets you trigger Smaug from inside Obsidian — no terminal required.

### Installation

1. Copy the `plugin/` folder into your vault's `.obsidian/plugins/smaug-obsidian/` directory
2. Enable the plugin in **Settings → Community Plugins**
3. Go to the plugin settings and set the **Smaug Project Directory** to the absolute path of this repo

### Usage

- Click the 🐉 **dragon icon** in the ribbon to run Smaug
- Or use **Command Palette** → `Run Smaug Bookmark Archiver`

Smaug will fetch your latest bookmarks and file them into your vault. You'll get Obsidian notices on start, success, or failure.

### Building the Plugin

```bash
cd plugin
npm install
npm run build  # outputs main.js
```

---

## Shell Script Integration

`smaug-obsidian.sh` is a convenience runner designed to work with Obsidian's [Shell Commands plugin](https://github.com/Taitava/obsidian-shellcommands).

```bash
./smaug-obsidian.sh run     # fetch 10 bookmarks + process (falls back to basic if Claude fails)
./smaug-obsidian.sh fetch   # fetch only
./smaug-obsidian.sh basic   # fetch + basic mode (no Claude)
./smaug-obsidian.sh status  # check pending count
```

Set the **Smaug Project Directory** variable at the top of the script to match your local path before using.

---

## What It Does

1. **Fetches bookmarks** from Twitter/X using the bird CLI (can also fetch likes, or both)
2. **Expands t.co links** to reveal actual URLs
3. **Extracts content** from linked pages (GitHub repos, articles, YouTube videos, quote tweets)
4. **Categorizes** each tweet by URL pattern (github, article, youtube, or plain tweet)
5. **Files to your Obsidian vault** — each category gets its own folder inside your vault
6. **Updates `bookmarks.md`** — a running log of everything processed, organized by date

---

## Configuration

Edit `smaug.config.json`:

```json
{
  "source": "bookmarks",
  "archiveFile": "/path/to/your/ObsidianVault/X-Clippings/bookmarks.md",
  "pendingFile": "./.state/pending-bookmarks.json",
  "stateFile": "./.state/bookmarks-state.json",
  "timezone": "Asia/Kolkata",
  "twitter": {
    "authToken": "your_auth_token",
    "ct0": "your_ct0"
  },
  "ai": {
    "openRouterApiKey": null,
    "textModel": "anthropic/claude-3.5-sonnet",
    "audioBaseUrl": "https://api.openai.com/v1",
    "audioApiKey": null,
    "audioModel": "whisper-1"
  },
  "autoInvokeClaude": false,
  "claudeModel": "sonnet",
  "categories": { ... }
}
```

### Getting Twitter Credentials

1. Open Twitter/X in your browser
2. Open **Developer Tools → Application → Cookies**
3. Find and copy `auth_token` and `ct0`
4. Paste them into `smaug.config.json`

### Key Options

| Option | Default | Description |
|--------|---------|-------------|
| `source` | `bookmarks` | What to fetch: `bookmarks`, `likes`, or `both` |
| `archiveFile` | `./bookmarks.md` | Path to the main archive (point this at your Obsidian vault) |
| `timezone` | `Asia/Kolkata` | For date formatting in output |
| `autoInvokeClaude` | `false` | Set `true` to auto-run Claude Code for richer analysis |
| `claudeModel` | `sonnet` | Model to use: `sonnet`, `haiku`, or `opus` |
| `ai.openRouterApiKey` | `null` | Set to use OpenRouter instead of Claude Code |

---

## Categories

Categories define how different bookmark types are handled. Folder paths should point into your Obsidian vault.

### Default Categories in This Fork

| Category | Matches | Action | Destination |
|----------|---------|--------|-------------|
| **github** | `github.com` | file | `<vault>/X-Clippings/tools/` |
| **article** | `medium.com`, `substack.com`, `dev.to`, `blog`, `article` | file | `<vault>/X-Clippings/articles/` |
| **youtube** | `youtube.com`, `youtu.be` | file | `<vault>/X-Clippings/videos/` |
| **tweet** | (fallback) | capture | `bookmarks.md` only |

### Custom Categories

Add or override in `smaug.config.json`:

```json
{
  "categories": {
    "research": {
      "match": ["arxiv.org", "papers.", "scholar.google"],
      "action": "file",
      "folder": "/path/to/vault/X-Clippings/research",
      "template": "article",
      "description": "Academic papers"
    }
  }
}
```

---

## Running Manually

```bash
# Full job (fetch + process)
npx smaug run

# Fetch only (default: 10 bookmarks)
npx smaug fetch 10

# Fetch from likes instead
npx smaug fetch --source likes

# Fetch from both bookmarks AND likes
npx smaug fetch --source both

# Process already-fetched tweets
npx smaug process

# Force re-process (ignore duplicates)
npx smaug process --force

# Check what's pending
cat .state/pending-bookmarks.json | jq '.count'
```

---

## Basic Mode (No Claude)

If Claude is unavailable (spending cap, no API key, etc.), use the basic processor:

```bash
# Via shell script
./smaug-obsidian.sh basic

# Or directly
npx smaug fetch 10
node process-basic.js
```

Basic mode writes bookmarks to your archive file without AI categorization or rich metadata — just the tweet text, links, and date. It's a reliable fallback to ensure your pipeline never fully stops.

---

## Output

### bookmarks.md (in your Obsidian vault)

```markdown
# Thursday, January 2, 2026

## @simonw - Gist Host Fork for Rendering GitHub Gists
> I forked the wonderful gistpreview.github.io to create gisthost.github.io

- **Tweet:** https://x.com/simonw/status/123456789
- **Link:** https://gisthost.github.io/
- **Filed:** [gisthost-gist-rendering.md](./knowledge/articles/gisthost-gist-rendering.md)
- **What:** Free GitHub Pages-hosted tool that renders HTML files from Gists.

---
```

### knowledge/tools/*.md (GitHub repos)

```markdown
---
title: "whisper-flow"
type: tool
date_added: 2026-01-02
source: "https://github.com/dimastatz/whisper-flow"
tags: [ai, transcription, whisper, streaming]
via: "Twitter bookmark from @tom_doerr"
---

Real-time speech-to-text transcription using OpenAI Whisper...
```

### knowledge/videos/*.md (YouTube)

```markdown
---
title: "Never Gonna Give You Up"
type: video
date_added: 2026-01-02
source: "https://youtube.com/watch?v=dQw4w9WgXcQ"
tags: [music, classic]
via: "Twitter bookmark from @rickastley"
---
```

---

## Troubleshooting

### "No new bookmarks to process"

Either no bookmarks were fetched, or all fetched bookmarks already exist in `bookmarks.md`.

```bash
# Reset and start fresh
rm -rf .state/ bookmarks.md
mkdir -p .state
npx smaug run
```

### Bird CLI 403 errors

Your Twitter cookies expired. Get fresh `auth_token` and `ct0` values from the browser.

### Claude fails or spending cap hit

Use basic mode as a fallback:

```bash
./smaug-obsidian.sh basic
```

### Plugin not showing in Obsidian

Make sure:
- The `plugin/` directory is copied to `.obsidian/plugins/smaug-obsidian/`
- You've run `npm run build` inside `plugin/` so `main.js` is present
- Community plugins are enabled in Obsidian settings

---

## Credits

- **Inspired by [alexknowshtml/smaug](https://github.com/alexknowshtml/smaug)** — the original Smaug project that this fork is built on. All the core archiving logic, Claude Code integration, and category system originate there. Big thanks for the dragon 🐉
- [bird CLI](https://github.com/steipete/bird) by Peter Steinberger — the Twitter/X API wrapper that makes bookmark fetching possible
- Built with [Claude Code](https://claude.ai/code)

## License

MIT
