import { resolver } from "@blitzjs/rpc"
import db from "@/src/lib/db"
import { CreateCSVImportMappingSchema } from "../schemas"

export default resolver.pipe(
  resolver.zod(CreateCSVImportMappingSchema),
  resolver.authorize(),
  async (input) => {
      return db.cSVImportMapping.create({ data: input });
  }
);
