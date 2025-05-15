import fs from "fs"
import path from "path"

const IMPORTS_DIR = "data/imports"

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
 * Reads a file from the imports directory
 * @param filePath The path to the file
 * @returns The content of the file
 */
export function readImportFile(filePath: string): string {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`)
    }

    return fs.readFileSync(filePath, "utf8")
}

/**
 * Deletes a file from the imports directory
 * @param filePath The path to the file
 */
export function deleteImportFile(filePath: string): void {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
    }
}