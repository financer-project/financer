import { Ctx } from "blitz"

export default async function logout(_: undefined, ctx: Ctx) {
    return ctx.session.$revoke()
}
