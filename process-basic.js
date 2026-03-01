#!/usr/bin/env node
/**
 * Basic Bookmark Processor - Saves bookmarks to Obsidian without Claude
 * Use this when Claude spending cap is reached
 */

import fs from 'fs';
import path from 'path';
import { loadConfig } from './src/config.js';

const config = loadConfig();
const pendingFile = config.pendingFile || './.state/pending-bookmarks.json';
const archiveFile = config.archiveFile || './bookmarks.md';

if (!fs.existsSync(pendingFile)) {
  console.log('No pending bookmarks. Run: npx smaug fetch 10');
  process.exit(0);
}

const pending = JSON.parse(fs.readFileSync(pendingFile, 'utf8'));
if (pending.bookmarks.length === 0) {
  console.log('No pending bookmarks to process.');
  process.exit(0);
}

console.log(`Processing ${pending.bookmarks.length} bookmarks (basic mode - no Claude)...\n`);

// Group by date
const byDate = {};
for (const b of pending.bookmarks) {
  const date = b.date || 'Unknown Date';
  if (!byDate[date]) byDate[date] = [];
  byDate[date].push(b);
}

// Build markdown
let md = '';
for (const [date, bookmarks] of Object.entries(byDate)) {
  md += `# ${date}\n\n`;
  
  for (const b of bookmarks) {
    md += `## @${b.author} - ${b.authorName}\n`;
    md += `> ${b.text.split('\n').join('\n> ')}\n\n`;
    md += `- **Tweet:** ${b.tweetUrl}\n`;
    
    for (const link of b.links || []) {
      if (link.expanded && !link.expanded.includes('x.com')) {
        md += `- **Link:** ${link.expanded}\n`;
      }
    }
    
    if (b.isReply && b.replyContext) {
      md += `- **Reply to:** @${b.replyContext.author}\n`;
    }
    
    md += '\n---\n\n';
  }
}

// Append to existing or create new
let existing = '';
if (fs.existsSync(archiveFile)) {
  existing = fs.readFileSync(archiveFile, 'utf8');
}

// Prepend new content
fs.writeFileSync(archiveFile, md + existing);
console.log(`✅ Saved ${pending.bookmarks.length} bookmarks to ${archiveFile}`);

// Clear pending
fs.writeFileSync(pendingFile, JSON.stringify({ bookmarks: [], count: 0 }, null, 2));
console.log('✅ Cleared pending queue');
