import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// Absolute path to the monorepo root (two dirs up from examples/vue-demo/).
// Using fileURLToPath + import.meta.url is required in ESM configs on Windows
// because relative strings in fs.allow don't reliably follow junction symlinks.
const monorepoRoot = fileURLToPath(new URL("../..", import.meta.url));

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5179,
    fs: { allow: [monorepoRoot] },
  },
});
