import { paginate } from "blitz";
import { resolver } from "@blitzjs/rpc";
import db, { Prisma } from "db";

interface GetCSVImportsInput
  extends Pick<
    Prisma.CSVImportFindManyArgs,
    "where" | "orderBy" | "skip" | "take"
  > {}

export default resolver.pipe(
  resolver.authorize(),
  async ({ where, orderBy, skip = 0, take = 100 }: GetCSVImportsInput) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const {
      items: cSVImports,
      hasMore,
      nextPage,
      count,
    } = await paginate({
      skip,
      take,
      count: () => db.cSVImport.count({ where }),
      query: (paginateArgs) =>
        db.cSVImport.findMany({ ...paginateArgs, where, orderBy }),
    });

    return {
      cSVImports,
      nextPage,
      hasMore,
      count,
    };
  }
);
