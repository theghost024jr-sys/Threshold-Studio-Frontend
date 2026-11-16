import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "website/tests/**/*.vitest.mjs",
      "website/tests/main-hub-*.test.js"
    ]
  }
});
