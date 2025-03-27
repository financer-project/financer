import { setupBlitzServer } from "@blitzjs/next"
import { AuthServerPlugin, PrismaStorage, simpleRolesIsAuthorized } from "@blitzjs/auth"
import db from "src/lib/db"
import { BlitzLogger } from "blitz"
import { RpcServerPlugin } from "@blitzjs/rpc"
import { authConfig } from "./blitz-auth-config"

function getLogLevel(): number {
    switch (process.env.NODE_ENV) {
        case "development":
            return 2
        case "production":
            return 3
        case "test":
            return 4
    }
}

const { api, invoke, withBlitzAuth } = setupBlitzServer({
    plugins: [
        AuthServerPlugin({
            ...authConfig,
            storage: PrismaStorage(db),
            isAuthorized: simpleRolesIsAuthorized
        }),
        RpcServerPlugin({})
    ],
    logger: BlitzLogger({
        type: "pretty",
        minLevel: getLogLevel()
    })
})

export { api, invoke, withBlitzAuth }
