import { Category } from ".prisma/client"
import db from "@/src/lib/db"
import { CategoryType, Household } from "@prisma/client"
import { HouseholdSeed } from "@/test/seed/households"

export interface CategorySeed {
    standard: {
        income: Category,
        livingCosts: Category
    },
    admin: {
        income: Category,
        livingCosts: Category
    }
}

export default async function seedCategories(households: HouseholdSeed): Promise<CategorySeed> {
    const createIncome = async (household: Household) => db.category.create({
        data: {
            name: "Income",
            type: CategoryType.INCOME,
            color: "teal",
            household: { connect: { id: household.id } }
        }
    })

    const createLivingCost = async (household: Household) => db.category.create({
        data: {
            name: "Cost of Living",
            type: CategoryType.EXPENSE,
            color: "teal",
            household: { connect: { id: household.id } }
        }
    })

    return {
        standard: {
            income: await createIncome(households.standard),
            livingCosts: await createLivingCost(households.standard)
        },
        admin: {
            income: await createIncome(households.admin),
            livingCosts: await createLivingCost(households.admin)
        }
    }
}