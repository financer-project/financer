import { paginate } from "blitz";
import { resolver } from "@blitzjs/rpc";
import db, { Prisma } from "@/db";

interface GetAccountsInput
  extends Pick<
    Prisma.AccountFindManyArgs,
    "where" | "orderBy" | "skip" | "take"
  > {}

export default resolver.pipe(
  resolver.authorize(),
  async ({ where, orderBy, skip = 0, take = 100 }: GetAccountsInput) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const {
      items: accounts,
      hasMore,
      nextPage,
      count,
    } = await paginate({
      skip,
      take,
      count: () => db.account.count({ where }),
      query: (paginateArgs) =>
        db.account.findMany({ ...paginateArgs, where, orderBy }),
    });

    return {
      accounts,
      nextPage,
      hasMore,
      count,
    };
  }
);
