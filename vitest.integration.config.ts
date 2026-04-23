import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        include: ["src/__tests__/integration/**/*.test.ts"],
        globalSetup: "./src/__tests__/integration/global-setup.ts",
        setupFiles: ["./src/__tests__/integration/per-test-setup.ts"],
        fileParallelism: false, // run test files sequentially
        sequence: {
            concurrent: false, // run sequentially — tests share a real DB
        },
    },
});