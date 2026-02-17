import { PrismaClient } from "@prisma/client"
import { seedDemoData } from "../src/lib/db/seedDemoData"

const db = new PrismaClient()

seedDemoData(db)
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await db.$disconnect()
    })
