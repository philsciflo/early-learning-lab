import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
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
    outDir: "../../docs/games/magic-cups",
  },
  server: {
    port: 8080,
  },
});
