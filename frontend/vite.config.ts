import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Public path the app is served from. Defaults to "/"; the GitHub Pages demo build
  // sets VITE_BASE_PATH=/taskflow-kanban/.
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [react(), tailwindcss()]
});
