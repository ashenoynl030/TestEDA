#!/usr/bin/env node

/**
 * Generate a JSON index of all PM Skills for the dashboard
 * Run: node scripts/generate-skills-index.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillsDir = path.join(__dirname, '../skills');
const outputPath = path.join(__dirname, '../public/skills-index.json');

function parseYAMLFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const yaml = match[1];
  const obj = {};
  const lines = yaml.split('\n');

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }

    // Parse key: value or key: > or key: |
    const keyMatch = line.match(/^(\w+):\s*(.*)/);
    if (!keyMatch) {
      i++;
      continue;
    }

    const key = keyMatch[1];
    const valueStart = keyMatch[2];

    // Handle multiline values with >, |, >-, >+, |- etc
    if (valueStart.match(/^[>|][-+]?$/)) {
      i++;
      let multilineValue = '';
      while (i < lines.length && lines[i].startsWith('  ')) {
        multilineValue += lines[i].slice(2).trim() + ' ';
        i++;
      }
      obj[key] = multilineValue.trim();
      continue;
    }

    // Handle arrays (2 or 3 space indentation)
    if (!valueStart.trim() && i + 1 < lines.length && /^\s+- /.test(lines[i + 1])) {
      const arr = [];
      i++;
      while (i < lines.length && /^\s+- /.test(lines[i])) {
        const item = lines[i].replace(/^\s+- /, '').trim().replace(/^["']|["']$/g, '');
        arr.push(item);
        i++;
      }
      obj[key] = arr;
      continue;
    }

    // Handle regular values
    obj[key] = valueStart.replace(/^["']|["']$/g, '');
    i++;
  }

  return obj;
}

function generateIndex() {
  const skills = [];

  const skillDirs = fs.readdirSync(skillsDir);

  for (const dir of skillDirs) {
    const skillPath = path.join(skillsDir, dir);
    const stat = fs.statSync(skillPath);

    if (!stat.isDirectory()) continue;

    const skillFile = path.join(skillPath, 'SKILL.md');
    if (!fs.existsSync(skillFile)) continue;

    const content = fs.readFileSync(skillFile, 'utf-8');
    const metadata = parseYAMLFrontmatter(content);

    // Extract first section (Purpose) as preview
    const purposeMatch = content.match(/## Purpose\n+([\s\S]*?)(?=\n## |\n---|\Z)/);
    const preview = purposeMatch
      ? purposeMatch[1].trim().split('\n')[0].substring(0, 150)
      : '';

    skills.push({
      id: dir,
      name: metadata.name || dir,
      type: metadata.type || 'unknown',
      description: metadata.description || '',
      intent: metadata.intent || '',
      theme: metadata.theme || '',
      best_for: metadata.best_for || [],
      scenarios: metadata.scenarios || [],
      estimated_time: metadata.estimated_time || '',
      preview: preview,
      path: `/skills/${dir}/SKILL.md`,
    });
  }

  // Sort by name
  skills.sort((a, b) => a.name.localeCompare(b.name));

  // Ensure output directory exists
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  fs.writeFileSync(outputPath, JSON.stringify({ skills }, null, 2));
  console.log(`✓ Generated skills index: ${skills.length} skills`);
}

generateIndex();
