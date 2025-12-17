import { loadEnvConfig } from "@next/env"
import { defineConfig } from "vitest/config"
import tsconfigPaths from "vite-tsconfig-paths"

const projectDir = process.cwd()
loadEnvConfig(projectDir)

export default defineConfig({
    plugins: [tsconfigPaths()],
    test: {
        dir: "./test/vitest",
        globals: true,
        setupFiles: ["test/vitest/setup/mock-prisma.ts"],
        // Global timeouts increased for heavy integration tests (e.g., Testcontainers + MySQL)
        // to avoid "Hook timed out in 10000ms" during container startup on CI/Windows.
        hookTimeout: 120_000,
        testTimeout: 120_000,
        teardownTimeout: 60_000,
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
    build: {
        sourcemap: "inline"
    },
    esbuild: {
        sourcemap: "inline"
    }
})