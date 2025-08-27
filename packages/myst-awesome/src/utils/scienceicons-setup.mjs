/**
 * Utility to setup scienceicons for docs with base_dir support
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Setup scienceicons for docs build
 * @param {string} docsPublicDir - Path to the docs public directory
 * @param {string} [baseDir] - Base directory for URL routing
 */
export function setupScienceiconsForDocs(docsPublicDir, baseDir = '') {
  try {
    // Resolve paths
    const sourceDir = path.resolve(__dirname, '../../../../scienceicons/optimized/24/solid');
    const iconTargetDir = path.join(docsPublicDir, baseDir, 'scienceicons');
    
    // Check if source exists
    if (!fs.existsSync(sourceDir)) {
      console.warn('⚠️ Scienceicons source not found at:', sourceDir);
      return null;
    }
    
    // Create target directory
    if (!fs.existsSync(iconTargetDir)) {
      fs.mkdirSync(iconTargetDir, { recursive: true });
    }
    
    // Copy files
    const files = fs.readdirSync(sourceDir);
    let copiedCount = 0;
    
    for (const file of files) {
      if (file.endsWith('.svg')) {
        const sourcePath = path.join(sourceDir, file);
        const targetPath = path.join(iconTargetDir, file);
        fs.copyFileSync(sourcePath, targetPath);
        copiedCount++;
      }
    }
    
    console.log(`✅ Copied ${copiedCount} scienceicons to docs public directory`);
    
    // Return the icon base URL
    const iconBaseUrl = baseDir ? `${baseDir.startsWith('/') ? baseDir : '/' + baseDir}/scienceicons` : '/scienceicons';
    console.log(`📍 Icon base URL: ${iconBaseUrl}`);
    
    return iconBaseUrl;
    
  } catch (error) {
    console.warn('Failed to setup scienceicons for docs:', error);
    return null;
  }
}

/**
 * Register scienceicons library with Web Awesome (client-side)
 * @param {string} [baseUrl] - Base URL for icons
 */
export function createScienceiconsRegistrationScript(baseUrl = '/scienceicons') {
  return `
import { registerIconLibrary } from '@awesome.me/webawesome/dist/utilities/icon-library.js';

// Register scienceicons library
registerIconLibrary('scienceicons', {
  resolver: (name) => \`${baseUrl}/\${name}.svg\`,
  mutator: (svg) => svg.setAttribute('fill', 'currentColor')
});
`;
}
