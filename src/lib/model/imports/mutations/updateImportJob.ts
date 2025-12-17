import { resolver } from "@blitzjs/rpc"
import db from "@/src/lib/db"
import { z } from "zod"
import { ImportStatus } from "@prisma/client"
import Guard from "@/src/lib/guard/ability"
import { NotFoundError } from "blitz"

const UpdateImportJobSchema = z.object({
    id: z.string(),
    name: z.string().min(1).optional(),
    filePath: z.string().optional(),
    fileName: z.string().optional(),
    separator: z.string().optional(),
    status: z.enum(ImportStatus).optional(),
    columnMappings: z.array(
        z.object({
            csvHeader: z.string(),
            fieldName: z.string(),
            format: z.string().optional()
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
    Guard.authorizePipe("update", "ImportJob"),
    async (input) => {
        const job = await db.importJob.findUnique({
            where: { id: input.id },
            include: { columnMappings: true, valueMappings: true }
        })
        if (!job) throw new NotFoundError()

        // Update the import job
        const updatedImportJob = await db.importJob.update({
            where: { id: input.id },
            data: {
                name: input.name,
                status: input.status,
                filePath: input.filePath,
                fileName: input.fileName,
                separator: input.separator
            }
        })

        // Update column mappings if provided
        if (input.columnMappings) {
            await db.columnMapping.deleteMany({ where: { importJobId: input.id } })
            if (input.columnMappings.length > 0) {
                await db.columnMapping.createMany({
                    data: input.columnMappings.map(mapping => ({
                        csvHeader: mapping.csvHeader,
                        fieldName: mapping.fieldName,
                        format: mapping.format,
                        importJobId: input.id
                    }))
                })
            }
        }

        // Update value mappings if provided
        if (input.valueMappings) {
            await db.valueMapping.deleteMany({ where: { importJobId: input.id } })
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
