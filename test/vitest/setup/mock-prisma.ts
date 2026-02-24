import { beforeEach, vi } from "vitest"
import { mockDeep } from "vitest-mock-extended"
import createPrismaMock from "prisma-mock"
import { Prisma } from "@prisma/client"
import db from "@/src/lib/db"

vi.mock("@/src/lib/db", async () => {
    const dbImport = await vi.importActual("@/src/lib/db")
    return {
        __esModule: true,
        ...dbImport,
        default: mockDeep()
    }
})

beforeEach(async () => {
    // @ts-ignore
    createPrismaMock({}, Prisma.dmmf.datamodel, db)
})
