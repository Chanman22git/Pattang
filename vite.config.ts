import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves the repo at https://<user>.github.io/Pattang/
// In dev (vite dev) we want "/"; in production build we want "/Pattang/".
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "build" ? "/Pattang/" : "/",
  server: {
    port: 5173,
  },
}));
