import seedUsers, { UserSeed } from "@/test/seed/user"
import seedHouseholds, { HouseholdSeed } from "@/test/seed/households"
import seedAccounts, { AccountSeed } from "@/test/seed/accounts"
import seedCategories, { CategorySeed } from "@/test/seed/categorySeed"
import seedTags, { TagSeed } from "@/test/seed/tagSeed"
import db, { Prisma } from "@/src/lib/db"
import seedTransactions, { TransactionSeed } from "@/test/seed/transactions"
import seedAdminSettings, { AdminSettingsSeed } from "@/test/seed/adminSettings"
import seedCounterparties, { CounterpartySeed } from "@/test/seed/counterpartySeed"
import { generateToken, hash256 } from "@blitzjs/auth"

export interface TestData {
    adminSettings: AdminSettingsSeed,
    users: UserSeed,
    households: HouseholdSeed,
    accounts: AccountSeed,
    categories: CategorySeed,
    tags: TagSeed,
    transactions: TransactionSeed,
    counterparties: CounterpartySeed
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

        const adminSettings = await seedAdminSettings()
        const households = await seedHouseholds(users)
        const accounts = await seedAccounts(households)
        const categories = await seedCategories(households)
        const tags = await seedTags(households)
        const transactions = await seedTransactions(accounts, categories)
        const counterparties = await seedCounterparties(households)

        this.testData = {
            adminSettings: adminSettings,
            users: users,
            households: households,
            accounts: accounts,
            categories: categories,
            tags: tags,
            transactions: transactions,
            counterparties: counterparties
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

    public async createToken(type: string, email: string, userId: string, content?: any): Promise<{ token: string }> {
        const token = generateToken()
        const hashedToken = hash256(token)

        // Delete any existing tokens of this type for this user
        await db.token.deleteMany({
            where: {
                type: type as any,
                sentTo: email
            }
        })

        // Create the new token
        await db.token.create({
            data: {
                userId,
                type: type as any,
                hashedToken,
                sentTo: email,
                expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours from now
                content: content || null
            }
        })

        return { token }
    }
}
