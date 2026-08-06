// Standard Vite + TanStack Start config for self-hosting on Render (Node server).
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    tanstackStart({
      server: { entry: "server" },
    }),
    react(),
    nitro({
      preset: "node-server",
      output: { dir: ".output", serverDir: ".output/server", publicDir: ".output/public" },
    }),
  ],
  css: {
    transformer: "lightningcss",
  },
  resolve: {
    alias: {
      "@": "/home/pradeep/kp/src",
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
});
