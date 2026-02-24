import {
    CategoryType,
    CounterpartyType,
    HouseholdRole,
    PrismaClient,
    RecurrenceFrequency,
    Role,
    TransactionType
} from "@prisma/client"
import { SecurePassword } from "@blitzjs/auth/secure-password"

function daysFromNow(days: number): Date {
    const d = new Date()
    d.setDate(d.getDate() + days)
    d.setHours(10, 0, 0, 0)
    return d
}

function daysAgo(days: number): Date {
    const d = new Date()
    d.setDate(d.getDate() - days)
    d.setHours(10, 0, 0, 0)
    return d
}

function randomAmount(min: number, max: number): number {
    return Math.round((min + Math.random() * (max - min)) * 100) / 100
}

export async function seedDemoData(db: PrismaClient): Promise<void> {
    if (process.env.DEMO_DATA !== "true") {
        return
    }

    // Idempotency check: skip if demo user already exists
    const existingUser = await db.user.findFirst({
        where: { email: "demo@financer.com" },
    })
    if (existingUser) {
        console.log("[seed] Demo data already exists, skipping.")
        return
    }

    console.log("[seed] Seeding demo data...")

    // --- Admin Settings ---
    await db.adminSettings.upsert({
        where: { id: 1 },
        update: {},
        create: {
            allowRegistration: true,
            defaultLanguage: "en-US",
            defaultTheme: "light",
            onboardingCompleted: true,
            smtpFromName: "Financer App",
        },
    })
    console.log("[seed] Admin settings created")

    // --- Demo User ---
    const hashedPassword = await SecurePassword.hash("demo1234")
    const user = await db.user.create({
        data: {
            email: "demo@financer.com",
            hashedPassword,
            firstName: "Alex",
            lastName: "Demo",
            role: Role.ADMIN,
            settings: {
                create: {
                    language: "en-US",
                    theme: "light",
                },
            },
        },
    })
    console.log("[seed] Demo user created (demo@financer.com / demo1234)")

    // --- Households ---
    await seedHouseholdWithData(db, user.id, "Personal Finance", "Personal finances and budgeting", [
        { name: "Checking Account", iban: "DE89 3704 0044 0532 0130 00" },
        { name: "Savings Account" },
    ])

    await seedHouseholdWithData(db, user.id, "Family Budget", "Shared family budget and expenses", [
        { name: "Joint Account", iban: "DE27 1007 0024 0066 4440 00" },
        { name: "Emergency Fund" },
    ])

    console.log("[seed] Demo data seeded successfully!")
    console.log("[seed] Login: demo@financer.com / demo1234")
}

async function seedHouseholdWithData(
    db: PrismaClient,
    userId: string,
    householdName: string,
    description: string,
    accountDefs: Array<{ name: string; iban?: string }>
) {
    // Create household with membership
    const household = await db.household.create({
        data: {
            name: householdName,
            currency: "EUR",
            description,
            createdById: userId,
            members: {
                create: {
                    userId,
                    role: HouseholdRole.OWNER,
                },
            },
        },
    })
    console.log(`[seed] Household "${householdName}" created`)

    // Create accounts
    const accounts = await Promise.all(
        accountDefs.map((a) =>
            db.account.create({
                data: {
                    name: a.name,
                    technicalIdentifier: a.iban ?? null,
                    householdId: household.id,
                },
            })
        )
    )
    const primaryAccount = accounts[0]!
    const secondaryAccount = accounts[1]!
    console.log(`[seed]   ${accounts.length} accounts created`)

    // Set default account for membership
    const membership = await db.householdMembership.findFirst({
        where: { userId, householdId: household.id },
    })
    if (membership) {
        await db.householdMembership.update({
            where: { id: membership.id },
            data: { defaultAccountId: primaryAccount.id },
        })
    }

    // --- Income Categories (no sub-categories) ---
    const salary = await db.category.create({
        data: { name: "Salary", type: CategoryType.INCOME, color: "green", householdId: household.id },
    })
    const freelance = await db.category.create({
        data: { name: "Freelance Income", type: CategoryType.INCOME, color: "emerald", householdId: household.id },
    })
    const investmentsCat = await db.category.create({
        data: { name: "Investment Returns", type: CategoryType.INCOME, color: "teal", householdId: household.id },
    })
    await db.category.create({
        data: { name: "Gifts Received", type: CategoryType.INCOME, color: "amber", householdId: household.id },
    })

    // --- Expense Categories with sub-categories ---
    const housing = await db.category.create({
        data: { name: "Housing", type: CategoryType.EXPENSE, color: "red", householdId: household.id },
    })
    const rentCat = await db.category.create({
        data: { name: "Rent", type: CategoryType.EXPENSE, color: "red", householdId: household.id, parentId: housing.id },
    })
    const utilitiesCat = await db.category.create({
        data: { name: "Utilities", type: CategoryType.EXPENSE, color: "red", householdId: household.id, parentId: housing.id },
    })
    const insuranceCat = await db.category.create({
        data: { name: "Insurance", type: CategoryType.EXPENSE, color: "red", householdId: household.id, parentId: housing.id },
    })

    const foodDining = await db.category.create({
        data: { name: "Food & Dining", type: CategoryType.EXPENSE, color: "orange", householdId: household.id },
    })
    const groceriesCat = await db.category.create({
        data: { name: "Groceries", type: CategoryType.EXPENSE, color: "orange", householdId: household.id, parentId: foodDining.id },
    })
    const restaurantsCat = await db.category.create({
        data: { name: "Restaurants", type: CategoryType.EXPENSE, color: "orange", householdId: household.id, parentId: foodDining.id },
    })
    const coffeeCat = await db.category.create({
        data: { name: "Coffee", type: CategoryType.EXPENSE, color: "orange", householdId: household.id, parentId: foodDining.id },
    })

    const transportation = await db.category.create({
        data: { name: "Transportation", type: CategoryType.EXPENSE, color: "blue", householdId: household.id },
    })
    const publicTransitCat = await db.category.create({
        data: { name: "Public Transit", type: CategoryType.EXPENSE, color: "blue", householdId: household.id, parentId: transportation.id },
    })
    const fuelCat = await db.category.create({
        data: { name: "Fuel", type: CategoryType.EXPENSE, color: "blue", householdId: household.id, parentId: transportation.id },
    })
    await db.category.create({
        data: { name: "Car Maintenance", type: CategoryType.EXPENSE, color: "blue", householdId: household.id, parentId: transportation.id },
    })

    const entertainment = await db.category.create({
        data: { name: "Entertainment", type: CategoryType.EXPENSE, color: "purple", householdId: household.id },
    })
    const streamingCat = await db.category.create({
        data: { name: "Streaming", type: CategoryType.EXPENSE, color: "purple", householdId: household.id, parentId: entertainment.id },
    })
    await db.category.create({
        data: { name: "Hobbies", type: CategoryType.EXPENSE, color: "purple", householdId: household.id, parentId: entertainment.id },
    })
    await db.category.create({
        data: { name: "Events", type: CategoryType.EXPENSE, color: "purple", householdId: household.id, parentId: entertainment.id },
    })

    const shoppingCat = await db.category.create({
        data: { name: "Shopping", type: CategoryType.EXPENSE, color: "pink", householdId: household.id },
    })
    const clothingCat = await db.category.create({
        data: { name: "Clothing", type: CategoryType.EXPENSE, color: "pink", householdId: household.id, parentId: shoppingCat.id },
    })
    const electronicsCat = await db.category.create({
        data: { name: "Electronics", type: CategoryType.EXPENSE, color: "pink", householdId: household.id, parentId: shoppingCat.id },
    })
    const homeGardenCat = await db.category.create({
        data: { name: "Home & Garden", type: CategoryType.EXPENSE, color: "pink", householdId: household.id, parentId: shoppingCat.id },
    })

    const healthCat = await db.category.create({
        data: { name: "Health", type: CategoryType.EXPENSE, color: "cyan", householdId: household.id },
    })
    await db.category.create({
        data: { name: "Doctor", type: CategoryType.EXPENSE, color: "cyan", householdId: household.id, parentId: healthCat.id },
    })
    await db.category.create({
        data: { name: "Pharmacy", type: CategoryType.EXPENSE, color: "cyan", householdId: household.id, parentId: healthCat.id },
    })
    const gymCat = await db.category.create({
        data: { name: "Gym", type: CategoryType.EXPENSE, color: "cyan", householdId: household.id, parentId: healthCat.id },
    })
    console.log("[seed]   Categories created")

    // --- Tags ---
    const tagRecurring = await db.tag.create({
        data: { name: "Recurring", color: "blue", description: "Regular recurring transactions", householdId: household.id },
    })
    const tagOneTime = await db.tag.create({
        data: { name: "One-time", color: "amber", description: "One-time transactions", householdId: household.id },
    })
    const tagTaxDeductible = await db.tag.create({
        data: { name: "Tax Deductible", color: "green", description: "Tax deductible expenses", householdId: household.id },
    })
    await db.tag.create({
        data: { name: "Shared Expense", color: "purple", description: "Shared with others", householdId: household.id },
    })
    await db.tag.create({
        data: { name: "Urgent", color: "red", description: "Urgent or unexpected expenses", householdId: household.id },
    })
    const tagOptional = await db.tag.create({
        data: { name: "Optional", color: "gray", description: "Nice-to-have, non-essential", householdId: household.id },
    })
    console.log("[seed]   Tags created")

    // --- Counterparties ---
    const cpEmployer = await db.counterparty.create({
        data: { name: "Acme Corp", type: CounterpartyType.EMPLOYER, description: "Primary employer", householdId: household.id },
    })
    const cpLandlord = await db.counterparty.create({
        data: { name: "City Apartments GmbH", type: CounterpartyType.LANDLORD, description: "Apartment rental", householdId: household.id },
    })
    const cpSupermarket = await db.counterparty.create({
        data: { name: "REWE", type: CounterpartyType.MERCHANT, description: "Supermarket", householdId: household.id },
    })
    const cpUtility = await db.counterparty.create({
        data: { name: "Stadtwerke Berlin", type: CounterpartyType.UTILITY, description: "Electricity and water", householdId: household.id },
    })
    const cpInsurance = await db.counterparty.create({
        data: { name: "Allianz", type: CounterpartyType.INSURANCE, description: "Insurance provider", householdId: household.id },
    })
    const cpStreaming = await db.counterparty.create({
        data: { name: "Netflix", type: CounterpartyType.SERVICE_PROVIDER, description: "Streaming service", householdId: household.id },
    })
    const cpGym = await db.counterparty.create({
        data: { name: "FitX", type: CounterpartyType.HEALTHCARE, description: "Gym membership", householdId: household.id },
    })
    const cpRestaurant = await db.counterparty.create({
        data: { name: "Vapiano", type: CounterpartyType.MERCHANT, description: "Restaurant", householdId: household.id },
    })
    const cpOnlineShop = await db.counterparty.create({
        data: { name: "Amazon", type: CounterpartyType.PLATFORM, description: "Online marketplace", householdId: household.id },
    })
    await db.counterparty.create({
        data: { name: "Finanzamt", type: CounterpartyType.GOVERNMENT, description: "Tax office", householdId: household.id },
    })
    console.log("[seed]   Counterparties created")

    // --- Transactions ---
    const createTx = async (data: {
        name: string
        type: TransactionType
        amount: number
        valueDate: Date
        accountId: string
        categoryId: string
        counterpartyId?: string
        description?: string
        tagIds?: string[]
    }) => {
        const { tagIds, ...txData } = data
        return db.transaction.create({
            data: {
                ...txData,
                ...(tagIds && tagIds.length > 0
                    ? {
                          tags: {
                              create: tagIds.map((id: string) => ({ tag: { connect: { id } } })),
                          },
                      }
                    : {}),
            },
        })
    }

    // Monthly salary (3 months)
    for (const days of [85, 55, 25]) {
        await createTx({
            name: "Monthly Salary",
            type: TransactionType.INCOME,
            amount: 3500,
            valueDate: daysAgo(days),
            accountId: primaryAccount.id,
            categoryId: salary.id,
            counterpartyId: cpEmployer.id,
            description: "Regular monthly salary from Acme Corp",
            tagIds: [tagRecurring.id],
        })
    }

    // Monthly rent (3 months)
    for (const days of [84, 54, 24]) {
        await createTx({
            name: "Apartment Rent",
            type: TransactionType.EXPENSE,
            amount: -950,
            valueDate: daysAgo(days),
            accountId: primaryAccount.id,
            categoryId: rentCat.id,
            counterpartyId: cpLandlord.id,
            description: "Monthly rent payment",
            tagIds: [tagRecurring.id],
        })
    }

    // Monthly utilities (3 months)
    for (const days of [81, 51, 21]) {
        await createTx({
            name: "Electricity & Water",
            type: TransactionType.EXPENSE,
            amount: -120,
            valueDate: daysAgo(days),
            accountId: primaryAccount.id,
            categoryId: utilitiesCat.id,
            counterpartyId: cpUtility.id,
            tagIds: [tagRecurring.id],
        })
    }

    // Bi-weekly groceries (6 occurrences)
    for (const days of [83, 69, 53, 39, 23, 9]) {
        await createTx({
            name: "Groceries",
            type: TransactionType.EXPENSE,
            amount: -randomAmount(60, 120),
            valueDate: daysAgo(days),
            accountId: primaryAccount.id,
            categoryId: groceriesCat.id,
            counterpartyId: cpSupermarket.id,
        })
    }

    // Weekly coffee (12 occurrences)
    for (const [i, days] of [88, 81, 74, 67, 58, 51, 44, 37, 28, 21, 14, 7].entries()) {
        await createTx({
            name: "Coffee",
            type: TransactionType.EXPENSE,
            amount: -randomAmount(4, 8),
            valueDate: daysAgo(days),
            accountId: primaryAccount.id,
            categoryId: coffeeCat.id,
            tagIds: i % 3 === 0 ? [tagOptional.id] : undefined,
        })
    }

    // Monthly streaming (3 months)
    for (const days of [71, 41, 11]) {
        await createTx({
            name: "Netflix Subscription",
            type: TransactionType.EXPENSE,
            amount: -13.99,
            valueDate: daysAgo(days),
            accountId: primaryAccount.id,
            categoryId: streamingCat.id,
            counterpartyId: cpStreaming.id,
            tagIds: [tagRecurring.id],
        })
    }

    // Monthly gym (3 months)
    for (const days of [86, 56, 26]) {
        await createTx({
            name: "Gym Membership",
            type: TransactionType.EXPENSE,
            amount: -29.99,
            valueDate: daysAgo(days),
            accountId: primaryAccount.id,
            categoryId: gymCat.id,
            counterpartyId: cpGym.id,
            tagIds: [tagRecurring.id],
        })
    }

    // Restaurant visits (4 occurrences)
    for (const days of [78, 64, 48, 18]) {
        await createTx({
            name: "Dinner out",
            type: TransactionType.EXPENSE,
            amount: -randomAmount(25, 60),
            valueDate: daysAgo(days),
            accountId: primaryAccount.id,
            categoryId: restaurantsCat.id,
            counterpartyId: cpRestaurant.id,
            tagIds: [tagOptional.id],
        })
    }

    // Monthly insurance (3 months)
    for (const days of [76, 46, 16]) {
        await createTx({
            name: "Health Insurance",
            type: TransactionType.EXPENSE,
            amount: -85,
            valueDate: daysAgo(days),
            accountId: primaryAccount.id,
            categoryId: insuranceCat.id,
            counterpartyId: cpInsurance.id,
            tagIds: [tagRecurring.id, tagTaxDeductible.id],
        })
    }

    // Occasional shopping (4 occurrences)
    const shoppingItems = [
        { name: "Winter Jacket", catId: clothingCat.id, amount: -89.99, days: 80 },
        { name: "Wireless Headphones", catId: electronicsCat.id, amount: -149.99, days: 42 },
        { name: "Garden Tools", catId: homeGardenCat.id, amount: -45.5, days: 20 },
        { name: "Running Shoes", catId: clothingCat.id, amount: -119.95, days: 8 },
    ]
    for (const item of shoppingItems) {
        await createTx({
            name: item.name,
            type: TransactionType.EXPENSE,
            amount: item.amount,
            valueDate: daysAgo(item.days),
            accountId: primaryAccount.id,
            categoryId: item.catId,
            counterpartyId: cpOnlineShop.id,
            tagIds: [tagOneTime.id],
        })
    }

    // Freelance income (2 occurrences)
    await createTx({
        name: "Website Design Project",
        type: TransactionType.INCOME,
        amount: 750,
        valueDate: daysAgo(36),
        accountId: primaryAccount.id,
        categoryId: freelance.id,
        tagIds: [tagOneTime.id, tagTaxDeductible.id],
    })
    await createTx({
        name: "Logo Design",
        type: TransactionType.INCOME,
        amount: 500,
        valueDate: daysAgo(14),
        accountId: primaryAccount.id,
        categoryId: freelance.id,
        tagIds: [tagOneTime.id],
    })

    // Investment returns (1 occurrence)
    await createTx({
        name: "ETF Dividend",
        type: TransactionType.INCOME,
        amount: 78.5,
        valueDate: daysAgo(11),
        accountId: secondaryAccount.id,
        categoryId: investmentsCat.id,
        description: "Quarterly dividend payment",
    })

    // Public transit monthly (3 months)
    for (const days of [87, 57, 27]) {
        await createTx({
            name: "Monthly Transit Pass",
            type: TransactionType.EXPENSE,
            amount: -89,
            valueDate: daysAgo(days),
            accountId: primaryAccount.id,
            categoryId: publicTransitCat.id,
            tagIds: [tagRecurring.id, tagTaxDeductible.id],
        })
    }

    // Occasional fuel (2 occurrences)
    await createTx({
        name: "Gas Station",
        type: TransactionType.EXPENSE,
        amount: -randomAmount(55, 70),
        valueDate: daysAgo(48),
        accountId: primaryAccount.id,
        categoryId: fuelCat.id,
        tagIds: [tagOneTime.id],
    })
    await createTx({
        name: "Gas Station",
        type: TransactionType.EXPENSE,
        amount: -randomAmount(55, 70),
        valueDate: daysAgo(15),
        accountId: primaryAccount.id,
        categoryId: fuelCat.id,
    })

    console.log("[seed]   Transactions created")

    // --- Transaction Templates ---
    const createTemplate = (data: {
        name: string
        description?: string
        type: TransactionType
        amount: number
        frequency: RecurrenceFrequency
        startDate: Date
        nextDueDate: Date
        accountId: string
        categoryId?: string
        counterpartyId?: string
    }) =>
        db.transactionTemplate.create({
            data: {
                ...data,
                householdId: household.id,
                createdById: userId,
                isActive: true,
            },
        })

    await createTemplate({
        name: "Monthly Salary",
        description: "Regular monthly salary from Acme Corp",
        type: TransactionType.INCOME,
        amount: 3500,
        frequency: RecurrenceFrequency.MONTHLY,
        startDate: daysAgo(90),
        nextDueDate: daysFromNow(5),
        accountId: primaryAccount.id,
        categoryId: salary.id,
        counterpartyId: cpEmployer.id,
    })

    await createTemplate({
        name: "Apartment Rent",
        description: "Monthly rent payment",
        type: TransactionType.EXPENSE,
        amount: 950,
        frequency: RecurrenceFrequency.MONTHLY,
        startDate: daysAgo(90),
        nextDueDate: daysFromNow(6),
        accountId: primaryAccount.id,
        categoryId: rentCat.id,
        counterpartyId: cpLandlord.id,
    })

    await createTemplate({
        name: "Electricity & Water",
        type: TransactionType.EXPENSE,
        amount: 120,
        frequency: RecurrenceFrequency.MONTHLY,
        startDate: daysAgo(90),
        nextDueDate: daysFromNow(9),
        accountId: primaryAccount.id,
        categoryId: utilitiesCat.id,
        counterpartyId: cpUtility.id,
    })

    await createTemplate({
        name: "Netflix Subscription",
        type: TransactionType.EXPENSE,
        amount: 13.99,
        frequency: RecurrenceFrequency.MONTHLY,
        startDate: daysAgo(75),
        nextDueDate: daysFromNow(19),
        accountId: primaryAccount.id,
        categoryId: streamingCat.id,
        counterpartyId: cpStreaming.id,
    })

    await createTemplate({
        name: "Gym Membership",
        type: TransactionType.EXPENSE,
        amount: 29.99,
        frequency: RecurrenceFrequency.MONTHLY,
        startDate: daysAgo(90),
        nextDueDate: daysFromNow(4),
        accountId: primaryAccount.id,
        categoryId: gymCat.id,
        counterpartyId: cpGym.id,
    })

    await createTemplate({
        name: "Health Insurance",
        type: TransactionType.EXPENSE,
        amount: 85,
        frequency: RecurrenceFrequency.MONTHLY,
        startDate: daysAgo(90),
        nextDueDate: daysFromNow(14),
        accountId: primaryAccount.id,
        categoryId: insuranceCat.id,
        counterpartyId: cpInsurance.id,
    })

    await createTemplate({
        name: "Monthly Transit Pass",
        type: TransactionType.EXPENSE,
        amount: 89,
        frequency: RecurrenceFrequency.MONTHLY,
        startDate: daysAgo(90),
        nextDueDate: daysFromNow(3),
        accountId: primaryAccount.id,
        categoryId: publicTransitCat.id,
    })

    await createTemplate({
        name: "Weekly Coffee",
        type: TransactionType.EXPENSE,
        amount: 6,
        frequency: RecurrenceFrequency.WEEKLY,
        startDate: daysAgo(90),
        nextDueDate: daysFromNow(0),
        accountId: primaryAccount.id,
        categoryId: coffeeCat.id,
    })

    console.log("[seed]   Transaction templates created")
}
