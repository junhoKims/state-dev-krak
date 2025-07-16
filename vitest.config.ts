import { defineConfig, coverageConfigDefaults } from "vitest/config";
import * as path from "path";

export default defineConfig({
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ['./tests/setup-tests.ts'],
    coverage: {
      exclude: [
        ...coverageConfigDefaults.exclude,
        "**/*.config.*",
        "**/index.@(js|ts|jsx|tsx)",
        "**/types.@(js|ts|jsx|tsx)",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
