import { createProjectFrontmatterLoader } from "../dist/loaders.js";

// Test the YAML loader
async function testYamlLoader() {
  console.log("Testing YAML loader...");
  console.log("Current working directory:", process.cwd());

  // Test with explicit path
  const loader = createProjectFrontmatterLoader({
    configPath: "../../docs/myst.yml",
  });

  try {
    const result = await loader();
    console.log("YAML loader result:", JSON.stringify(result[0], null, 2));
  } catch (error) {
    console.error("Error testing YAML loader:", error);
  }
}

testYamlLoader();
