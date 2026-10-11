import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.tsx"],
  format: ["esm"],
  target: "node18",
  clean: true,
  minify: false,
  shims: true
});
