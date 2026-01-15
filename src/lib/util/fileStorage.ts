import fs from "fs"
import path from "path"

const DATA_DIR = "data"
const IMPORTS_DIR = path.join(DATA_DIR, "imports")
const ATTACHMENTS_DIR = path.join(DATA_DIR, "attachments")

/**
 * Ensures that the directory exists, creating it if necessary
 */
export function ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
    }
}

/**
 * Saves a file to the imports directory
 * @param importId The ID of the import job
 * @param content The content of the file
 * @returns The path to the saved file
 */
export function saveImportFile(importId: string, content: string): string {
    // Create the directory for this import
    const importDir = path.join(IMPORTS_DIR, importId)
    ensureDirectoryExists(importDir)

    // Save the file
    const filePath = path.join(importDir, "import.csv")
    fs.writeFileSync(filePath, content)

    return filePath
}

/**
 * Saves an attachment for a transaction
 * @param transactionId The ID of the transaction
 * @param attachmentId The ID of the attachment record
 * @param fileName The original filename
 * @param content The content of the file
 * @returns The path to the saved file
 */
export async function saveAttachmentFile(transactionId: string, attachmentId: string, fileName: string, content: Buffer): Promise<string> {
    const attachmentDir = path.join(ATTACHMENTS_DIR, transactionId, attachmentId)
    ensureDirectoryExists(attachmentDir)

    const filePath = path.join(attachmentDir, fileName)
    fs.writeFileSync(filePath, content)

    return filePath
}

/**
 * Reads a file from the storage
 * @param filePath The path to the file
 * @returns The content of the file
 */
export function readFile(filePath: string): Buffer {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`)
    }

    return fs.readFileSync(filePath)
}

/**
 * Reads a text file from the storage (specifically for imports)
 * @param filePath The path to the file
 * @returns The content of the file as string
 */
export function readImportFile(filePath: string): string {
    return readFile(filePath).toString("utf8")
}

/**
 * Deletes a file from the storage
 * @param filePath The path to the file
 */
export function deleteFile(filePath: string): void {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
    }
}

/**
 * Deletes an import file
 * @param filePath The path to the file
 */
export function deleteImportFile(filePath: string): void {
    deleteFile(filePath)
}