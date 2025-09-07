#!/usr/bin/env node
/**
 * Pre-build script for docs to setup scienceicons and render module with base_dir support
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupScienceiconsForDocs } from '../../packages/myst-awesome/src/utils/scienceicons-setup.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Copy the render-myst-ast module to docs public directory with base_dir support
 * @param {string} docsPublicDir - Path to the docs public directory
 * @param {string} [baseDir] - Base directory for URL routing
 */
function setupRenderModule(docsPublicDir, baseDir = '') {
  try {
    // Source: the built render module from the myst-awesome package
    const sourceModulePath = path.join(__dirname, '../../packages/myst-awesome/public/render-myst-ast.mjs');
    const sourceMapPath = path.join(__dirname, '../../packages/myst-awesome/public/render-myst-ast.mjs.map');
    
    // Target: docs public directory with baseDir support
    const targetDir = baseDir ? path.join(docsPublicDir, baseDir.replace(/^\/+/, '')) : docsPublicDir;
    const targetModulePath = path.join(targetDir, 'render-myst-ast.mjs');
    const targetMapPath = path.join(targetDir, 'render-myst-ast.mjs.map');

    // Check if source exists
    if (!fs.existsSync(sourceModulePath)) {
      console.warn('⚠️ Render module not found at:', sourceModulePath);
      console.warn('   Run "pnpm build:render-module" in the myst-awesome package first');
      return false;
    }

    // Create target directory
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Copy module and source map
    fs.copyFileSync(sourceModulePath, targetModulePath);
    console.log(`✅ Copied render module to: ${targetModulePath}`);

    if (fs.existsSync(sourceMapPath)) {
      fs.copyFileSync(sourceMapPath, targetMapPath);
      console.log(`✅ Copied render module source map to: ${targetMapPath}`);
    }

    // Return the module URL
    const moduleUrl = baseDir ? `${baseDir.startsWith('/') ? baseDir : '/' + baseDir}/render-myst-ast.mjs` : '/render-myst-ast.mjs';
    console.log(`📍 Render module URL: ${moduleUrl}`);

    return moduleUrl;

  } catch (error) {
    console.warn('❌ Failed to setup render module:', error);
    return false;
  }
}

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

    // Setup paths
    const docsPublicDir = path.join(path.dirname(__filename), '..', 'public');

    // Setup scienceicons
    const iconBaseUrl = setupScienceiconsForDocs(docsPublicDir, baseDir);

    // Setup render module
    const renderModuleUrl = setupRenderModule(docsPublicDir, baseDir);

    if (iconBaseUrl && renderModuleUrl) {
      console.log('🎉 Docs assets setup complete!');
    } else if (iconBaseUrl) {
      console.log('🎉 Docs assets setup complete (scienceicons only)!');
    } else if (renderModuleUrl) {
      console.log('🎉 Docs assets setup complete (render module only)!');
    } else {
      console.log('⚠️ Some assets may not be available');
    }

  } catch (error) {
    console.error('❌ Failed to setup docs assets:', error);
    process.exit(1);
  }
}

setupDocsAssets();
