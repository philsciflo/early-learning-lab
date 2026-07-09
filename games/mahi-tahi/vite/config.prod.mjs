import { defineConfig } from "vite";

export default defineConfig({
  base: "/capstone-project-s1-2026-team-2/",
  logLevel: "warning",
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ["phaser"],
        },
      },
    },
    minify: "terser",
    terserOptions: {
      compress: {
        passes: 2,
      },
      mangle: true,
      format: {
        comments: false,
      },
    },
    emptyOutDir: true,
    outDir: "docs",
  },
  server: {
    port: 8080,
  },
});