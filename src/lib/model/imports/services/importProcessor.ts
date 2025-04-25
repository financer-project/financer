import db from "@/src/lib/db"
import { ImportStatus, TransactionType } from "@prisma/client"
import { TransactionModel } from "@/src/lib/model/transactions/queries/getTransaction"
import { readImportFile } from "@/src/lib/util/fileStorage"
import { parse, format } from "date-fns"

interface ColumnMapping {
    csvHeader: string
    fieldName: string
    format: string | null
}

interface ValueMapping {
    sourceValue: string
    targetType: string
    targetId: string
}

/**
 * Process an import job in the background
 */
export async function processImport(importJobId: string): Promise<void> {
    try {
        // Get the import job with its mappings
        const importJob = await db.importJob.findUnique({
            where: { id: importJobId },
            include: {
                columnMappings: true,
                valueMappings: true
            }
        })

        if (!importJob) {
            throw new Error(`Import job ${importJobId} not found`)
        }

        // Update the import job status to PROCESSING
        await db.importJob.update({
            where: { id: importJobId },
            data: { status: ImportStatus.PROCESSING }
        })

        // Parse the CSV data
        if (!importJob.filePath) {
            throw new Error("No file path to process")
        }

        // Get the separator from the import job or use comma as default
        const separator = importJob.separator || ","

        // Read the file from the filesystem
        const fileContent = readImportFile(importJob.filePath)
        const lines = fileContent.split("\n").filter(line => line.trim() !== "")
        const headers = lines[0].split(separator).map(header => header.trim())
        const rows = lines.slice(1).map(line => line.split(separator).map(cell => cell.trim()))

        // Update the import job with the total number of rows
        await db.importJob.update({
            where: { id: importJobId },
            data: {
                totalRows: rows.length,
                processedRows: 0
            }
        })

        // Create a mapping of field names to column indices
        const fieldToColumnIndex = new Map<string, number>()
        importJob.columnMappings.forEach(mapping => {
            const columnIndex = headers.indexOf(mapping.csvHeader)
            if (columnIndex >= 0) {
                fieldToColumnIndex.set(mapping.fieldName, columnIndex)
            }
        })

        // Create a mapping of source values to target IDs
        const valueToTargetId = new Map<string, { type: string, id: string }>()
        importJob.valueMappings.forEach(mapping => {
            valueToTargetId.set(mapping.sourceValue, {
                type: mapping.targetType,
                id: mapping.targetId
            })
        })

        // Process each row
        const transactions: TransactionModel[] = []
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i]

            // Extract transaction data from the row
            const transaction: TransactionModel = {
                name: row[fieldToColumnIndex.get("name") ?? 0] || "Unnamed Transaction",
                type: TransactionType.EXPENSE,
                valueDate:  new Date(),
                description: row[fieldToColumnIndex.get("description") ?? 0] || null,
            }

            // Parse the amount with the specified format
            if (fieldToColumnIndex.has("amount")) {
                const amountIndex = fieldToColumnIndex.get("amount")
                if (amountIndex !== undefined) {
                    const amountString = row[amountIndex]
                    if (amountString) {
                        // Find the column mapping for the amount
                        const amountMapping = importJob.columnMappings.find(
                            mapping => mapping.fieldName === "amount"
                        )

                        try {
                            // Process the amount string based on the format
                            let processedAmount = amountString

                            if (amountMapping?.format === "dot") {
                                // Format: 1.234,56 (dot as thousands separator, comma as decimal)
                                // Convert to 1234.56 for parseFloat
                                processedAmount = amountString.replace(/\./g, "").replace(",", ".")
                            } else if (amountMapping?.format === "comma" || !amountMapping?.format) {
                                // Format: 1,234.56 (comma as thousands separator, dot as decimal)
                                // Just remove commas for parseFloat
                                processedAmount = amountString.replace(/,/g, "")
                            }

                            transaction.amount = parseFloat(processedAmount)

                            // If parsing results in NaN, use 0
                            if (isNaN(transaction.amount)) {
                                console.warn(`Failed to parse amount: ${amountString} with format: ${amountMapping?.format}`)
                                transaction.amount = 0
                            }
                        } catch (e) {
                            console.warn(`Error parsing amount: ${amountString}`, e)
                            transaction.amount = 0
                        }
                    } else {
                        transaction.amount = 0
                    }
                } else {
                    transaction.amount = 0
                }
            } else {
                transaction.amount = 0
            }

            // Set the value date if available
            if (fieldToColumnIndex.has("valueDate")) {
                const valueDateIndex = fieldToColumnIndex.get("valueDate")
                if (valueDateIndex !== undefined) {
                    const dateString = row[valueDateIndex]
                    if (dateString) {
                        // Find the column mapping for the value date
                        const valueDateMapping = importJob.columnMappings.find(
                            mapping => mapping.fieldName === "valueDate"
                        )

                        // Try to parse the date using the specified format
                        try {
                            if (valueDateMapping?.format) {
                                // Use date-fns to parse the date with the specified format
                                transaction.valueDate = parse(dateString, valueDateMapping.format, new Date())
                            } else {
                                // Fallback to default parsing if no format is specified
                                transaction.valueDate = new Date(dateString)
                            }
                        } catch (e) { // eslint-disable-line @typescript-eslint/no-unused-vars
                            // If date parsing fails, use current date
                            console.warn(`Failed to parse date: ${dateString} with format: ${valueDateMapping?.format}`)
                            transaction.valueDate = new Date()
                        }
                    }
                }
            }

            // Set the transaction type if available
            if (fieldToColumnIndex.has("type")) {
                const typeIndex = fieldToColumnIndex.get("type")
                if (typeIndex !== undefined) {
                    const typeString = row[typeIndex]?.toUpperCase()
                    if (typeString === "INCOME") {
                        transaction.type = TransactionType.INCOME
                    } else if (typeString === "TRANSFER") {
                        transaction.type = TransactionType.TRANSFER
                        transaction.isTransfer = true
                    }
                }
            }

            // Set the account ID if available
            if (fieldToColumnIndex.has("accountIdentifier")) {
                const accountIdentifierIndex = fieldToColumnIndex.get("accountIdentifier")
                if (accountIdentifierIndex !== undefined) {
                    const accountIdentifier = row[accountIdentifierIndex]
                    if (accountIdentifier) {
                        const accountMapping = valueToTargetId.get(accountIdentifier)
                        if (accountMapping && accountMapping.type === "account") {
                            transaction.accountId = accountMapping.id
                        }
                    }
                }
            }

            // Set the category ID if available
            if (fieldToColumnIndex.has("categoryName")) {
                const categoryNameIndex = fieldToColumnIndex.get("categoryName")
                if (categoryNameIndex !== undefined) {
                    const categoryName = row[categoryNameIndex]
                    if (categoryName) {
                        const categoryMapping = valueToTargetId.get(categoryName)
                        if (categoryMapping && categoryMapping.type === "category") {
                            transaction.categoryId = categoryMapping.id
                        }
                    }
                }
            }

            // Add the transaction to the batch
            transactions.push(transaction)

            // Update the processed rows count every 100 rows
            if ((i + 1) % 100 === 0 || i === rows.length - 1) {
                await db.importJob.update({
                    where: { id: importJobId },
                    data: { processedRows: i + 1 }
                })
            }
        }

        // Create the transactions in batches
        const batchSize = 100
        for (let i = 0; i < transactions.length; i += batchSize) {
            const batch = transactions.slice(i, i + batchSize)
            await db.transaction.createMany({
                data: batch
            })
        }

        // Update the import job status to COMPLETED
        await db.importJob.update({
            where: { id: importJobId },
            data: {
                status: ImportStatus.COMPLETED,
                processedRows: rows.length
            }
        })
    } catch (error) {
        console.error("Error processing import:", error)

        // Update the import job status to FAILED
        await db.importJob.update({
            where: { id: importJobId },
            data: {
                status: ImportStatus.FAILED,
                errorMessage: error instanceof Error ? error.message : String(error)
            }
        })
    }
}
