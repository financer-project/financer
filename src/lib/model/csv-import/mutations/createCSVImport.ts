import { resolver } from "@blitzjs/rpc"
import db from "@/src/lib/db"
import Papa from "papaparse"
import { CreateCSVImportSchema } from "../schemas"
import { CSVImport, ImportStatus } from "@prisma/client"
import * as path from "node:path"
import * as fs from "node:fs"

type CSVImportData = {
    columns: string[]
    rowCount: number
}

export default resolver.pipe(
    resolver.zod(CreateCSVImportSchema),
    resolver.authorize(),
    async ({ fileString, originalFileName, householdId, ...input }, ctx) => {
        const importData = parseCSVFile(fileString)
        const csvImport = await db.cSVImport.create({
            data: {
                originalFileName: originalFileName,
                userId: ctx.session.userId,
                householdId,
                status: ImportStatus.DRAFT,
                rowCount: importData.rowCount,
                columns: importData.columns,
                ...input
            }
        })

        await storeCSVFile(fileString, csvImport)

        return csvImport
    }
)

async function storeCSVFile(fileString: string, csvImport: CSVImport) {
    const importFolder = path.join(process.cwd(), "data", "imports", csvImport.id)
    await fs.promises.mkdir(importFolder, { recursive: true })

    const filePath = path.join(importFolder, "import.csv")

    await fs.promises.writeFile(filePath, fileString, "utf-8")
}

function parseCSVFile(fileString: string): CSVImportData {
    const parseResult = Papa.parse(fileString, {
        header: true,
        skipEmptyLines: true
    })

    if (parseResult.errors?.length > 0) {
        throw new Error(`CSV parsing error: ${parseResult.errors[0].message}`)
    }

    const columns = parseResult.meta.fields || []
    const rowCount = parseResult.data.length

    return {
        columns,
        rowCount
    }
}