import { setupBlitzServer } from "@blitzjs/next"
import { AuthServerPlugin, PrismaStorage, simpleRolesIsAuthorized } from "@blitzjs/auth"
import db from "src/lib/db"
import { BlitzLogger } from "blitz"
import { RpcServerPlugin } from "@blitzjs/rpc"
import { authConfig } from "./blitz-auth-config"

function getLogLevel() {
    switch (process.env.LOG_LEVEL) {
        case "DEBUG":
            return 2
        case "INFO":
            return 3
        case "WARNING":
            return 4
        case "ERROR":
            return 5
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
        minLevel: getLogLevel(),
        prefix: ["[blitz]"]
    })
})

export { api, invoke, withBlitzAuth }
