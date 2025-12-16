import { AbilitiesParamsType, GuardBuilder } from "@blitz-guard/core"
import { HouseholdRole, Prisma, Role } from "@prisma/client"
import { Ctx } from "blitz"
import db from "@/src/lib/db"

// Define the resources and abilities
type Resource = Prisma.ModelName

export type Ability =
    | "create"
    | "read"
    | "update"
    | "delete"
    | "manage" // Special ability that includes all others
    | "invite" // Special ability for inviting users to a household

const Guard = GuardBuilder<Resource, Ability>(
    async (ctx, { can, cannot }) => {
        if (ctx.session.$isAuthorized()) {
            switch (ctx.session.role) {
                case Role.ADMIN:
                    admin(ctx, { can, cannot })
                    break
                case Role.USER:
                    user(ctx, { can, cannot })
                    break
            }
        }
    }
)


async function admin(ctx: Ctx, { can }: AbilitiesParamsType<Resource, Ability>) {
    can("manage", "all")
}

async function user(ctx: Ctx, { can, cannot }: AbilitiesParamsType<Resource, Ability>) {
    cannot("manage", "all")

    const isMemberOfHousehold = async (householdId: string, role?: HouseholdRole) => {
        let roles: HouseholdRole[]

        switch (role) {
            case HouseholdRole.OWNER:
                roles = [HouseholdRole.OWNER]
                break
            case Role.ADMIN:
                roles = [HouseholdRole.ADMIN, HouseholdRole.OWNER]
                break
            case HouseholdRole.MEMBER:
                roles = [HouseholdRole.MEMBER, HouseholdRole.ADMIN, HouseholdRole.OWNER]
                break
            case HouseholdRole.GUEST:
                roles = [HouseholdRole.GUEST, HouseholdRole.MEMBER, HouseholdRole.ADMIN, HouseholdRole.OWNER]
                break
            default:
                roles = []
        }

        return !!(await db.household.findFirst({
            where: {
                id: householdId,
                members: {
                    some: {
                        userId: ctx.session.userId!,
                        role: { in: roles }
                    }
                }
            }
        }))
    }

    const isMemberOfHouseholdWrapper = (role?: HouseholdRole) => {
        return async ({ householdId }: { householdId: string }) => isMemberOfHousehold(householdId, role)
    }

    const household = () => {
        can("create", "Household")
        can("read", "Household", async ({ id }: { id: string }) => isMemberOfHousehold(id, HouseholdRole.GUEST))

        const isAdminOfHousehold = async ({ id }: { id: string }) => isMemberOfHousehold(id, HouseholdRole.ADMIN)
        can("update", "Household", isAdminOfHousehold)
        can("delete", "Household", isAdminOfHousehold)
        can("invite", "Household", isAdminOfHousehold)
    }

    const categories = () => {
        const isCategoryPartOfHousehold = (role?: HouseholdRole) => {
            return async ({ id }: { id: string }) => {
                const category = await db.category.findFirst({ where: { id } })
                return category ? isMemberOfHousehold(category.householdId, role) : false
            }
        }
        can("create", "Category", isMemberOfHouseholdWrapper(HouseholdRole.ADMIN))
        can("read", "Category", isCategoryPartOfHousehold(HouseholdRole.GUEST))
        can("update", "Category", isCategoryPartOfHousehold(HouseholdRole.ADMIN))
        can("delete", "Category", isCategoryPartOfHousehold(HouseholdRole.ADMIN))
    }

    const accounts = () => {
        const isAccountPartOfHousehold = (role?: HouseholdRole) => {
            return async ({ id }: { id: string }) => {
                const account = await db.account.findFirst({ where: { id } })
                return account ? isMemberOfHousehold(account.householdId, role) : false
            }
        }

        can("create", "Account", isMemberOfHouseholdWrapper(HouseholdRole.ADMIN))
        can("read", "Account", isAccountPartOfHousehold(HouseholdRole.GUEST))
        can("update", "Account", isAccountPartOfHousehold(HouseholdRole.ADMIN))
        can("delete", "Account", isAccountPartOfHousehold(HouseholdRole.ADMIN))
    }

    const counterparties = () => {
        const isAccountPartOfHousehold = (role?: HouseholdRole) => {
            return async ({ id }: { id: string }) => {
                const counterparty = await db.counterparty.findFirst({ where: { id } })
                return counterparty ? isMemberOfHousehold(counterparty.householdId, role) : false
            }
        }

        can("create", "Counterparty", isMemberOfHouseholdWrapper(HouseholdRole.ADMIN))
        can("read", "Counterparty", isAccountPartOfHousehold(HouseholdRole.GUEST))
        can("update", "Counterparty", isAccountPartOfHousehold(HouseholdRole.ADMIN))
        can("delete", "Counterparty", isAccountPartOfHousehold(HouseholdRole.ADMIN))
    }

    const tags = () => {
        const isAccountPartOfHousehold = (role?: HouseholdRole) => {
            return async ({ id }: { id: string }) => {
                const tag = await db.tag.findFirst({ where: { id } })
                return tag ? isMemberOfHousehold(tag.householdId, role) : false
            }
        }

        can("create", "Tag", isMemberOfHouseholdWrapper(HouseholdRole.ADMIN))
        can("read", "Tag", isAccountPartOfHousehold(HouseholdRole.GUEST))
        can("update", "Tag", isAccountPartOfHousehold(HouseholdRole.ADMIN))
        can("delete", "Tag", isAccountPartOfHousehold(HouseholdRole.ADMIN))
    }

    const transactions = () => {
        const isTransactionPartOfHousehold = (role?: HouseholdRole) => {
            return async ({ id }: { id: string }) => {
                const transaction = await db.transaction.findFirst({ where: { id }, include: { account: true } })
                return transaction ? isMemberOfHousehold(transaction.account.householdId, role) : false
            }
        }

        can("create", "Transaction", isMemberOfHouseholdWrapper(HouseholdRole.MEMBER))
        can("read", "Transaction", isTransactionPartOfHousehold(HouseholdRole.GUEST))
        can("update", "Transaction", isTransactionPartOfHousehold(HouseholdRole.MEMBER))
        can("delete", "Transaction", isTransactionPartOfHousehold(HouseholdRole.MEMBER))
    }

    const importJobs = () => {
        const isImportJobPartOfHousehold = (role?: HouseholdRole) => {
            return async ({ id }: { id: string }) => {
                const importJob = await db.importJob.findFirst({ where: { id } })
                return importJob ? isMemberOfHousehold(importJob.householdId, role) : false
            }
        }

        can("create", "ImportJob", isMemberOfHouseholdWrapper(HouseholdRole.MEMBER))
        can("read", "ImportJob", isImportJobPartOfHousehold(HouseholdRole.GUEST))
        can("update", "ImportJob", isImportJobPartOfHousehold(HouseholdRole.MEMBER))
        can("delete", "ImportJob", isImportJobPartOfHousehold(HouseholdRole.MEMBER))
    }

    household()
    categories()
    accounts()
    counterparties()
    tags()
    transactions()
    importJobs()
}

export default Guard
