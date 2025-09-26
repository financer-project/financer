import { resolver } from "@blitzjs/rpc"
import db from "@/src/lib/db"
import { z } from "zod"
import { ImportStatus } from "@prisma/client"

const CreateImportJobSchema = z.object({
    name: z.string().min(1),
    filePath: z.string().optional(), // Path to the CSV file on disk
    fileName: z.string().optional(),
    separator: z.string().default(","), // CSV separator character
    householdId: z.string(),
    columnMappings: z.array(
        z.object({
            csvHeader: z.string(),
            fieldName: z.string(),
            format: z.string().nullable()
        })
    ),
    valueMappings: z.array(
        z.object({
            sourceValue: z.string(),
            targetType: z.string(),
            targetId: z.uuid()
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
                filePath: input.filePath,
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
                    format: mapping.format,
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
