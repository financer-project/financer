import { withBlitz } from "@blitzjs/next"
import { NextConfig } from "next"

const nextConfig: NextConfig = {
    experimental: {
        typedRoutes: true
    },
    output: "standalone",
    webpack: (config, { isServer }) => {
        if (isServer) {
            // Avoid bundling native dependencies
            config.externals = [...config.externals, "secure-password", "@prisma/client"]
        }
        return config
    }

}

export default withBlitz(nextConfig)
