import { loadEnvConfig } from "@next/env"
import { defineConfig } from "vitest/config"

import react from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"

const projectDir = process.cwd()
loadEnvConfig(projectDir)

export default defineConfig({
    plugins: [react(), tsconfigPaths()],
    test: {
        dir: "./test/vitest",
        globals: true,
        setupFiles: "test/vitest/setup/mock-prisma.ts",
        environment: "node",
        coverage: {
            enabled: true,
            provider: "istanbul",
            reporter: [
                ["text-summary"],
                ["json", { file: "../../../.nyc_output/out.json" }],
                ["html"],
                ["lcov"]],
            include: ["src/**"],
            exclude: [
                "src/app/**/page.tsx",
                "src/app/**/layout.tsx",
                "src/app/**/route.ts"
            ],
            extension: [".ts", ".tsx"],
            reportsDirectory: ".test/unit/coverage/"
        }
    },
    esbuild: {
        sourcemap: "linked"
    }
})