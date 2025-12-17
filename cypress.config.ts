import { defineConfig } from "cypress"
import codeCoverageTask from "@cypress/code-coverage/task"
import TestUtilityDBContainer from "./test/utility/TestUtilityDBContainer"

export default defineConfig({
    projectId: "financer",

    retries: {
        runMode: 2,
        openMode: 0
    },

    e2e: {
        baseUrl: "http://localhost:3000",
        supportFile: "test/cypress/support/e2e.ts",
        screenshotsFolder: ".test/e2e/screenshots",
        videosFolder: ".test/e2e/videos",
        downloadsFolder: ".test/e2e/downloads",
        specPattern: "test/cypress/e2e/**/*.spec.ts",
        setupNodeEvents(on, config) {
            codeCoverageTask(on, config)
            const dbContainer = TestUtilityDBContainer.getInstance()

            on("task", {
                async resetDatabase(resetUsers) {
                    await dbContainer.resetDatabase(resetUsers)
                    return null
                },
                async seedDatabase() {
                    await dbContainer.seedDatabase()
                    return dbContainer.getTestData()
                },
                async createToken({ type, email, userId, content }: { type: string, email: string, userId: string, content?: any }) {
                    return await dbContainer.createToken(type, email, userId, content)
                }
            })

            on("before:run", async () => {
                await dbContainer.startDatabase()
            })

            on("after:run", async () => {
                await dbContainer.stopDatabase()
            })

            return config
        },
        experimentalRunAllSpecs: true,
        requestTimeout: 10000,
        defaultCommandTimeout: 10000
    },

    fixturesFolder: "test/cypress/fixtures",
    supportFolder: "test/cypress/support",
    defaultBrowser: "chrome",
    experimentalInteractiveRunEvents: true,

    component: {
        supportFolder: "test/cypress/support",
        indexHtmlFile: "test/cypress/support/component-index.html",
        supportFile: "test/cypress/support/component.tsx",
        specPattern: "test/cypress/component/**/*.spec.tsx",
        screenshotsFolder: ".test/component/screenshots",
        videosFolder: ".test/component/videos",
        downloadsFolder: ".test/component/downloads",
        devServer: {
            framework: "next",
            bundler: "webpack",
            webpackConfig: {
                module: {
                    rules: [
                        {
                            test: /\.(ts|tsx)$/,
                            exclude: /node_modules/,
                            use: [
                                {
                                    loader: "babel-loader",
                                    options: {
                                        plugins: ["istanbul"]
                                    }
                                }
                            ]
                        }
                    ]
                }
            }
        },
        setupNodeEvents(on, config) {
            codeCoverageTask(on, config)
            return config
        }
    }
})
