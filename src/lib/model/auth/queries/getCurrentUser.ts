import { Ctx } from "blitz"
import db from "@/src/lib/db"

export default async function getCurrentUser(_: null, ctx: Ctx) {
    if (!ctx.session.userId) return null
    return db.user.findFirst({
        where: { id: ctx.session.userId },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            settings: true
        }
    })
}
