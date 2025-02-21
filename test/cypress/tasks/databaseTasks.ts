import { execSync } from "child_process"
import db, { Prisma } from "src/lib/db"
import { SecurePassword } from "@blitzjs/auth/secure-password"
import { MySqlContainer } from "@testcontainers/mysql"
import { StartedTestContainer } from "testcontainers"
import { Role, User } from "@prisma/client"

let container: StartedTestContainer

const databaseTasks = {
    async startDatabase(): Promise<StartedTestContainer> {
        if (container) {
            await this.stopDatabase()
        }

        console.info("Starting test database ...")
        container = await new MySqlContainer("mysql:9")
            .withDatabase("financer-test")
            .withRootPassword("password")
            .withUsername("financer-test")
            .withUserPassword("password")
            .withExposedPorts({ container: 3306, host: 3307 })
            .start()

        const port = container.getFirstMappedPort()

        console.info(`Started test database running on port ${port} (url: '${process.env.DATABASE_URL}')`)

        execSync("yarn blitz prisma db push --skip-generate", { stdio: "inherit" })
        console.info("Updated schema for test database.")

        return container
    },

    async stopDatabase(): Promise<void> {
        console.info("Stopping test database ...")
        await container.stop()
        console.info("Test database was stopped.")
    },

    async resetDatabase() {
        console.info("Resetting the database...")
        await db.$queryRawUnsafe(`SET FOREIGN_KEY_CHECKS = 0`)

        const tableNames = Object.values(Prisma.ModelName)
        for (const tableName of tableNames) {
            await db.$queryRawUnsafe(`TRUNCATE TABLE ${tableName};`)
        }

        await db.$queryRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1`)
        console.info("Database successfully reset.")
        return null
    },

    async seedDatabase() {
        const hashedPassword = await SecurePassword.hash("password")
        const adminUser = await db.user.create({
            data: {
                email: "admin@financer.com",
                hashedPassword: hashedPassword,
                firstName: "Test",
                lastName: "User",
                role: Role.ADMIN
            }
        })
        const defaultUser = await db.user.create({
            data: {
                email: "user@financer.com",
                hashedPassword: hashedPassword,
                firstName: "Test",
                lastName: "User"
            }
        })

        return {
            adminUser: adminUser,
            defaultUser: defaultUser
        }
    }
}
export default databaseTasks