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
            on("before:run", async () => {
                await databaseTasks.startDatabase()
            })
            on("after:run", async () => {
                await databaseTasks.stopDatabase()
            })
        }
    },
    fixturesFolder: "test/cypress/fixtures",
    screenshotsFolder: "test/cypress/screenshots",
    videosFolder: "test/cypress/videos",
    downloadsFolder: "test/cypress/downloads",
    defaultBrowser: "chrome",
    pageLoadTimeout: 200000,
    experimentalInteractiveRunEvents: true
})

