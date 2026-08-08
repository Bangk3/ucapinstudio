import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: { reporter: ["text"], include: ["lib/permissions.ts"] },
  },
});
