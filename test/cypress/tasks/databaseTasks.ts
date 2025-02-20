import { execSync } from "child_process"
import db from "src/lib/db"
import { SecurePassword } from "@blitzjs/auth/secure-password"
import { MySqlContainer } from "@testcontainers/mysql"
import { StartedTestContainer } from "testcontainers"

const databaseTasks = {
    async startDatabase(): Promise<StartedTestContainer> {
        console.info("Starting test database ...")
        const container = await new MySqlContainer("mysql:9")
            .withDatabase("financer-test")
            .withRootPassword("password")
            .withUsername("financer-test")
            .withUserPassword("password")
            .withExposedPorts({ container: 3306, host: 3307 })
            .start()

        const port = container.getFirstMappedPort()

        console.info(`Started test database running on port ${port} (url: '${process.env.DATABASE_URL}')`)

        return container
    },

    async stopDatabase(container: StartedTestContainer): Promise<void> {
        console.info("Stopping test database ...")
        await container.stop()
        console.info("Test database was stopped.")
    },

    async resetDatabase() {
        console.log("Resetting the database...")

        try {
            execSync("yarn db:push:test", { stdio: "inherit" })
            console.log("Database successfully reset.")
            return null
        } catch (error) {
            console.error("Error while resetting the database:", error)
            throw error instanceof Error ? error : new Error(String(error))
        }
    },

    async seedDatabase() {
        try {
            const hashedPassword = await SecurePassword.hash("password")
            return await db.user.create({
                data: {
                    email: "test@financer.com",
                    hashedPassword: hashedPassword,
                    firstName: "Test",
                    lastName: "User"
                }
            })
        } catch (error) {
            throw new Error(`Error seeding database: ${error}`)
        }
    }
}
export default databaseTasks