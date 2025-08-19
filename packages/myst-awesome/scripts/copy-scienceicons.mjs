#!/usr/bin/env node
/**
 * Copy scienceicons to public directory
 * 
 * This script copies the scienceicons SVG files from node_modules
 * to the public directory so they can be served by the web server.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function copySciencionIcons() {
  try {
    // Paths
    const sourceDir = path.resolve(__dirname, '../../../scienceicons/optimized/24/solid');
    const targetDir = path.resolve(__dirname, '../public/scienceicons');
    
    // Check if source exists
    if (!fs.existsSync(sourceDir)) {
      console.error('❌ Source directory not found:', sourceDir);
      console.error('   Make sure scienceicons is installed: npm install scienceicons');
      process.exit(1);
    }
    
    // Create target directory
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
      console.log('📁 Created directory:', targetDir);
    }
    
    // Copy files
    const files = fs.readdirSync(sourceDir);
    let copiedCount = 0;
    
    for (const file of files) {
      if (file.endsWith('.svg')) {
        const sourcePath = path.join(sourceDir, file);
        const targetPath = path.join(targetDir, file);
        
        fs.copyFileSync(sourcePath, targetPath);
        copiedCount++;
      }
    }
    
    console.log(`✅ Copied ${copiedCount} scienceicons to ${targetDir}`);
    console.log('🎉 Scienceicons are now ready to use with Web Awesome!');
    console.log('');
    console.log('Usage:');
    console.log('  <wa-icon library="scienceicons" name="github"></wa-icon>');
    console.log('  <wa-icon library="scienceicons" name="jupyter"></wa-icon>');
    console.log('  <wa-icon library="scienceicons" name="orcid"></wa-icon>');
    
  } catch (error) {
    console.error('❌ Error copying scienceicons:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  copySciencionIcons();
}

export { copySciencionIcons };
