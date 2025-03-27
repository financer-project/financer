import { withBlitz } from "@blitzjs/next"
import { NextConfig } from "next"

const nextConfig: NextConfig = {
    experimental: {
        typedRoutes: true,
        forceSwcTransforms: true
    },
    output: "standalone",
    webpack: (config, { isServer }) => {
        if (isServer) {
            // Avoid bundling native dependencies
            config.externals = [...config.externals, "secure-password", "@prisma/client"]
        }

        if (!isServer) {
            config.module.rules.push({
                test: /\.(ts|tsx)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "babel-loader",
                        options: {
                            plugins: ["istanbul"]
                        }
                    }
                ]
            })
        }
        return config
    }
}

export default withBlitz(nextConfig)
