import db from "@/src/lib/db"
import { ImportJob, ImportStatus, TransactionType } from "@prisma/client"
import { readImportFile } from "@/src/lib/util/fileStorage"
import { DateTime } from "luxon"

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

type ImportJobWithMappings = ImportJob & {
    columnMappings: ColumnMapping[]
    valueMappings: ValueMapping[]
}

type CsvData = {
    headers: string[];
    rows: string[][];
}

type FieldMappings = {
    fieldToColumnIndex: Map<string, number>;
    valueToTargetId: Map<string, { type: string, id: string }>;
}

// Helper type for transaction creation
type TransactionData = {
    name: string;
    type: TransactionType;
    amount: number;
    valueDate: Date;
    description: string | null;
    accountId: string;
    categoryId?: string;
    isTransfer?: boolean;
    importJobId: string;
};

/**
 * Parse an amount string based on the specified format
 */
function parseAmount(amountString: string, format: string | null): number {
    try {
        let processedAmount = amountString

        if (format === "dot") {
            // Format: 1.234,56 (dot as thousands separator, comma as decimal)
            processedAmount = amountString.replace(/\./g, "").replace(",", ".")
        } else if (format === "comma" || !format) {
            // Format: 1,234.56 (comma as thousands separator, dot as decimal)
            processedAmount = amountString.replace(/,/g, "")
        }

        const amount = parseFloat(processedAmount)
        return isNaN(amount) ? 0 : amount
    } catch (e) {
        console.warn(`Error parsing amount: ${amountString}`, e)
        return 0
    }
}

/**
 * Parse a date string based on the specified format
 */
function parseDate(dateString: string, format: string | null): Date {
    if (format) {
        // Use luxon to parse the date with the specified format
        const parsed = DateTime.fromFormat(dateString, format)
        return parsed.isValid ? parsed.toJSDate() : new Date()
    } else {
        // Fallback to default parsing if no format is specified
        const parsed = DateTime.fromISO(dateString)
        return parsed.isValid ? parsed.toJSDate() : new Date()
    }
}

/**
 * Get a value from a row based on field name
 */
function getValueFromRow(row: string[], fieldToColumnIndex: Map<string, number>, fieldName: string): string | null {
    const index = fieldToColumnIndex.get(fieldName)
    if (index === undefined) return null
    return row[index] || null
}

/**
 * Fetch and validate an import job
 */
async function getImportJob(importJobId: string): Promise<ImportJobWithMappings> {
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

    return importJob as ImportJobWithMappings
}

/**
 * Update import job status
 */
async function updateImportJobStatus(
    importJobId: string,
    status: ImportStatus,
    data: { processedRows?: number, totalRows?: number, errorMessage?: string } = {}
): Promise<void> {
    await db.importJob.update({
        where: { id: importJobId },
        data: { status, ...data }
    })
}

/**
 * Parse CSV data from an import job
 */
function parseCsvData(filePath: string, separator: string): CsvData {
    const fileContent = readImportFile(filePath)
    const lines = fileContent.split("\n").filter(line => line.trim() !== "")
    const headers = lines[0].split(separator).map(header => header.trim())
    const rows = lines.slice(1).map(line => line.split(separator).map(cell => cell.trim()))

    return { headers, rows }
}

/**
 * Create field mappings from import job and CSV headers
 */
function createFieldMappings(importJob: ImportJobWithMappings, headers: string[]): FieldMappings {
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

    return { fieldToColumnIndex, valueToTargetId }
}

/**
 * Process a single row from CSV data
 * Returns null if no valid account mapping is found
 */
function processRow(
    row: string[],
    importJob: ImportJobWithMappings,
    fieldMappings: FieldMappings
): TransactionData | null {
    const { fieldToColumnIndex, valueToTargetId } = fieldMappings

    // Get field mappings
    const amountMapping = importJob.columnMappings.find(m => m.fieldName === "amount")
    const valueDateMapping = importJob.columnMappings.find(m => m.fieldName === "valueDate")

    // Get values from row
    const name = getValueFromRow(row, fieldToColumnIndex, "name") ?? "Unnamed Transaction"
    const description = getValueFromRow(row, fieldToColumnIndex, "description")
    const amountString = getValueFromRow(row, fieldToColumnIndex, "amount")
    const dateString = getValueFromRow(row, fieldToColumnIndex, "valueDate")
    const accountIdentifier = getValueFromRow(row, fieldToColumnIndex, "accountIdentifier")
    const categoryName = getValueFromRow(row, fieldToColumnIndex, "categoryName")

    let isTransfer = false

    // Determine account ID
    let accountId: string | null = null
    if (accountIdentifier) {
        const accountMapping = valueToTargetId.get(accountIdentifier)
        if (accountMapping && accountMapping.type === "account") {
            accountId = accountMapping.id
        }
    }

    // Skip rows without a valid account mapping
    if (accountId === null) {
        return null
    }

    // Parse amount
    let amount = amountString
        ? parseAmount(amountString, amountMapping?.format ?? null)
        : 0

    // Determine transaction type
    const type: TransactionType = amount < 0
        ? TransactionType.EXPENSE
        : TransactionType.INCOME

    amount = Math.abs(amount)

    // Parse date
    const valueDate = dateString
        ? parseDate(dateString, valueDateMapping?.format ?? null)
        : new Date()

    // Determine category ID
    let categoryId: string | undefined = undefined
    if (categoryName) {
        const categoryMapping = valueToTargetId.get(categoryName)
        if (categoryMapping && categoryMapping.type === "category") {
            categoryId = categoryMapping.id
        }
    }

    // Create transaction object with all required fields
    return {
        name,
        type,
        amount,
        valueDate,
        description,
        accountId,
        categoryId,
        isTransfer,
        importJobId: importJob.id
    }
}

/**
 * Create transactions in batches
 */
async function createTransactionBatches(transactions: TransactionData[]): Promise<void> {
    const accountIds = [...new Set(transactions.map(t => t.accountId))]
    const existingAccounts = await db.account.findMany({
        where: { id: { in: accountIds } },
        select: { id: true }
    })

    const existingAccountIds = new Set(existingAccounts.map(a => a.id))
    const validTransactions = transactions.filter(t => existingAccountIds.has(t.accountId))

    if (validTransactions.length < transactions.length) {
        console.warn(`Skipped ${transactions.length - validTransactions.length} transactions with invalid account IDs`)
    }

    // Create transactions in batches
    const batchSize = 100
    for (let i = 0; i < validTransactions.length; i += batchSize) {
        const batch = validTransactions.slice(i, i + batchSize)
        await db.transaction.createMany({
            data: batch
        })
    }
}

/**
 * Process an import job in the background
 */
export async function processImport(importJobId: string): Promise<void> {
    try {
        // Get the import job with its mappings
        const importJob = await getImportJob(importJobId)

        // Update the import job status to PROCESSING
        await updateImportJobStatus(importJobId, ImportStatus.PROCESSING)

        // Validate file path
        if (!importJob.filePath) {
            throw new Error("No file path to process")
        }

        // Get the separator from the import job or use comma as default
        const separator = importJob.separator || ","

        // Parse the CSV data
        const { headers, rows } = parseCsvData(importJob.filePath, separator)

        // Update the import job with the total number of rows
        await updateImportJobStatus(importJobId, ImportStatus.PROCESSING, {
            totalRows: rows.length,
            processedRows: 0
        })

        // Create field mappings
        const fieldMappings = createFieldMappings(importJob, headers)

        // Process each row
        const transactions: TransactionData[] = []
        let processedCount = 0
        let skippedCount = 0

        for (let i = 0; i < rows.length; i++) {
            // Process the row
            const transaction = processRow(rows[i], importJob, fieldMappings)

            // Only add valid transactions (with account mappings)
            if (transaction !== null) {
                transactions.push(transaction)
                processedCount++
            } else {
                skippedCount++
            }

            // Update the processed rows count every 100 rows
            if ((i + 1) % 100 === 0 || i === rows.length - 1) {
                await updateImportJobStatus(importJobId, ImportStatus.PROCESSING, {
                    processedRows: i + 1
                })
            }
        }

        console.log(`Import ${importJobId}: Processed ${processedCount} rows, skipped ${skippedCount} rows without account mappings`)

        // Check if there are any transactions to create
        if (transactions.length === 0) {
            console.warn(`Import ${importJobId}: No valid transactions to create. All rows were skipped.`)
        } else {
            // Create the transactions in batches
            const initialTransactionCount = transactions.length
            await createTransactionBatches(transactions)

            // Get the actual number of transactions created
            const createdTransactions = await db.transaction.count({
                where: { importJobId }
            })

            console.log(`Import ${importJobId}: Created ${createdTransactions} transactions out of ${initialTransactionCount} processed rows`)
        }

        // Update the import job status to COMPLETED
        await updateImportJobStatus(importJobId, ImportStatus.COMPLETED, {
            processedRows: rows.length
        })
    } catch (error) {
        console.error("Error processing import:", error)

        // Prepare a more detailed error message
        let errorMessage = error instanceof Error ? error.message : String(error)

        // Check if it's a Prisma error with a foreign key constraint violation
        if (error instanceof Error && error.message.includes("Foreign key constraint failed")) {
            errorMessage = "Foreign key constraint violation: Some transactions reference accounts that don't exist. Please check your account mappings."
        }

        // Update the import job status to FAILED
        await updateImportJobStatus(importJobId, ImportStatus.FAILED, {
            errorMessage
        })
    }
}
