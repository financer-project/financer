import { execSync } from "child_process"
import db, { Prisma } from "src/lib/db"
import { MySqlContainer } from "@testcontainers/mysql"
import { StartedTestContainer } from "testcontainers"
import seedUsers, { UserSeed } from "@/test/seed/user"
import seedHouseholds, { HouseholdSeed } from "@/test/seed/households"

export interface TestData {
    users: UserSeed,
    households: HouseholdSeed
}

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

        await seedUsers()

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
            .filter(value => value !== "User" && value !== "Session")
        for (const tableName of tableNames) {
            console.info(`Resetting database table name ${tableName}`)
            await db.$queryRawUnsafe(`TRUNCATE TABLE ${tableName};`)
        }

        await db.$queryRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1`)
        console.info("Database successfully reset.")
        return null
    },

    async seedDatabase(): Promise<TestData> {
        const users: UserSeed = {
            standard: (await db.user.findFirst({ where: { email: "user@financer.com" } }))!,
            admin: (await db.user.findFirst({ where: { email: "admin@financer.com" } }))!
        }

        const households = await seedHouseholds(users)

        return {
            users: users,
            households: households
        }
    }
}
export default databaseTasks
