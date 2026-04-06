import { defineConfig } from "orval";

export default defineConfig({
  osolot: {
    input: "../api/openapi.json",
    output: {
      mode: "single",
      target: "./src/api/generated.ts",
      client: "axios",
      override: {
        mutator: {
          path: "./src/api/axios-instance.ts",
          name: "customInstance",
        },
      },
    },
  },
});
