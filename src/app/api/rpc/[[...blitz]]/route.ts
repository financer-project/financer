import { rpcAppHandler } from "@blitzjs/rpc"
import { withBlitzAuth } from "src/app/blitz-server"

export const {GET, HEAD, POST} = withBlitzAuth(rpcAppHandler({
    logging: {
        verbose: process.env.NODE_ENV === "development",
        disablelevel: process.env.NODE_ENV !== "development" ? "info" : undefined
    }
}))
