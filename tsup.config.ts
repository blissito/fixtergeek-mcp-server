import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ["node:http", "node:https", "node:net", "node:url", "node:events"],
  onSuccess: "tsc --emitDeclarationOnly --declaration",
  esbuildOptions(options) {
    options.banner = {
      js: "// @fixtergeek/mcp-server v1.0.0\n",
    };
  },
});
