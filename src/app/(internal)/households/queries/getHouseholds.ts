import { paginate } from "blitz"
import { resolver } from "@blitzjs/rpc"
import db, { Prisma } from "db"

interface GetHouseholdsInput
  extends Pick<Prisma.HouseholdFindManyArgs, "where" | "orderBy" | "skip" | "take"> {}

export default resolver.pipe(
  resolver.authorize(),
  async ({ where, orderBy, skip = 0, take = 100 }: GetHouseholdsInput) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const {
      items: households,
      hasMore,
      nextPage,
      count,
    } = await paginate({
      skip,
      take,
      count: () => db.household.count({ where }),
      query: (paginateArgs) => db.household.findMany({ ...paginateArgs, where, orderBy }),
    })

    return {
      households,
      nextPage,
      hasMore,
      count,
    }
  },
)
