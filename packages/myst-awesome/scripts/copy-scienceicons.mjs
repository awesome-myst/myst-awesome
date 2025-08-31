#!/usr/bin/env node
/**
 * Copy scienceicons to public directory
 *
 * This script copies the scienceicons SVG files from node_modules
 * to the public directory so they can be served by the web server.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Copy scienceicons to target directory with base_dir support
 *
 * @param {string} sourceDir - Source directory containing SVG files
 * @param {string} [targetBaseDir] - Base directory where to copy icons (defaults to package public dir)
 * @param {string} [baseDir] - Base directory path for URL routing (used for subdirectory deployments)
 */
function copyScienceIcons(sourceDir, targetBaseDir, baseDir = "") {
  try {
    // Paths
    const resolvedSourceDir = path.resolve(sourceDir);
    const defaultTargetDir = path.resolve(__dirname, "../public");
    const resolvedTargetBaseDir = targetBaseDir
      ? path.resolve(targetBaseDir)
      : defaultTargetDir;
    const iconTargetDir = path.join(resolvedTargetBaseDir, "scienceicons");

    // Check if source exists
    if (!fs.existsSync(resolvedSourceDir)) {
      console.error("❌ Source directory not found:", resolvedSourceDir);
      console.error(
        "   Make sure scienceicons is installed: npm install scienceicons"
      );
      process.exit(1);
    }

    // Create target directory
    if (!fs.existsSync(iconTargetDir)) {
      fs.mkdirSync(iconTargetDir, { recursive: true });
      console.log("📁 Created directory:", iconTargetDir);
    }

    // Copy files
    const files = fs.readdirSync(resolvedSourceDir);
    let copiedCount = 0;

    for (const file of files) {
      if (file.endsWith(".svg")) {
        const sourcePath = path.join(resolvedSourceDir, file);
        const targetPath = path.join(iconTargetDir, file);

        fs.copyFileSync(sourcePath, targetPath);
        copiedCount++;
      }
    }

    console.log(`✅ Copied ${copiedCount} scienceicons to ${iconTargetDir}`);

    // Return the base URL for the icons (including base_dir if provided)
    const iconBaseUrl = baseDir
      ? `${baseDir.startsWith("/") ? baseDir : "/" + baseDir}/scienceicons`
      : "/scienceicons";

    console.log("🎉 Scienceicons are now ready to use with Web Awesome!");
    console.log(`🌐 Icon base URL: ${iconBaseUrl}`);
    console.log("");
    console.log("Usage:");
    console.log('  <wa-icon library="scienceicons" name="github"></wa-icon>');
    console.log('  <wa-icon library="scienceicons" name="jupyter"></wa-icon>');
    console.log('  <wa-icon library="scienceicons" name="orcid"></wa-icon>');

    return iconBaseUrl;
  } catch (error) {
    console.error("❌ Error copying scienceicons:", error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const defaultSourceDir = path.resolve(
    __dirname,
    "../../../node_modules/scienceicons/24/solid"
  );
  copyScienceIcons(defaultSourceDir);
}

export { copyScienceIcons };
