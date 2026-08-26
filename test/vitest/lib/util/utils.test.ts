import { describe, expect, test } from "vitest"
import { cn } from "@/src/lib/util/utils"

describe("cn", () => {
    test("merges plain class name strings in order", () => {
        expect(cn("flex", "items-center")).toBe("flex items-center")
    })

    test("drops falsy conditional values", () => {
        const isActive = false
        expect(cn("base", isActive && "active")).toBe("base")
    })

    test("keeps truthy conditional values", () => {
        const isActive = true
        expect(cn("base", isActive && "active")).toBe("base active")
    })

    test("resolves conflicting Tailwind utility classes by keeping the last one", () => {
        // twMerge must win here: "p-2" and "p-4" both set padding, so only the last should survive.
        expect(cn("p-2", "p-4")).toBe("p-4")
    })

    test("flattens arrays of class values", () => {
        expect(cn(["flex", "gap-2"], "items-center")).toBe("flex gap-2 items-center")
    })
})
