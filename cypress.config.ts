import { defineConfig } from "cypress"
import databaseTasks from "@/test/cypress/tasks/databaseTasks"

export default defineConfig({
    projectId: "financer",

    e2e: {
        baseUrl: "http://localhost:3000",
        supportFile: "test/cypress/support/e2e.ts",
        specPattern: "test/cypress/e2e/**/*.spec.ts",
        setupNodeEvents(on, config) {
            require("@cypress/code-coverage/task")(on, config)
            on("task", {
                ...databaseTasks
            })
            on("before:run", async () => {
                await databaseTasks.startDatabase()
            })
            on("after:run", async () => {
                await databaseTasks.stopDatabase()
            })
            return config
        },
        experimentalRunAllSpecs: true,
        requestTimeout: 10000,
        defaultCommandTimeout: 10000
    },

    fixturesFolder: "test/cypress/fixtures",
    screenshotsFolder: "test/cypress/screenshots",
    videosFolder: "test/cypress/videos",
    downloadsFolder: "test/cypress/downloads",
    supportFolder: "test/cypress/support",
    defaultBrowser: "chrome",
    experimentalInteractiveRunEvents: true,

    component: {
        supportFolder: "test/cypress/support",
        indexHtmlFile: "test/cypress/support/component-index.html",
        supportFile: "test/cypress/support/component.ts",
        specPattern: "test/cypress/component/**/*.spec.tsx",
        devServer: {
            framework: "next",
            bundler: "webpack"
        },
        setupNodeEvents(on, config) {
            require("@cypress/code-coverage/task")(on, config)
            return config
        }
    }
})
