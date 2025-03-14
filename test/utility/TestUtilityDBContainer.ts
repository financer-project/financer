import { StartedTestContainer } from "testcontainers"
import { MySqlContainer } from "@testcontainers/mysql"
import { execSync } from "child_process"
import seedUsers from "@/test/seed/user"
import { TestUtilityBase } from "@/test/utility/TestUtility"

export default class TestUtilityDBContainer extends TestUtilityBase {
    private container?: StartedTestContainer

    public async startDatabase() {
        if (this.container) {
            await this.stopDatabase()
        }

        console.info("Starting test database ...")
        this.container = await new MySqlContainer("mysql:9")
            .withDatabase("financer-test")
            .withRootPassword("password")
            .withUsername("financer-test")
            .withUserPassword("password")
            .withExposedPorts({ container: 3306, host: 3307 })
            .start()

        const port = this.container.getFirstMappedPort()

        console.info(`Started test database running on port ${port} (url: '${process.env.DATABASE_URL}')`)

        execSync("yarn blitz prisma db push --skip-generate", { stdio: "inherit" })
        console.info("Updated schema for test database.")

        await seedUsers()
    }

    public async stopDatabase() {
        console.info("Stopping test database ...")
        await this.container?.stop()
        console.info("Test database was stopped.")
    }

    public getTestContainer(): StartedTestContainer {
        if (!this.container) {
            throw new Error("Test container has not been initialized yet.")
        }
        return this.container
    }

}