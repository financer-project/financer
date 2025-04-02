import { resolver } from "@blitzjs/rpc"
import db from "@/src/lib/db"
import { DeleteCSVImportMappingSchema } from "../schemas"

export default resolver.pipe(
  resolver.zod(DeleteCSVImportMappingSchema),
  resolver.authorize(),
  async ({ id }) => {
      return db.cSVImportMapping.deleteMany({
        where: { id },
    });
  }
);
