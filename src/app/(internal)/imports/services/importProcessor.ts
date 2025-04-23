import db from "@/src/lib/db"
import { ImportStatus, TransactionType } from "@prisma/client"

interface ColumnMapping {
  csvHeader: string
  fieldName: string
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
    if (!importJob.fileContent) {
      throw new Error("No file content to process")
    }

    // Get the separator from the import job or use comma as default
    const separator = importJob.separator || ","

    const lines = importJob.fileContent.split("\n").filter(line => line.trim() !== "")
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
    const transactions = []
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]

      // Extract transaction data from the row
      const transaction: any = {
        name: row[fieldToColumnIndex.get("name") || 0] || "Unnamed Transaction",
        amount: parseFloat(row[fieldToColumnIndex.get("amount") || 0] || "0"),
        type: TransactionType.EXPENSE, // Default to EXPENSE
        valueDate: new Date(),
        description: row[fieldToColumnIndex.get("description") || 0] || null,
        isTransfer: false,
        importJobId: importJobId
      }

      // Set the value date if available
      if (fieldToColumnIndex.has("valueDate")) {
        const dateString = row[fieldToColumnIndex.get("valueDate")!]
        if (dateString) {
          // Try to parse the date (this is a simplified version)
          try {
            transaction.valueDate = new Date(dateString)
          } catch (e) {
            // If date parsing fails, use current date
            transaction.valueDate = new Date()
          }
        }
      }

      // Set the transaction type if available
      if (fieldToColumnIndex.has("type")) {
        const typeString = row[fieldToColumnIndex.get("type")!]?.toUpperCase()
        if (typeString === "INCOME") {
          transaction.type = TransactionType.INCOME
        } else if (typeString === "TRANSFER") {
          transaction.type = TransactionType.TRANSFER
          transaction.isTransfer = true
        }
      }

      // Set the account ID if available
      if (fieldToColumnIndex.has("accountIdentifier")) {
        const accountIdentifier = row[fieldToColumnIndex.get("accountIdentifier")!]
        if (accountIdentifier) {
          const accountMapping = valueToTargetId.get(accountIdentifier)
          if (accountMapping && accountMapping.type === "account") {
            transaction.accountId = accountMapping.id
          }
        }
      }

      // Set the category ID if available
      if (fieldToColumnIndex.has("categoryName")) {
        const categoryName = row[fieldToColumnIndex.get("categoryName")!]
        if (categoryName) {
          const categoryMapping = valueToTargetId.get(categoryName)
          if (categoryMapping && categoryMapping.type === "category") {
            transaction.categoryId = categoryMapping.id
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
