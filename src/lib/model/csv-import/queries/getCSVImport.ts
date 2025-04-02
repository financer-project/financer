import { NotFoundError } from "blitz";
import { resolver } from "@blitzjs/rpc";
import db from "@/src/lib/db";
import { z } from "zod";

const GetCSVImport = z.object({
  // This accepts type of undefined, but is required at runtime
  id: z.number().optional().refine(Boolean, "Required"),
});

export default resolver.pipe(
  resolver.zod(GetCSVImport),
  resolver.authorize(),
  async ({ id }) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const cSVImport = await db.cSVImport.findFirst({ where: { id } });

    if (!cSVImport) throw new NotFoundError();

    return cSVImport;
  }
);
