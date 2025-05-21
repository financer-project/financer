import { StartedTestContainer } from "testcontainers"
import { MySqlContainer } from "@testcontainers/mysql"
import { execSync } from "child_process"
import seedUsers from "@/test/seed/user"
import { TestUtilityBase } from "@/test/utility/TestUtility"
import { RedisContainer } from "@testcontainers/redis"

export default class TestUtilityDBContainer extends TestUtilityBase {
    private static instance: TestUtilityDBContainer
    private mysqlContainer?: StartedTestContainer
    private redisContainer?: StartedTestContainer

    private constructor() {
        super()
    }

    public static getInstance(): TestUtilityDBContainer {
        if (!TestUtilityDBContainer.instance) {
            TestUtilityDBContainer.instance = new TestUtilityDBContainer()
        }
        return TestUtilityDBContainer.instance
    }

    public async startDatabase() {
        if (this.mysqlContainer || this.redisContainer) {
            await this.stopDatabase()
        }

        console.info("Starting test database ...")
        this.mysqlContainer = await new MySqlContainer("mysql:9")
            .withDatabase("financer-test")
            .withRootPassword("password")
            .withUsername("financer-test")
            .withUserPassword("password")
            .withExposedPorts({ container: 3306, host: 3307 })
            .start()

        const port = this.mysqlContainer.getFirstMappedPort()

        console.info(`Started test database running on port ${port} (url: '${process.env.DATABASE_URL}')`)

        execSync("yarn prisma db push --skip-generate", { stdio: "inherit" })
        console.info("Updated schema for test database.")

        console.info("Starting Redis container ...")
        this.redisContainer = await new RedisContainer("redis:7")
            .withExposedPorts({ container: 6379, host: 6380 })
            .start()

        const redisPort = this.redisContainer.getFirstMappedPort()
        const redisUrl = `redis://localhost:${redisPort}`
        process.env.REDIS_URL = redisUrl
        console.info(`Started Redis container running on port ${redisPort} (url: '${redisUrl}')`)

        await seedUsers()
    }

    public async stopDatabase() {
        console.info("Stopping test database ...")
        await this.mysqlContainer?.stop()
        await this.redisContainer?.stop()
        console.info("Test database was stopped.")
    }

    public getTestContainer(): StartedTestContainer {
        if (!this.mysqlContainer) {
            throw new Error("Test container has not been initialized yet.")
        }
        return this.mysqlContainer
    }

}
