import { beforeEach, vi } from "vitest"
import { mockDeep } from "vitest-mock-extended"

vi.mock("@/src/lib/db", async () => {
    const dbImport = await vi.importActual("@/src/lib/db")
    return {
        __esModule: true,
        ...dbImport,
        default: mockDeep()
    }
})

import createPrismaMock from "prisma-mock"
import { Prisma } from "@prisma/client"
import db from "@/src/lib/db"

beforeEach(async () => {
    createPrismaMock({}, Prisma.dmmf.datamodel, db)
})
