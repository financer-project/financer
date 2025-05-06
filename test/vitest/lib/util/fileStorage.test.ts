import { describe, expect, test, vi, beforeEach, afterEach } from "vitest"
import * as fs from "fs"
import * as path from "path"
import { ensureDirectoryExists, saveImportFile, readImportFile, deleteImportFile } from "@/src/lib/util/fileStorage"

// Mock the fs module
vi.mock("fs", () => {
    const mockFs = {
        existsSync: vi.fn(),
        mkdirSync: vi.fn(),
        writeFileSync: vi.fn(),
        readFileSync: vi.fn(),
        unlinkSync: vi.fn()
    }
    return {
        default: mockFs,
        ...mockFs
    }
})

// Mock the path module
vi.mock("path", () => {
    const mockPath = {
        join: vi.fn((...args) => args.join("/"))
    }
    return {
        default: mockPath,
        ...mockPath
    }
})

describe("File Storage Utilities", () => {
    const IMPORTS_DIR = "data/imports"
    const mockImportId = "mock-import-id"
    const mockContent = "mock,csv,content"
    const mockImportDir = `${IMPORTS_DIR}/${mockImportId}`
    const mockFilePath = `${mockImportDir}/import.csv`

    beforeEach(() => {
        // Reset all mocks before each test
        vi.resetAllMocks()
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe("ensureDirectoryExists", () => {
        test("creates directory if it doesn't exist", () => {
            // Setup
            vi.mocked(fs.existsSync).mockReturnValue(false)

            // Execute
            ensureDirectoryExists(mockImportDir)

            // Verify
            expect(fs.existsSync).toHaveBeenCalledWith(mockImportDir)
            expect(fs.mkdirSync).toHaveBeenCalledWith(mockImportDir, { recursive: true })
        })

        test("doesn't create directory if it already exists", () => {
            // Setup
            vi.mocked(fs.existsSync).mockReturnValue(true)

            // Execute
            ensureDirectoryExists(mockImportDir)

            // Verify
            expect(fs.existsSync).toHaveBeenCalledWith(mockImportDir)
            expect(fs.mkdirSync).not.toHaveBeenCalled()
        })
    })

    describe("saveImportFile", () => {
        test("saves file to the imports directory", () => {
            // Setup
            vi.mocked(fs.existsSync).mockReturnValue(false)
            vi.mocked(path.join).mockImplementation((...args) => args.join("/"))

            // Execute
            const result = saveImportFile(mockImportId, mockContent)

            // Verify
            expect(path.join).toHaveBeenCalledWith(IMPORTS_DIR, mockImportId)
            expect(fs.existsSync).toHaveBeenCalledWith(mockImportDir)
            expect(fs.mkdirSync).toHaveBeenCalledWith(mockImportDir, { recursive: true })
            expect(path.join).toHaveBeenCalledWith(mockImportDir, "import.csv")
            expect(fs.writeFileSync).toHaveBeenCalledWith(mockFilePath, mockContent)
            expect(result).toBe(mockFilePath)
        })

        test("creates directory if it doesn't exist", () => {
            // Setup
            vi.mocked(fs.existsSync).mockReturnValue(false)

            // Execute
            saveImportFile(mockImportId, mockContent)

            // Verify
            expect(fs.existsSync).toHaveBeenCalledWith(mockImportDir)
            expect(fs.mkdirSync).toHaveBeenCalledWith(mockImportDir, { recursive: true })
        })

        test("doesn't create directory if it already exists", () => {
            // Setup
            vi.mocked(fs.existsSync).mockReturnValue(true)

            // Execute
            saveImportFile(mockImportId, mockContent)

            // Verify
            expect(fs.existsSync).toHaveBeenCalledWith(mockImportDir)
            expect(fs.mkdirSync).not.toHaveBeenCalled()
        })
    })

    describe("readImportFile", () => {
        test("reads file from the imports directory", () => {
            // Setup
            vi.mocked(fs.existsSync).mockReturnValue(true)
            vi.mocked(fs.readFileSync).mockReturnValue(mockContent as any)

            // Execute
            const result = readImportFile(mockFilePath)

            // Verify
            expect(fs.existsSync).toHaveBeenCalledWith(mockFilePath)
            expect(fs.readFileSync).toHaveBeenCalledWith(mockFilePath, "utf8")
            expect(result).toBe(mockContent)
        })

        test("throws error if file doesn't exist", () => {
            // Setup
            vi.mocked(fs.existsSync).mockReturnValue(false)

            // Execute & Verify
            expect(() => readImportFile(mockFilePath)).toThrow(`File not found: ${mockFilePath}`)
            expect(fs.existsSync).toHaveBeenCalledWith(mockFilePath)
            expect(fs.readFileSync).not.toHaveBeenCalled()
        })
    })

    describe("deleteImportFile", () => {
        test("deletes file if it exists", () => {
            // Setup
            vi.mocked(fs.existsSync).mockReturnValue(true)

            // Execute
            deleteImportFile(mockFilePath)

            // Verify
            expect(fs.existsSync).toHaveBeenCalledWith(mockFilePath)
            expect(fs.unlinkSync).toHaveBeenCalledWith(mockFilePath)
        })

        test("doesn't delete file if it doesn't exist", () => {
            // Setup
            vi.mocked(fs.existsSync).mockReturnValue(false)

            // Execute
            deleteImportFile(mockFilePath)

            // Verify
            expect(fs.existsSync).toHaveBeenCalledWith(mockFilePath)
            expect(fs.unlinkSync).not.toHaveBeenCalled()
        })
    })
})
