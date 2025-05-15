import { execSync } from "child_process"
import db, { Prisma } from "src/lib/db"
import { MySqlContainer } from "@testcontainers/mysql"
import { StartedTestContainer } from "testcontainers"
import seedUsers, { UserSeed } from "@/test/seed/user"
import seedHouseholds, { HouseholdSeed } from "@/test/seed/households"
import seedAccounts, { AccountSeed } from "@/test/seed/accounts"
import seedCategories, { CategorySeed } from "@/test/seed/categorySeed"
import { RedisContainer } from "@testcontainers/redis"

export interface TestData {
    users: UserSeed,
    households: HouseholdSeed,
    accounts: AccountSeed,
    categories: CategorySeed,
}

let dbContainer: StartedTestContainer
let redisContainer: StartedTestContainer

const databaseTasks = {
    async startDatabase(): Promise<StartedTestContainer> {
        if (dbContainer || redisContainer) {
            await this.stopDatabase()
        }

        console.info("Starting test database ...")
        dbContainer = await new MySqlContainer("mysql:9")
            .withDatabase("financer-test")
            .withRootPassword("password")
            .withUsername("financer-test")
            .withUserPassword("password")
            .withExposedPorts({ container: 3306, host: 3307 })
            .start()

        const dbPort = dbContainer.getFirstMappedPort()
        console.info(`Started test database running on port ${dbPort} (url: '${process.env.DATABASE_URL}')`)

        execSync("yarn prisma db push --skip-generate", { stdio: "inherit" })
        console.info("Updated schema for test database.")

        console.info("Starting Redis container ...")
        redisContainer = await new RedisContainer("redis:7")
            .withExposedPorts({ container: 6379, host: 6380 })
            .start()

        const redisPort = redisContainer.getFirstMappedPort()
        const redisUrl = `redis://localhost:${redisPort}`
        process.env.REDIS_URL = redisUrl
        console.info(`Started Redis container running on port ${redisPort} (url: '${redisUrl}')`)

        await seedUsers()

        return dbContainer
    },

    async stopDatabase(): Promise<void> {
        if (dbContainer) {
            console.info("Stopping test database ...")
            await dbContainer.stop()
            console.info("Test database was stopped.")
        }

        if (redisContainer) {
            console.info("Stopping Redis container ...")
            await redisContainer.stop()
            console.info("Redis container was stopped.")
        }
    },

    async resetDatabase(resetUsers?: boolean) {
        console.info("Resetting the database...")
        await db.$queryRawUnsafe(`SET FOREIGN_KEY_CHECKS = 0`)

        const tableNames = Object.values(Prisma.ModelName)
            .filter(value => {
                return !resetUsers ? value !== "User" && value !== "Session" : true
            })
        for (const tableName of tableNames) {
            console.info(`Resetting database table name ${tableName}`)
            await db.$queryRawUnsafe(`TRUNCATE TABLE ${tableName};`)
        }

        await db.$queryRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1`)
        console.info("Database successfully reset.")
        return null
    },

    async seedDatabase(): Promise<TestData> {
        let users: UserSeed
        if (await db.user.findFirst({ where: { email: "user@financer.com" } })) {
            users = {
                standard: (await db.user.findFirst({ where: { email: "user@financer.com" } }))!,
                admin: (await db.user.findFirst({ where: { email: "admin@financer.com" } }))!
            }
        } else {
            users = await seedUsers()
        }

        const households = await seedHouseholds(users)
        const accounts = await seedAccounts(households)
        const categories = await seedCategories(households)

        return {
            users: users,
            households: households,
            accounts: accounts,
            categories: categories
        }
    }
}
export default databaseTasks
