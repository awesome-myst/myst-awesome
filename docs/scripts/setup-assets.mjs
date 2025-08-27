#!/usr/bin/env node
/**
 * Pre-build script for docs to setup scienceicons with base_dir support
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupScienceiconsForDocs } from '../../packages/myst-awesome/src/utils/scienceicons-setup.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDocsAssets() {
  try {
    // Read myst.yml to get base_dir
    const mystYmlPath = path.join(path.dirname(__filename), '..', 'myst.yml');
    let baseDir = '';

    if (fs.existsSync(mystYmlPath)) {
      const mystConfig = fs.readFileSync(mystYmlPath, 'utf-8');
      const baseDirMatch = mystConfig.match(/base_dir:\s*([^\s#]+)/);
      if (baseDirMatch) {
        baseDir = baseDirMatch[1].trim();
        console.log(`📂 Found base_dir in myst.yml: ${baseDir}`);
      }
    }

    // Setup scienceicons
    const docsPublicDir = path.join(path.dirname(__filename), '..', 'public');
    const iconBaseUrl = setupScienceiconsForDocs(docsPublicDir, baseDir);

    if (iconBaseUrl) {
      console.log('🎉 Docs assets setup complete!');
    } else {
      console.log('⚠️ Scienceicons setup skipped (source not found)');
    }

  } catch (error) {
    console.error('❌ Failed to setup docs assets:', error);
    process.exit(1);
  }
}

setupDocsAssets();
