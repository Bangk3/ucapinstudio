import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    coverage: {
      reporter: ["text"],
      include: ["lib/permissions.ts", "lib/orders.ts"],
    },
  },
});
