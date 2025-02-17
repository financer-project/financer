import { defineConfig } from "cypress"
import databaseTasks from "@/test/cypress/tasks/databaseTasks"

export default defineConfig({
    projectId: "financer",
    e2e: {
        baseUrl: "http://localhost:3000",
        supportFile: false,
        specPattern: "test/cypress/e2e/**/*.spec.ts",
        setupNodeEvents(on) {
            on("task", {
                ...databaseTasks
            })
        }
    },
    fixturesFolder: "test/cypress/fixtures",
    screenshotsFolder: "test/cypress/screenshots",
    videosFolder: "test/cypress/videos",
    downloadsFolder: "test/cypress/downloads",
    defaultBrowser: "chrome",
    pageLoadTimeout: 100000
})

