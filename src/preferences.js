import fs from 'fs';
import path from 'path';
import { loadConfig } from './config.js';

const PREFERENCES_FILE = '.state/user-preferences.json';

export function loadPreferences(config) {
  const prefsPath = path.join(path.dirname(config.stateFile), PREFERENCES_FILE);
  
  try {
    if (fs.existsSync(prefsPath)) {
      return JSON.parse(fs.readFileSync(prefsPath, 'utf8'));
    }
  } catch (e) {}
  
  return {
    version: 1,
    learnedRules: [],
    categoryPreferences: {},
    folderMappings: {},
    lastUpdated: null
  };
}

export function savePreferences(prefs, config) {
  const prefsPath = path.join(path.dirname(config.stateFile), PREFERENCES_FILE);
  const dir = path.dirname(prefsPath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  prefs.lastUpdated = new Date().toISOString();
  fs.writeFileSync(prefsPath, JSON.stringify(prefs, null, 2));
}

export function addLearnedRule(prefs, rule) {
  const existingIndex = prefs.learnedRules.findIndex(r => 
    r.condition === rule.condition
  );
  
  if (existingIndex >= 0) {
    prefs.learnedRules[existingIndex] = { 
      ...rule, 
      count: prefs.learnedRules[existingIndex].count + 1,
      lastMatched: new Date().toISOString()
    };
  } else {
    prefs.learnedRules.push({
      ...rule,
      count: 1,
      createdAt: new Date().toISOString(),
      lastMatched: new Date().toISOString()
    });
  }
  
  return prefs;
}

export function applyLearnedRules(prefs, bookmark) {
  const matchedRules = [];
  
  for (const rule of prefs.learnedRules) {
    let matches = false;
    
    if (rule.conditionType === 'contains') {
      const text = `${bookmark.text} ${bookmark.links?.map(l => l.expanded).join(' ')}`.toLowerCase();
      matches = text.includes(rule.condition.toLowerCase());
    } else if (rule.conditionType === 'author') {
      matches = bookmark.author === rule.condition;
    } else if (rule.conditionType === 'domain') {
      const domains = bookmark.links?.map(l => new URL(l.expanded).hostname) || [];
      matches = domains.some(d => d.includes(rule.condition));
    }
    
    if (matches) {
      matchedRules.push(rule);
    }
  }
  
  return matchedRules;
}

export function getCategoryPreference(prefs, category, key) {
  return prefs.categoryPreferences[`${category}.${key}`];
}

export function setCategoryPreference(prefs, category, key, value) {
  prefs.categoryPreferences[`${category}.${key}`] = value;
}

export function getFolderMapping(prefs, sourceFolder) {
  return prefs.folderMappings[sourceFolder];
}

export function setFolderMapping(prefs, sourceFolder, targetFolder) {
  prefs.folderMappings[sourceFolder] = targetFolder;
}

export function getPreferenceSummary(prefs) {
  return {
    totalRules: prefs.learnedRules.length,
    rulesByType: prefs.learnedRules.reduce((acc, r) => {
      acc[r.action] = (acc[r.action] || 0) + 1;
      return acc;
    }, {}),
    folderMappings: Object.keys(prefs.folderMappings).length,
    categoryPreferences: Object.keys(prefs.categoryPreferences).length
  };
}
