import { TestUtilityBase } from "@/test/utility/TestUtility"
import { mockReset } from "vitest-mock-extended"
import db from "@/src/lib/db"
import { AuthenticatedCtx, AuthenticationError } from "blitz"
import { User } from "@prisma/client"
import { AuthenticatedSessionContext } from "@blitzjs/auth"

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

    getMockContext(user: "standard" | "admin" | "none" = "standard"): AuthenticatedCtx {
        let userObject: User | null = null
        if (user === "standard") {
            userObject = this.getTestData().users.standard
        } else if (user === "admin") {
            userObject = this.getTestData().users.admin
        }

        return {
            session: {
                userId: userObject?.id ?? null,
                role: userObject?.role ?? null,
                $authorize(...args): asserts this is AuthenticatedSessionContext {
                    if (user === "none" || (args[0] && args[0] !== this.role)) {
                        throw new AuthenticationError("Authorization required.")
                    }
                }
            }
        } as AuthenticatedCtx
    }

}