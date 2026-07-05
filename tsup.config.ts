import { defineConfig, type Options } from "tsup";
import { existsSync, renameSync } from "node:fs";
import { sassPlugin } from "esbuild-sass-plugin";

const hasTypes = existsSync("src/ts/types/index.d.ts");

const config: Options[] = [
  // 1. The NPM Build (ESM)
  {
    entry: ["src/js/index.js"],
    format: ["esm"],
    clean: true,
    ...(hasTypes && {
      dts: { entry: "src/ts/types/index.d.ts" },
    }),
    esbuildPlugins: [sassPlugin()],
  },
  // 2. The Browser IIFE Build
  {
    entry: ["src/js/index.js"],
    format: ["iife"],
    noExternal: ["@t007/utils"],
    esbuildPlugins: [sassPlugin()],
  },
];
existsSync("src/ts/react.ts") &&
  config.push({
    entry: ["src/ts/react.ts"],
    format: ["esm"],
    dts: true,
    esbuildPlugins: [sassPlugin()],
  });

export default defineConfig(config);

process.on("exit", () => existsSync("dist/index.d.d.ts") && (renameSync("dist/index.d.d.ts", "dist/index.d.ts"), console.log("✅ Renamed index.d.d.ts to index.d.ts")));
