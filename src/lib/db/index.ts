import { enhancePrisma } from "blitz"
import { PrismaClient } from "@prisma/client"
import { Prisma } from ".prisma/client"

const EnhancedPrisma = enhancePrisma(PrismaClient)

function getLogDefinition(): (Prisma.LogLevel | Prisma.LogDefinition)[] | undefined {
    switch (process.env.LOG_LEVEL) {
        case "DEBUG":
            return ["info", "query", "error", "warn"]
        case "INFO":
            return ["info", "error", "warn"]
        case "WARNING":
            return ["warn", "error"]
        case "ERROR":
            return ["error"]
    }
}

export * from "@prisma/client"
const db = new EnhancedPrisma({
    log: getLogDefinition()
})
export default db
