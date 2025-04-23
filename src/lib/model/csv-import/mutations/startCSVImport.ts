import { resolver } from "@blitzjs/rpc"
import db from "@/src/lib/db"
import { z } from "zod"
import { ImportStatus } from "@prisma/client"

const StartCSVImportSchema = z.object({
    id: z.string().uuid(),
})

export default resolver.pipe(
    resolver.zod(StartCSVImportSchema),
    resolver.authorize(),
    async ({ id }, ctx) => {
        // Get the CSV import
        const csvImport = await db.cSVImport.findFirst({
            where: { id },
            include: {
                CSVImportMapping: {
                    include: {
                        valueMappings: true
                    }
                }
            }
        })

        if (!csvImport) {
            throw new Error("CSV import not found")
        }

        // Check if the user has access to this import
        if (csvImport.userId !== ctx.session.userId) {
            throw new Error("You don't have access to this import")
        }

        // Check if the required mappings exist (household, account, valueDate, name)
        const requiredFields = ["household", "account", "valueDate", "name"]
        const mappedFields = csvImport.CSVImportMapping.map(mapping => mapping.fieldName)
        
        const missingFields = requiredFields.filter(field => !mappedFields.includes(field))
        if (missingFields.length > 0) {
            throw new Error(`Missing required mappings: ${missingFields.join(", ")}`)
        }

        // Update the import status to IN_PROGRESS
        return db.cSVImport.update({
            where: { id },
            data: {
                status: ImportStatus.IN_PROGRESS
            }
        })
    }
)