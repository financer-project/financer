import { resolver } from "@blitzjs/rpc"
import db from "@/src/lib/db"
import { z } from "zod"
import { ImportStatus } from "@prisma/client"
import * as path from "node:path"
import * as fs from "node:fs"
import Papa from "papaparse"

const ExecuteCSVImportSchema = z.object({
    id: z.string().uuid(),
})

export default resolver.pipe(
    resolver.zod(ExecuteCSVImportSchema),
    resolver.authorize(),
    async ({ id }, ctx) => {
        // Get the CSV import with all mappings
        const csvImport = await db.cSVImport.findFirst({
            where: { id },
            include: {
                CSVImportMapping: {
                    include: {
                        valueMappings: true
                    }
                }
            }
        })

        if (!csvImport) {
            throw new Error("CSV import not found")
        }

        // Check if the user has access to this import
        if (csvImport.userId !== ctx.session.userId) {
            throw new Error("You don't have access to this import")
        }

        // Check if the import is in the correct status
        if (csvImport.status !== ImportStatus.IN_PROGRESS) {
            throw new Error("Import is not in progress")
        }

        try {
            // Read the CSV file
            const importFolder = path.join(process.cwd(), "data", "imports", csvImport.id)
            const filePath = path.join(importFolder, "import.csv")
            const fileString = await fs.promises.readFile(filePath, "utf-8")

            // Parse the CSV file
            const parseResult = Papa.parse(fileString, {
                header: true,
                skipEmptyLines: true
            })

            if (parseResult.errors?.length > 0) {
                throw new Error(`CSV parsing error: ${parseResult.errors[0].message}`)
            }

            // Create a mapping from column names to field names
            const columnToFieldMap = new Map()
            csvImport.CSVImportMapping.forEach(mapping => {
                columnToFieldMap.set(mapping.columnName, mapping.fieldName)
            })

            // Create a mapping from original values to mapped values for each field
            const valueMappings = new Map()
            csvImport.CSVImportMapping.forEach(mapping => {
                const fieldValueMap = new Map()
                mapping.valueMappings.forEach(valueMapping => {
                    fieldValueMap.set(valueMapping.originalValue, valueMapping.mappedValue)
                })
                valueMappings.set(mapping.fieldName, fieldValueMap)
            })

            // Process each row in the CSV
            const transactions = []
            for (const row of parseResult.data) {
                const transaction = {}

                // Map each column to its corresponding field
                for (const [columnName, value] of Object.entries(row)) {
                    const fieldName = columnToFieldMap.get(columnName)
                    if (!fieldName) continue

                    // Apply value mapping if available
                    const fieldValueMap = valueMappings.get(fieldName)
                    if (fieldValueMap && fieldValueMap.has(value)) {
                        transaction[fieldName] = fieldValueMap.get(value)
                    } else {
                        transaction[fieldName] = value
                    }
                }

                // Ensure required fields are present
                if (!transaction["name"] || !transaction["account"] || !transaction["valueDate"]) {
                    continue
                }

                transactions.push(transaction)
            }

            // Create transactions in the database
            for (const transaction of transactions) {
                await db.transaction.create({
                    data: {
                        name: transaction["name"],
                        amount: parseFloat(transaction["amount"] || "0"),
                        valueDate: new Date(transaction["valueDate"]),
                        description: transaction["description"],
                        type: transaction["type"] || "EXPENSE",
                        account: {
                            connect: {
                                id: transaction["account"]
                            }
                        },
                        category: transaction["category"] ? {
                            connect: {
                                id: transaction["category"]
                            }
                        } : undefined
                    }
                })
            }

            // Update the import status to COMPLETED
            return db.cSVImport.update({
                where: { id },
                data: {
                    status: ImportStatus.COMPLETED
                }
            })
        } catch (error) {
            // Update the import status to FAILED
            await db.cSVImport.update({
                where: { id },
                data: {
                    status: ImportStatus.FAILED
                }
            })
            throw error
        }
    }
)