import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    swc.vite({
      module: { type: "es6" },
      jsc: {
        target: "es2022",
        parser: {
          syntax: "typescript",
          decorators: true,
        },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
        },
        keepClassNames: true,
      },
    }),
  ],
  test: {
    globals: false,
    environment: "node",
    include: ["src/**/*.{spec,test}.ts", "test/**/*.{spec,test,e2e-spec,e2e-test}.ts"],
    testTimeout: 15_000,
    hookTimeout: 15_000,
    pool: "forks",
    coverage: {
      reporter: ["text", "html"],
      exclude: ["**/node_modules/**", "**/dist/**", "**/*.spec.ts", "**/*.test.ts"],
    },
  },
});
