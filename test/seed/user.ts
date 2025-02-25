import { Role, User } from "@prisma/client"
import db from "@/src/lib/db"
import { SecurePassword } from "@blitzjs/auth/secure-password"

export interface UserSeed {
    standard: User
    admin: User
}

export default async function seedUsers(): Promise<UserSeed> {
    const hashedPassword = await SecurePassword.hash("password")

    const adminUser = await db.user.create({
        data: {
            email: "admin@financer.com",
            hashedPassword: hashedPassword,
            firstName: "Test",
            lastName: "User",
            role: Role.ADMIN
        }
    })
    const standardUser = await db.user.create({
        data: {
            email: "user@financer.com",
            hashedPassword: hashedPassword,
            firstName: "Test",
            lastName: "User"
        }
    })

    return {
        standard: standardUser,
        admin: adminUser
    }
}