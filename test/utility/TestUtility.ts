import seedUsers, { UserSeed } from "@/test/seed/user"
import seedHouseholds, { HouseholdSeed } from "@/test/seed/households"
import seedAccounts, { AccountSeed } from "@/test/seed/accounts"
import seedCategories, { CategorySeed } from "@/test/seed/categorySeed"
import db, { Prisma } from "@/src/lib/db"
import seedTransactions, { TransactionSeed } from "@/test/seed/transactions"

export interface TestData {
    users: UserSeed,
    households: HouseholdSeed,
    accounts: AccountSeed,
    categories: CategorySeed,
    transactions: TransactionSeed
}

export interface TestUtility {
    seedDatabase(): Promise<void>,

    resetDatabase(resetUsers?: boolean): Promise<void>

    startDatabase(): Promise<void>

    stopDatabase(): Promise<void>
}

export abstract class TestUtilityBase implements TestUtility {
    protected testData?: TestData

    abstract startDatabase(): Promise<void>

    abstract stopDatabase(): Promise<void>

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
    }

    async seedDatabase(): Promise<void> {
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
        const transactions = await seedTransactions(accounts, categories)

        this.testData = {
            users: users,
            households: households,
            accounts: accounts,
            categories: categories,
            transactions: transactions
        }
    }

    public getTestData(): TestData {
        if (!this.testData) {
            throw new Error("Test data has not been initialized yet.")
        }
        return this.testData
    }

    public getDatabase(): typeof db {
        return db
    }
}
