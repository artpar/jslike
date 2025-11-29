#!/usr/bin/env node

/**
 * Post-build script: Copy src files to dist/esm for CLI tools
 * This runs AFTER tsup to avoid being cleaned
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const distEsmPath = path.join(projectRoot, 'dist/esm');

console.log('\n📦 Creating distribution...');

// Helper to copy directory recursively
function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy all src files to dist/esm
const srcPath = path.join(projectRoot, 'src');
copyDirRecursive(srcPath, distEsmPath);

// Make CLI files executable
const distCliPath = path.join(distEsmPath, 'cli');
const cliFiles = ['wang-run.js', 'wang-validate.js'];
for (const file of cliFiles) {
  const filePath = path.join(distCliPath, file);
  if (fs.existsSync(filePath)) {
    fs.chmodSync(filePath, 0o755);
    console.log(`   ✅ Made ${file} executable`);
  }
}

console.log('✅ Distribution ready!');
