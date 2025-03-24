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
        coverage: {
            provider: "istanbul",
            reporter: ["text", "json", "html", "lcov"],
            include: ["src/**"],
            extension: [".ts"],
            reportsDirectory: ".test/coverage/",
        }
    }
})