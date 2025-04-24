import { resolver } from "@blitzjs/rpc"
import db from "@/src/lib/db"
import { z } from "zod"
import { ImportStatus } from "@prisma/client"

const CreateImportJobSchema = z.object({
    name: z.string().min(1),
    fileContent: z.string().optional(), // Base64 encoded CSV content
    fileName: z.string().optional(),
    separator: z.string().default(","), // CSV separator character
    householdId: z.string(),
    columnMappings: z.array(
        z.object({
            csvHeader: z.string(),
            fieldName: z.string()
        })
    ),
    valueMappings: z.array(
        z.object({
            sourceValue: z.string(),
            targetType: z.string(),
            targetId: z.string()
        })
    )
})

export default resolver.pipe(
    resolver.zod(CreateImportJobSchema),
    resolver.authorize(),
    async (input) => {
        // Create the import job
        const importJob = await db.importJob.create({
            data: {
                name: input.name,
                status: ImportStatus.DRAFT,
                fileContent: input.fileContent,
                fileName: input.fileName,
                separator: input.separator,
                household: {
                    connect: {
                        id: input.householdId
                    }
                }
            }
        })

        // Create column mappings
        if (input.columnMappings.length > 0) {
            await db.columnMapping.createMany({
                data: input.columnMappings.map(mapping => ({
                    csvHeader: mapping.csvHeader,
                    fieldName: mapping.fieldName,
                    importJobId: importJob.id
                }))
            })
        }

        // Create value mappings
        if (input.valueMappings.length > 0) {
            await db.valueMapping.createMany({
                data: input.valueMappings.map(mapping => ({
                    sourceValue: mapping.sourceValue,
                    targetType: mapping.targetType,
                    targetId: mapping.targetId,
                    importJobId: importJob.id
                }))
            })
        }

        return importJob
    }
)
