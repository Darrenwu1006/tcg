import { defineConfig } from "vite";
import { resolve } from "path";
import deckGenerator from "./vite-plugin-deck-generator";

export default defineConfig({
  base: "/tcg/",
  plugins: [deckGenerator()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        "ai-battle": resolve(__dirname, "ai-battle.html"),
      },
    },
  },
});
