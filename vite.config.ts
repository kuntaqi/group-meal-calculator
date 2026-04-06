import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("pdfjs-dist")) {
              return "pdfjs";
            }
            if (id.includes("tesseract.js")) {
              return "tesseract";
            }
            if (id.includes("html2canvas")) {
              return "html2canvas";
            }
            if (id.includes("lucide-react")) {
              return "lucide";
            }
            return "vendor"; // all other dependencies
          }
        },
      },
    },
  },
});
