import {fileURLToPath, URL} from "url";
import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import {resolve} from "path";
const __dirname = fileURLToPath(new URL('.', import.meta.url));

let commonConfig =
    {
      server: {
        host: "::",
        port: "8088",
      },
      build : {
        sourcemap : true,

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

export default defineConfig(({ command, mode, isSsrBuild, isPreview }) => {

  if (command === 'build' && !isPreview)
  {
    commonConfig = {
      ...commonConfig,
      define: {
        'BUILD_TIMESTAMP': Date.now().toString(),
      },
    };
  }
  return commonConfig;
});
