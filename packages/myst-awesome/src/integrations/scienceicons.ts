// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Fideus Labs LLC

/**
 * Astro integration for scienceicons with base_dir support
 */
import type { AstroIntegration } from "astro";
import fs from "fs";
import path from "path";

interface ScienceiconsOptions {
  /** Base directory for URL routing (e.g., '/book' for subdirectory deployments) */
  baseDir?: string;
  /** Target directory to copy icons to (defaults to public/) */
  targetDir?: string;
}

/**
 * Copy scienceicons to target directory
 */
function copyScienceIconsLocal(
  sourceDir: string,
  targetBaseDir?: string,
  baseDir = ""
) {
  try {
    // Resolve paths relative to this file
    const resolvedSourceDir = path.resolve(sourceDir);
    const defaultTargetDir = path.resolve(__dirname, "../public");
    const resolvedTargetBaseDir = targetBaseDir
      ? path.resolve(targetBaseDir)
      : defaultTargetDir;
    const iconTargetDir = path.join(resolvedTargetBaseDir, "scienceicons");

    // Check if source exists
    if (!fs.existsSync(resolvedSourceDir)) {
      console.warn("⚠️ Scienceicons source not found, skipping copy");
      return baseDir
        ? `${baseDir.startsWith("/") ? baseDir : "/" + baseDir}/scienceicons`
        : "/scienceicons";
    }

    // Create target directory
    if (!fs.existsSync(iconTargetDir)) {
      fs.mkdirSync(iconTargetDir, { recursive: true });
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

    // Return the base URL for the icons
    return baseDir
      ? `${baseDir.startsWith("/") ? baseDir : "/" + baseDir}/scienceicons`
      : "/scienceicons";
  } catch (error) {
    console.warn("Failed to copy scienceicons:", error);
    return baseDir
      ? `${baseDir.startsWith("/") ? baseDir : "/" + baseDir}/scienceicons`
      : "/scienceicons";
  }
}

export function scienceicons(
  options: ScienceiconsOptions = {}
): AstroIntegration {
  let iconBaseUrl = "/scienceicons";

  return {
    name: "scienceicons",
    hooks: {
      "astro:config:setup": ({ injectScript, config }) => {
        // Copy icons during build setup
        try {
          const defaultSourceDir = path.resolve(
            __dirname,
            "../../../../scienceicons/optimized/24/solid"
          );
          const targetDir =
            options.targetDir || config.publicDir?.pathname || "public";
          iconBaseUrl = copyScienceIconsLocal(
            defaultSourceDir,
            targetDir,
            options.baseDir
          );

          // Inject script to register the library
          injectScript(
            "page-ssr",
            `
            if (typeof window !== 'undefined') {
              import('@awesome.me/webawesome/dist/utilities/icon-library.js').then(({ registerIconLibrary }) => {
                registerIconLibrary('scienceicons', {
                  resolver: (name) => \`${iconBaseUrl}/\${name}.svg\`,
                  mutator: (svg) => svg.setAttribute('fill', 'currentColor')
                });
              });
            }
          `
          );
        } catch (error) {
          console.warn("Failed to setup scienceicons:", error);
        }
      },
    },
  };
}
