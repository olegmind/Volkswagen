import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        home: resolve(process.cwd(), "index.html"),
        credit: resolve(process.cwd(), "credit.html"),
        service: resolve(process.cwd(), "servise.html"),
      },
    },
  },
});
