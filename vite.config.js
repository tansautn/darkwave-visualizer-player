import {fileURLToPath, URL} from "url";
import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import {resolve} from "path";
const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ command, mode, isPreview }) => {
  const isProdBuild = command === "build" && !isPreview && mode !== "development";

  return {
    ...(isProdBuild
      ? {
          define: {
            BUILD_TIMESTAMP: Date.now().toString(),
          },
        }
      : {}),
    server: {
      host: "::",
      port: "8088",
    },
    build: {
      sourcemap: !isProdBuild,
      emptyOutDir: true,
      target: ['safari14', 'chrome87', 'firefox78'],
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
  };
});
