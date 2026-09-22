// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Fideus Labs LLC

/**
 * The scienceicons the theme registers with Web Awesome.
 *
 * Kept apart from `wa-scienceicons.ts` so that build-time code — an Astro
 * component frontmatter, a copy script, a check — can read the list without
 * pulling Web Awesome into a server bundle. It is the single source of truth
 * for the set: anything that enumerates the icons imports it rather than
 * repeating the names, because a second copy drifts silently the next time the
 * upstream package adds an icon.
 *
 * Keep it in step with the `24/solid` directory of the installed
 * `scienceicons` package; `pnpm run check-scienceicons` fails when it drifts.
 */
export const SCIENCEICONS = [
  'arxiv',
  'binder',
  'bluesky',
  'cc-by',
  'cc-nc',
  'cc-nd',
  'cc-sa',
  'cc-zero',
  'cc',
  'curvenote',
  'discord',
  'discourse',
  'email',
  'github',
  'jupyter-book',
  'jupyter-text',
  'jupyter',
  'linkedin',
  'mastodon',
  'myst',
  'open-access',
  'orcid',
  'osi',
  'ror',
  'semble',
  'slack',
  'twitter',
  'website',
  'x',
  'youtube',
] as const;

/**
 * Type for available scienceicon names
 */
export type ScienceIconName = typeof SCIENCEICONS[number];

/**
 * Check if an icon name is a valid scienceicon
 */
export function isScienceIcon(name: string): name is ScienceIconName {
  return SCIENCEICONS.includes(name as ScienceIconName);
}
