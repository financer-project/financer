import { afterEach, beforeEach, describe, expect, test } from "vitest"
import fs from "fs"
import path from "path"

// Use the real fileStorage module — it writes to data/temp/ relative to cwd.
// We let it write to the actual data/ directory (gitignored) and clean up after each test.
import {
    saveTempFile,
    readTempFile,
    moveTempToAttachment,
    cleanupExpiredTempFiles
} from "@/src/lib/util/fileStorage"

const TEMP_DIR = path.join(process.cwd(), "data", "temp")
const TRANSACTIONS_DIR = path.join(process.cwd(), "data", "transactions")

const TEST_IDS = {
    temp: "test-temp-file-storage",
    txn: "test-txn-file-storage",
    att: "test-att-file-storage"
}

function cleanupTestDirs() {
    for (const id of Object.values(TEST_IDS)) {
        const tempDir = path.join(TEMP_DIR, id)
        const txnDir = path.join(TRANSACTIONS_DIR, id)
        if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true })
        if (fs.existsSync(txnDir)) fs.rmSync(txnDir, { recursive: true, force: true })
    }
}

beforeEach(cleanupTestDirs)
afterEach(cleanupTestDirs)

describe("fileStorage — temp file utilities", () => {
    describe("saveTempFile / readTempFile", () => {
        test("saves a file and metadata, then reads them back", () => {
            const content = Buffer.from("PDF content here")
            saveTempFile(TEST_IDS.temp, "invoice.pdf", content, "application/pdf")

            const { buffer, metadata } = readTempFile(TEST_IDS.temp)

            expect(buffer).toEqual(content)
            expect(metadata.originalName).toBe("invoice.pdf")
            expect(metadata.mimeType).toBe("application/pdf")
            expect(metadata.size).toBe(content.length)
            expect(new Date(metadata.createdAt).getTime()).toBeGreaterThan(0)
        })

        test("throws when temp file does not exist", () => {
            expect(() => readTempFile("does-not-exist-xyz")).toThrow()
        })

        test("stores metadata as valid JSON", () => {
            saveTempFile(TEST_IDS.temp, "file.pdf", Buffer.from("x"), "application/pdf")

            const metaPath = path.join(TEMP_DIR, TEST_IDS.temp, "metadata.json")
            expect(fs.existsSync(metaPath)).toBe(true)
            expect(() => JSON.parse(fs.readFileSync(metaPath, "utf8"))).not.toThrow()
        })
    })

    describe("moveTempToAttachment", () => {
        test("moves file to permanent location and removes temp dir", async () => {
            const content = Buffer.from("receipt bytes")
            saveTempFile(TEST_IDS.temp, "receipt.jpg", content, "image/jpeg")

            const finalPath = await moveTempToAttachment(TEST_IDS.temp, TEST_IDS.txn, TEST_IDS.att)

            // Final file exists at returned path
            expect(fs.existsSync(finalPath)).toBe(true)
            expect(fs.readFileSync(finalPath)).toEqual(content)

            // Temp dir is gone
            const tempDir = path.join(TEMP_DIR, TEST_IDS.temp)
            expect(fs.existsSync(tempDir)).toBe(false)
        })

        test("throws when source temp file does not exist", async () => {
            await expect(moveTempToAttachment("missing-id", TEST_IDS.txn, TEST_IDS.att)).rejects.toThrow()
        })
    })

    describe("cleanupExpiredTempFiles", () => {
        test("removes directories older than maxAgeMs", () => {
            saveTempFile(TEST_IDS.temp, "old.pdf", Buffer.from("old"), "application/pdf")

            // Backdate the metadata so the file appears old
            const metaPath = path.join(TEMP_DIR, TEST_IDS.temp, "metadata.json")
            const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"))
            meta.createdAt = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
            fs.writeFileSync(metaPath, JSON.stringify(meta))

            cleanupExpiredTempFiles(60 * 60 * 1000) // 1 hour max age

            const tempDir = path.join(TEMP_DIR, TEST_IDS.temp)
            expect(fs.existsSync(tempDir)).toBe(false)
        })

        test("keeps directories newer than maxAgeMs", () => {
            saveTempFile(TEST_IDS.temp, "new.pdf", Buffer.from("new"), "application/pdf")

            cleanupExpiredTempFiles(60 * 60 * 1000) // 1 hour max age — file was just created

            const tempDir = path.join(TEMP_DIR, TEST_IDS.temp)
            expect(fs.existsSync(tempDir)).toBe(true)
        })

        test("does nothing when temp directory does not exist", () => {
            // Ensure no temp dir
            if (fs.existsSync(TEMP_DIR)) {
                // Don't delete the whole dir — other tests may use it; just verify no throw
            }
            expect(() => cleanupExpiredTempFiles(1000)).not.toThrow()
        })

        test("skips directories with missing metadata gracefully", () => {
            // Create a directory without metadata
            const orphanDir = path.join(TEMP_DIR, "orphan-test-dir-xyz")
            try {
                fs.mkdirSync(orphanDir, { recursive: true })
                // Should not throw
                expect(() => cleanupExpiredTempFiles(0)).not.toThrow()
            } finally {
                if (fs.existsSync(orphanDir)) fs.rmSync(orphanDir, { recursive: true, force: true })
            }
        })
    })
})
