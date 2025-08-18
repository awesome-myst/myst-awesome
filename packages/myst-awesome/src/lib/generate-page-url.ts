/** Helper function to generate URL from page ID based on folders option */
export function generatePageUrl(
  pageId: string,
  foldersOption: boolean,
  baseDir: string
): string {
  foldersOption = foldersOption || false;
  baseDir = baseDir || "";

  if (pageId === "/") return "/";

  let urlPath = pageId.slice(1); // Remove leading slash

  // Handle folder structure based on folders option
  if (!foldersOption) {
    // When folders is false (default), flatten the path by using only the filename
    const pathParts = urlPath.split("/");
    urlPath = pathParts[pathParts.length - 1] || urlPath;
  } else {
    // When folders is true, encode slashes for URL compatibility
    urlPath = urlPath.replace(/\//g, "--");
  }

  return `${baseDir}/${urlPath}`;
}
