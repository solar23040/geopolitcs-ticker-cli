import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/cli/index.tsx", server: "src/server/index.ts" },
  format: ["esm"],
  target: "node18",
  clean: true,
  minify: false,
  shims: true
});
