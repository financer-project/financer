import fs from "fs"
import path from "path"

const DATA_DIR = "data"
const IMPORTS_DIR = path.join(DATA_DIR, "imports")
const TRANSACTIONS_DIR = path.join(DATA_DIR, "transactions")
const USERS_DIR = path.join(DATA_DIR, "users")

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
    const attachmentDir = path.join(TRANSACTIONS_DIR, transactionId, "attachments", attachmentId)
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

/**
 * Saves a user avatar, replacing any existing avatar
 * @param userId The user's ID
 * @param fileName Original filename (for extension extraction)
 * @param content The file content as Buffer
 * @returns The path to the saved file
 */
export function saveUserAvatar(userId: string, fileName: string, content: Buffer): string {
    const avatarDir = path.join(USERS_DIR, userId, "avatar")

    // Clear any existing avatar files in the directory
    if (fs.existsSync(avatarDir)) {
        const existingFiles = fs.readdirSync(avatarDir)
        for (const file of existingFiles) {
            fs.unlinkSync(path.join(avatarDir, file))
        }
    }

    ensureDirectoryExists(avatarDir)

    // Use a consistent filename with original extension
    const extension = path.extname(fileName) || ".jpg"
    const newFileName = `avatar${extension}`
    const filePath = path.join(avatarDir, newFileName)

    fs.writeFileSync(filePath, content)
    return filePath
}

/**
 * Deletes a user's avatar
 * @param avatarPath Path to the avatar file
 */
export function deleteUserAvatar(avatarPath: string): void {
    deleteFile(avatarPath)
}

const TEMP_DIR = path.join(DATA_DIR, "temp")

interface TempFileMetadata {
    originalName: string
    mimeType: string
    size: number
    createdAt: string
}

/**
 * Saves a file to the temp directory for later promotion to an attachment
 */
export function saveTempFile(tempFileId: string, fileName: string, buffer: Buffer, mimeType: string): void {
    const tempFileDir = path.join(TEMP_DIR, tempFileId)
    ensureDirectoryExists(tempFileDir)

    const metadata: TempFileMetadata = {
        originalName: fileName,
        mimeType,
        size: buffer.length,
        createdAt: new Date().toISOString()
    }

    fs.writeFileSync(path.join(tempFileDir, "metadata.json"), JSON.stringify(metadata))
    fs.writeFileSync(path.join(tempFileDir, fileName), buffer)
}

/**
 * Reads a temp file and its metadata
 */
export function readTempFile(tempFileId: string): { buffer: Buffer; metadata: TempFileMetadata } {
    const tempFileDir = path.join(TEMP_DIR, tempFileId)
    const metadataPath = path.join(tempFileDir, "metadata.json")

    if (!fs.existsSync(metadataPath)) {
        throw new Error(`Temp file not found: ${tempFileId}`)
    }

    const metadata: TempFileMetadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"))
    const buffer = fs.readFileSync(path.join(tempFileDir, metadata.originalName))

    return { buffer, metadata }
}

/**
 * Moves a temp file to its permanent attachment location and removes the temp dir
 */
export async function moveTempToAttachment(tempFileId: string, transactionId: string, attachmentId: string): Promise<string> {
    const { buffer, metadata } = readTempFile(tempFileId)
    const finalPath = await saveAttachmentFile(transactionId, attachmentId, metadata.originalName, buffer)

    // Clean up temp dir
    const tempFileDir = path.join(TEMP_DIR, tempFileId)
    fs.rmSync(tempFileDir, { recursive: true, force: true })

    return finalPath
}

/**
 * Removes temp file directories older than maxAgeMs milliseconds
 */
export function cleanupExpiredTempFiles(maxAgeMs: number): void {
    if (!fs.existsSync(TEMP_DIR)) return

    const entries = fs.readdirSync(TEMP_DIR)
    const cutoff = Date.now() - maxAgeMs

    for (const entry of entries) {
        const metadataPath = path.join(TEMP_DIR, entry, "metadata.json")
        if (!fs.existsSync(metadataPath)) continue

        try {
            const metadata: TempFileMetadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"))
            if (new Date(metadata.createdAt).getTime() < cutoff) {
                fs.rmSync(path.join(TEMP_DIR, entry), { recursive: true, force: true })
            }
        } catch {
            // Ignore malformed metadata
        }
    }
}