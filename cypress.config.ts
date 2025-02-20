import { defineConfig } from "cypress"
import databaseTasks from "@/test/cypress/tasks/databaseTasks"
import { StartedTestContainer } from "testcontainers"

let container: StartedTestContainer

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
                container = await databaseTasks.startDatabase()
                // await databaseTasks.startApp()
            })
            on("after:run", async () => {
                await databaseTasks.stopDatabase(container)
            })
        }
    },
    fixturesFolder: "test/cypress/fixtures",
    screenshotsFolder: "test/cypress/screenshots",
    videosFolder: "test/cypress/videos",
    downloadsFolder: "test/cypress/downloads",
    defaultBrowser: "chrome",
    pageLoadTimeout: 100000,
    experimentalInteractiveRunEvents: true
})

