import {fileURLToPath, URL} from "url";
import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import {resolve} from "path";
const __dirname = fileURLToPath(new URL('.', import.meta.url));
// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: "8088",
  },
  build : {
    sourcemap : true,
    watch     : {},
  },
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "@",
        replacement: fileURLToPath(new URL("./src", import.meta.url)),
      },
      {
        find: "lib",
        replacement: resolve(__dirname, "lib"),
      },
    ],
  },
});
