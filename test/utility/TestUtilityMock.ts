import { TestUtilityBase } from "@/test/utility/TestUtility"
import { mockReset } from "vitest-mock-extended"
import db from "@/src/lib/db"
import { AuthenticatedCtx, AuthenticationError } from "blitz"
import { User } from "@prisma/client"
import { AuthenticatedSessionContext } from "@blitzjs/auth"
import { PrivateData } from "@/types"

export default class TestUtilityMock extends TestUtilityBase {
    async startDatabase(): Promise<void> {
        throw new Error("Method not implemented")
    }

    async stopDatabase(): Promise<void> {
        throw new Error("Method not implemented")
    }

    async resetDatabase(resetUsers?: boolean): Promise<void> {
        if (resetUsers) {
            mockReset(db)
        }
    }

    getMockContext(user: "standard" | "admin" | "none" = "standard", privateData?: PrivateData): AuthenticatedCtx {
        let userObject: User | null = null
        if (user === "standard") {
            userObject = this.getTestData().users.standard
        } else if (user === "admin") {
            userObject = this.getTestData().users.admin
        }

        const privateDataStorage: PrivateData = privateData ?? { currentHouseholdId: null }

        if (privateData) {
            Object.assign(privateDataStorage, privateData)
        }

        // Erstelle Closures für die dynamischen Werte
        let userId = userObject?.id ?? null
        let role = userObject?.role ?? null

        return {
            session: {
                get userId() {
                    return userId
                },
                get role() {
                    return role
                },
                $getPrivateData(): Promise<Record<any, any>> {
                    return Promise.resolve(privateDataStorage)
                },
                $setPrivateData(data: PrivateData) {
                    Object.assign(privateDataStorage, data)
                    return Promise.resolve()
                },
                $authorize(...args): asserts this is AuthenticatedSessionContext {
                    if (user === "none" || (args[0] && args[0] !== this.role)) {
                        throw new AuthenticationError("Authorization required.")
                    }
                },
                $revoke() {
                    userId = null
                    role = null
                },
                $create(publicData: Record<string, any>): Promise<void> {
                    userId = publicData.userId ?? null
                    role = publicData.role ?? null
                    return Promise.resolve()
                }
            }
        } as AuthenticatedCtx

    }

}