import { resolver } from "@blitzjs/rpc"
import db from "@/src/lib/db"
import { z } from "zod"
import { ImportStatus } from "@prisma/client"
import { queueImportJob } from "@/src/lib/jobs"

const StartImportSchema = z.object({
    id: z.string()
})

export default resolver.pipe(
    resolver.zod(StartImportSchema),
    resolver.authorize(),
    async (input) => {
        // Get the import job
        const importJob = await db.importJob.findUnique({
            where: { id: input.id }
        })

        if (!importJob) {
            throw new Error("Import job not found")
        }

        // Check if the import job is in a valid state to start
        if (importJob.status !== ImportStatus.DRAFT) {
            throw new Error(`Import job is already in ${importJob.status} state`)
        }

        // Update the import job status to PENDING
        const updatedImportJob = await db.importJob.update({
            where: { id: input.id },
            data: { status: ImportStatus.PENDING }
        })

        // Start the import process in the background using the job queue
        await queueImportJob(input.id)

        return updatedImportJob
    }
)
