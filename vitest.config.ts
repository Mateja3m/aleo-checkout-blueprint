import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@aleo-checkout/aleo-client": `${root}packages/aleo-client/src/index.ts`,
      "@aleo-checkout/checkout-core": `${root}packages/checkout-core/src/index.ts`,
      "@aleo-checkout/shared-types": `${root}packages/shared-types/src/index.ts`
    }
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "packages/**/*.test.ts"],
    coverage: {
      reporter: ["text"]
    }
  }
});
