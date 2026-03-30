import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { loadConfig } from './config.js';

const VAULT_INDEX_FILE = '.state/vault-index.json';

export function getVaultPath(config) {
  const archivePath = config.archiveFile;
  if (!archivePath) return null;
  const vaultPath = path.dirname(archivePath);
  const pathParts = vaultPath.split(path.sep);
  const xClippingsIndex = pathParts.lastIndexOf('X-Clippings');
  if (xClippingsIndex > 0) {
    return pathParts.slice(0, xClippingsIndex).join(path.sep);
  }
  return path.dirname(vaultPath);
}

export function findObsidianCLI() {
  const paths = [
    '/Applications/Obsidian.app/Contents/MacOS/obsidian',
    '/usr/local/bin/obsidian',
    '/usr/bin/obsidian',
    path.join(process.env.HOME || '', 'Applications/Obsidian.app/Contents/MacOS/obsidian')
  ];
  
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  
  try {
    const whichPath = execSync('which obsidian', { encoding: 'utf8' }).trim();
    if (whichPath && fs.existsSync(whichPath)) return whichPath;
  } catch (e) {}
  
  return null;
}

export async function runObsidianCommand(obsidianPath, args = []) {
  try {
    const cmd = [obsidianPath, ...args].join(' ');
    const output = execSync(cmd, {
      encoding: 'utf8',
      timeout: 30000,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return { success: true, output };
  } catch (e) {
    return { success: false, error: e.message, stderr: e.stderr || '' };
  }
}

export async function getObsidianTags(obsidianPath) {
  const result = await runObsidianCommand(obsidianPath, ['tags']);
  
  if (!result.success) {
    return { success: false, error: result.error };
  }
  
  const tags = result.output.split('\n')
    .filter(line => line.trim().startsWith('#'))
    .map(line => line.trim().replace(/^#/, ''));
  
  return { success: true, tags };
}

export async function searchObsidian(obsidianPath, query, limit = 20) {
  const result = await runObsidianCommand(obsidianPath, [
    'search',
    `query="${query}"`,
    `limit=${limit}`,
    'format=json'
  ]);
  
  if (!result.success) {
    return { success: false, error: result.error };
  }
  
  try {
    const results = JSON.parse(result.output);
    return { success: true, results };
  } catch (e) {
    return { success: false, error: 'Failed to parse search results' };
  }
}

export async function getObsidianBacklinks(obsidianPath, filePath) {
  const result = await runObsidianCommand(obsidianPath, [
    'backlinks',
    `file=${filePath}`,
    'format=json'
  ]);
  
  if (!result.success) {
    return { success: false, error: result.error };
  }
  
  try {
    const backlinks = JSON.parse(result.output);
    return { success: true, backlinks };
  } catch (e) {
    return { success: false, error: 'Failed to parse backlinks' };
  }
}

export async function searchObsidianNotes(obsidianPath, query, limit = 10) {
  const result = await runObsidianCommand(obsidianPath, [
    'search',
    `query="${query}"`,
    `limit=${limit}`,
    'format=json'
  ]);
  
  if (!result.success) {
    return { success: false, error: result.error };
  }
  
  try {
    const lines = result.output.trim().split('\n').filter(l => l.trim());
    const results = lines.map(line => {
      try {
        return JSON.parse(line);
      } catch (e) {
        return null;
      }
    }).filter(r => r !== null);
    
    return { success: true, results };
  } catch (e) {
    return { success: false, error: 'Failed to parse search results' };
  }
}

export async function addBacklink(obsidianPath, targetFile, sourceContent) {
  const backlinkEntry = `\n- [[${targetFile}]]\n`;
  
  const result = await runObsidianCommand(obsidianPath, [
    'append',
    `file=${targetFile}`,
    `content=${backlinkEntry}`
  ]);
  
  return result;
}

export async function refreshVaultIndex(options = {}) {
  const config = loadConfig(options.configPath);
  const vaultPath = getVaultPath(config);
  
  if (!vaultPath) {
    throw new Error('Could not determine vault path from config');
  }
  
  if (!fs.existsSync(vaultPath)) {
    throw new Error(`Vault path does not exist: ${vaultPath}`);
  }
  
  const obsidianPath = findObsidianCLI();
  
  if (!obsidianPath) {
    throw new Error('Obsidian CLI not found. Please enable CLI in Obsidian Settings → General → Command line interface');
  }
  
  const tagsResult = await getObsidianTags(obsidianPath);
  
  const index = {
    generatedAt: new Date().toISOString(),
    vaultPath,
    cliPath: obsidianPath,
    tags: tagsResult.success ? tagsResult.tags : [],
    noteCount: 0
  };
  
  const indexPath = path.join(path.dirname(config.stateFile), 'vault-index.json');
  const dir = path.dirname(indexPath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  
  if (tagsResult.success) {
    console.log(`Vault indexed via Obsidian CLI: ${index.tags.length} tags`);
  } else {
    console.log(`Vault CLI found but tags failed: ${tagsResult.error}`);
  }
  
  return index;
}

export function loadVaultIndex(config) {
  const indexPath = path.join(path.dirname(config.stateFile), 'vault-index.json');
  
  try {
    if (fs.existsSync(indexPath)) {
      return JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    }
  } catch (e) {}
  
  return null;
}

export function getVaultContext(config) {
  const vaultPath = getVaultPath(config);
  const obsidianPath = findObsidianCLI();
  
  return {
    vaultPath,
    cliAvailable: !!obsidianPath,
    cliPath: obsidianPath
  };
}

if (process.argv[1] && process.argv[1].endsWith('vault-scanner.js')) {
  refreshVaultIndex().then(index => {
    console.log('Vault indexed successfully!');
    process.exit(0);
  }).catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}
