import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5178,
    // Allow the dev server to serve files from the monorepo root so that
    // the local `file:../..` pivottable package (a Windows junction) can
    // resolve assets (e.g. dist/pivot.css) outside this project's root.
    fs: { allow: ["../.."] },
  },
});
