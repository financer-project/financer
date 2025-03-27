import { enhancePrisma } from "blitz"
import { PrismaClient } from "@prisma/client"

const EnhancedPrisma = enhancePrisma(PrismaClient)

export * from "@prisma/client"
const db = new EnhancedPrisma({
    log: process.env.NODE_ENV === "development" ? ["info", "query", "error", "warn"] : ["info", "error", "warn"]
})
export default db
