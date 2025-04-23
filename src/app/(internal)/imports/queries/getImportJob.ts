import { resolver } from "@blitzjs/rpc"
import db from "@/src/lib/db"
import { z } from "zod"

const GetImportJobSchema = z.object({
  id: z.string()
})

export default resolver.pipe(
  resolver.zod(GetImportJobSchema),
  resolver.authorize(),
  async (input, ctx) => {
    // Get the import job with its related data
    const importJob = await db.importJob.findUnique({
      where: { id: input.id },
      include: {
        columnMappings: true,
        valueMappings: true,
        transactions: true
      }
    })

    if (!importJob) {
      throw new Error("Import job not found")
    }

    return importJob
  }
)