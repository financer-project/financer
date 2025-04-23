import { resolver } from "@blitzjs/rpc"
import db from "@/src/lib/db"
import { z } from "zod"
import { Prisma } from "@prisma/client"

const GetImportJobsSchema = z.object({
  householdId: z.string().optional(),
  status: z.string().optional(),
  skip: z.number().optional(),
  take: z.number().optional(),
  orderBy: z.string().optional()
})

export default resolver.pipe(
  resolver.zod(GetImportJobsSchema),
  resolver.authorize(),
  async (input, ctx) => {
    // Prepare the where clause
    const where: Prisma.ImportJobWhereInput = {}
    
    if (input.householdId) {
      where.householdId = input.householdId
    }
    
    if (input.status) {
      where.status = input.status
    }
    
    // Prepare the orderBy clause
    let orderBy: Prisma.ImportJobOrderByWithRelationInput = { createdAt: "desc" }
    
    if (input.orderBy === "name") {
      orderBy = { name: "asc" }
    } else if (input.orderBy === "status") {
      orderBy = { status: "asc" }
    }
    
    // Get the import jobs
    const importJobs = await db.importJob.findMany({
      where,
      orderBy,
      skip: input.skip || 0,
      take: input.take || 50,
      include: {
        columnMappings: true,
        valueMappings: true,
        _count: {
          select: {
            transactions: true
          }
        }
      }
    })
    
    // Get the total count
    const count = await db.importJob.count({ where })
    
    return {
      importJobs,
      count
    }
  }
)