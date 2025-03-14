import { SimpleRolesIsAuthorized } from "@blitzjs/auth"
import { User, Household } from "src/lib/db"

export type Role = "ADMIN" | "USER"

export interface PrivateData {
    currentHouseholdId: Household["id"] | null
}

declare module "@blitzjs/auth" {
    export interface Session {
        isAuthorized: SimpleRolesIsAuthorized<Role>
        PublicData: {
            userId: User["id"]
            role: Role
        },
        PrivateData: PrivateData
    }
}
