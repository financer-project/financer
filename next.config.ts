import { withBlitz } from "@blitzjs/next"
import { NextConfig } from "next"

const nextConfig: NextConfig = {
    experimental: {
        typedRoutes: true
    },
    output: "standalone"
}

export default withBlitz(nextConfig)
