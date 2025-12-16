import { defineConfig, env } from "prisma/config"

export default defineConfig({
    schema: "src/lib/db/schema/",
    migrations: {
        path: "src/lib/db/schema/migrations"
    },
    datasource: {
        url: env("DATABASE_URL")
    },
})