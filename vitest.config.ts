import { defineConfig } from 'vitest/config'
import * as path from "path";

export default defineConfig({
  test: {
    environment: "happy-dom",
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
