import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import getImportJob from "@/src/lib/model/imports/queries/getImportJob"
import getImportJobs from "@/src/lib/model/imports/queries/getImportJobs"
import createImportJob from "@/src/lib/model/imports/mutations/createImportJob"
import updateImportJob from "@/src/lib/model/imports/mutations/updateImportJob"
import startImport from "@/src/lib/model/imports/mutations/startImport"
import TestUtilityMock from "@/test/utility/TestUtilityMock"
import { ImportStatus } from "@prisma/client"
import db from "@/src/lib/db"
import { queueImportJob } from "@/src/lib/jobs"

vi.mock("@/src/lib/jobs", () => ({
    queueImportJob: vi.fn().mockResolvedValue(undefined)
}))

describe("Import Mutations & Queries", () => {
    const util = TestUtilityMock.getInstance()
    let testImportJob: any

    beforeEach(async () => {
        await util.seedDatabase()

        // Create a test import job for use in tests
        testImportJob = await db.importJob.create({
            data: {
                name: "Test Import",
                status: ImportStatus.DRAFT,
                householdId: util.getTestData().households.standard.id,
                columnMappings: {
                    create: [
                        { csvHeader: "Date", fieldName: "valueDate", format: "yyyy-MM-dd" },
                        { csvHeader: "Amount", fieldName: "amount", format: "comma" },
                        { csvHeader: "Description", fieldName: "name", format: null }
                    ]
                },
                valueMappings: {
                    create: [
                        {
                            sourceValue: "Bank Account",
                            targetType: "account",
                            targetId: util.getTestData().accounts.standard.id
                        }
                    ]
                }
            },
            include: {
                columnMappings: true,
                valueMappings: true
            }
        })
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe("get", () => {
        test("get all import jobs with pagination", async () => {
            const { importJobs, count } = await getImportJobs({
                where: { householdId: util.getTestData().households.standard.id }
            }, util.getMockContext())

            expect(importJobs).toBeDefined()
            expect(importJobs.length).toBeGreaterThan(0)
            expect(count).toBeGreaterThan(0)
        })

        test("get specific import job by ID", async () => {
            const importJob = await getImportJob({ id: testImportJob.id }, util.getMockContext())

            expect(importJob.id).toBe(testImportJob.id)
            expect(importJob.name).toBe("Test Import")
            expect(importJob.columnMappings).toHaveLength(3)
            expect(importJob.valueMappings).toHaveLength(1)
        })

        test("fails to get non-existent import job", async () => {
            await expect(async () => getImportJob(
                { id: "non-existent-id" },
                util.getMockContext()
            )).rejects.toThrowError()
        })
    })

    describe("create", () => {
        test("creates a new import job successfully", async () => {
            const importJobData = {
                name: "New Import Job",
                householdId: util.getTestData().households.standard.id,
                separator: ",",
                columnMappings: [
                    { csvHeader: "Transaction Date", fieldName: "valueDate", format: "yyyy-MM-dd" },
                    { csvHeader: "Transaction Amount", fieldName: "amount", format: "comma" }
                ],
                valueMappings: [
                    {
                        sourceValue: "Checking Account",
                        targetType: "account",
                        targetId: util.getTestData().accounts.standard.id
                    }
                ]
            }

            const result = await createImportJob(importJobData, util.getMockContext())

            expect(result.id).not.toBeUndefined()
            expect(result.name).toBe("New Import Job")
            expect(result.status).toBe(ImportStatus.DRAFT)

            // Verify column mappings and value mappings were created
            const createdImportJob = await db.importJob.findUnique({
                where: { id: result.id },
                include: {
                    columnMappings: true,
                    valueMappings: true
                }
            })

            expect(createdImportJob?.columnMappings).toHaveLength(2)
            expect(createdImportJob?.valueMappings).toHaveLength(1)
        })

        test("fails with invalid data", async () => {
            await expect(async () => createImportJob({
                name: "",  // Empty name should fail validation
                householdId: util.getTestData().households.standard.id,
                columnMappings: [],
                valueMappings: []
            }, util.getMockContext())).rejects.toThrowError()
        })
    })

    describe("update", () => {
        test("updates an import job successfully", async () => {
            const result = await updateImportJob({
                id: testImportJob.id,
                name: "Updated Import Job",
                status: ImportStatus.DRAFT,
                columnMappings: [
                    { csvHeader: "Updated Date", fieldName: "valueDate", format: "yyyy-MM-dd" },
                    { csvHeader: "Updated Amount", fieldName: "amount", format: "dot" }
                ]
            }, util.getMockContext())

            expect(result.name).toBe("Updated Import Job")

            // Verify column mappings were updated
            const updatedImportJob = await db.importJob.findUnique({
                where: { id: testImportJob.id },
                include: {
                    columnMappings: true
                }
            })

            expect(updatedImportJob?.columnMappings).toHaveLength(2)
            expect(updatedImportJob?.columnMappings[0].csvHeader).toBe("Updated Date")
            expect(updatedImportJob?.columnMappings[1].csvHeader).toBe("Updated Amount")
        })

        test("fails to update non-existing import job", async () => {
            await expect(async () => updateImportJob({
                id: "non-existent-id",
                name: "Invalid Update"
            }, util.getMockContext())).rejects.toThrowError()
        })
    })

    describe("start", () => {
        test("starts an import job successfully", async () => {
            const result = await startImport({ id: testImportJob.id }, util.getMockContext())

            expect(result.status).toBe(ImportStatus.PENDING)

            // Verify queueImportJob was called with the correct ID
            expect(queueImportJob).toHaveBeenCalledWith(testImportJob.id)
        })

        test("fails to start non-existing import job", async () => {
            await expect(async () => startImport(
                { id: "non-existent-id" },
                util.getMockContext()
            )).rejects.toThrowError()
        })

        test("fails to start import job that is not in DRAFT state", async () => {
            // Update the import job to PENDING state
            await db.importJob.update({
                where: { id: testImportJob.id },
                data: { status: ImportStatus.PENDING }
            })

            await expect(async () => startImport(
                { id: testImportJob.id },
                util.getMockContext()
            )).rejects.toThrowError(/Import job is already in PENDING state/)
        })
    })
})
