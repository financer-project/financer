import { z } from "zod"

export const getFindManySchema = <WhereType,OrderByType>() => z.object({
    where: z.custom<WhereType>().optional(),
    orderBy: z.custom<OrderByType | OrderByType[]>().optional(),
    skip: z.number().int().nonnegative().optional(),
    take: z.number().int().positive().max(500).optional()
})