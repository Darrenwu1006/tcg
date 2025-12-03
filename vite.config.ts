import { defineConfig } from "vite";
import deckGenerator from "./vite-plugin-deck-generator";

export default defineConfig({
  base: "/tcg/",
  plugins: [deckGenerator()],
});
