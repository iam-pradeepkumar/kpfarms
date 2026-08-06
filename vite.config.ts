// Standard Vite + TanStack Start config for self-hosting on Render (Node server).
// This replaces @lovable.dev/vite-tanstack-config for non-Lovable deployments.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    tanstackStart({
      server: { entry: "server" },
    }),
    react(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  // Self-hosting (Render): build a plain Node server at .output/server/index.mjs.
  // @ts-expect-error — nitro config is injected by tanstackStart at build time
  nitro: {
    preset: "node-server",
    output: { dir: ".output", serverDir: ".output/server", publicDir: ".output/public" },
  },
});
