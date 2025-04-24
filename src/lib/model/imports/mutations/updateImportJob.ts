import { resolver } from "@blitzjs/rpc"
import db from "@/src/lib/db"
import { z } from "zod"
import { ImportStatus } from "@prisma/client"

const UpdateImportJobSchema = z.object({
    id: z.string(),
    name: z.string().min(1).optional(),
    fileContent: z.string().optional(),
    fileName: z.string().optional(),
    separator: z.string().optional(),
    status: z.nativeEnum(ImportStatus).optional(),
    columnMappings: z.array(
        z.object({
            csvHeader: z.string(),
            fieldName: z.string()
        })
    ).optional(),
    valueMappings: z.array(
        z.object({
            sourceValue: z.string(),
            targetType: z.string(),
            targetId: z.string()
        })
    ).optional()
})

export default resolver.pipe(
    resolver.zod(UpdateImportJobSchema),
    resolver.authorize(),
    async (input) => {
        // Get the current import job
        const importJob = await db.importJob.findUnique({
            where: { id: input.id },
            include: {
                columnMappings: true,
                valueMappings: true
            }
        })

        if (!importJob) {
            throw new Error("Import job not found")
        }

        // Update the import job
        const updatedImportJob = await db.importJob.update({
            where: { id: input.id },
            data: {
                name: input.name,
                status: input.status,
                fileContent: input.fileContent,
                fileName: input.fileName,
                separator: input.separator
            }
        })

        // Update column mappings if provided
        if (input.columnMappings) {
            // Delete existing column mappings
            await db.columnMapping.deleteMany({
                where: { importJobId: input.id }
            })

            // Create new column mappings
            if (input.columnMappings.length > 0) {
                await db.columnMapping.createMany({
                    data: input.columnMappings.map(mapping => ({
                        csvHeader: mapping.csvHeader,
                        fieldName: mapping.fieldName,
                        importJobId: input.id
                    }))
                })
            }
        }

        // Update value mappings if provided
        if (input.valueMappings) {
            // Delete existing value mappings
            await db.valueMapping.deleteMany({
                where: { importJobId: input.id }
            })

            // Create new value mappings
            if (input.valueMappings.length > 0) {
                await db.valueMapping.createMany({
                    data: input.valueMappings.map(mapping => ({
                        sourceValue: mapping.sourceValue,
                        targetType: mapping.targetType,
                        targetId: mapping.targetId,
                        importJobId: input.id
                    }))
                })
            }
        }

        return updatedImportJob
    }
)
