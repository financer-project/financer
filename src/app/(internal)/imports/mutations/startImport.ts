import { resolver } from "@blitzjs/rpc"
import db from "@/src/lib/db"
import { z } from "zod"
import { ImportStatus } from "@prisma/client"
import { processImport } from "../services/importProcessor"

const StartImportSchema = z.object({
  id: z.string()
})

export default resolver.pipe(
  resolver.zod(StartImportSchema),
  resolver.authorize(),
  async (input, ctx) => {
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

    // Start the import process in the background
    // In a production environment, this would be handled by a job queue
    // For simplicity, we're just using a setTimeout to run it asynchronously
    setTimeout(() => {
      processImport(input.id).catch(error => {
        console.error("Error processing import:", error)
      })
    }, 100)

    return updatedImportJob
  }
)