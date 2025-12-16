import { resolver } from "@blitzjs/rpc"
import db from "@/src/lib/db"
import { z } from "zod"
import { ImportStatus } from "@prisma/client"
import { queueImportJob } from "@/src/lib/jobs"
import Guard from "@/src/lib/guard/ability"
import { NotFoundError } from "blitz"

const StartImportSchema = z.object({
    id: z.string()
})

export default resolver.pipe(
    resolver.zod(StartImportSchema),
    resolver.authorize(),
    Guard.authorizePipe("update", "ImportJob"),
    async (input) => {
        const job = await db.importJob.findUnique({ where: { id: input.id } })
        if (!job) throw new NotFoundError()
        if (job.status !== ImportStatus.DRAFT) {
            throw new Error(`Import job is already in ${job.status} state`)
        }

        const updatedImportJob = await db.importJob.update({
            where: { id: job.id },
            data: { status: ImportStatus.PENDING }
        })

        // Start the import process in the background using the job queue
        await queueImportJob(job.id)

        return updatedImportJob
    }
)
