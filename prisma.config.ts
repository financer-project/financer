import { defineConfig } from "prisma/config"

export default defineConfig({
    earlyAccess: true,
    schema: {
        kind: "multi",
        folderPath: "src/lib/db/schema/"
    }
})