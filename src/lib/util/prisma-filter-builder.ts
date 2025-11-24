import { FilterConfig } from "@/src/lib/components/common/data/table/filters/types"
import { getFilterStrategy } from "@/src/lib/components/common/data/table/filters/registry"

interface BuildWhereParams<T> {
    searchParams: URLSearchParams | Record<string, string | string[] | undefined>
    filters?: FilterConfig<T>[]
    search?: {
        fields: string[]
        paramKey?: string
    }
}

export function buildPrismaWhere<T>({ searchParams, filters = [], search }: BuildWhereParams<T>): any {
    const where: any = { AND: [] }
    const params = new URLSearchParams(searchParams as any)

    // 1) Fuzzy search across fields
    if (search && Array.isArray(search.fields) && search.fields.length > 0) {
        const key = search.paramKey ?? "q"
        const term = (params.get(key) ?? "").trim()
        if (term) {
            const or: any[] = []

            const makeContains = () => ({ contains: term })

            // Convert dotted paths like "account.name" to nested where object
            const pathToWhere = (path: string) => {
                const parts = path.split(".")
                const field = parts.pop()!
                // Reduce from last relation inward using { is: { ... } }
                let node: any = { [field]: makeContains() }
                for (let i = parts.length - 1; i >= 0; i--) {
                    const rel = parts[i]
                    // By default, use `is` for to-one relations; if your schema uses to-many here,
                    // you may switch to `{ some: node }`.
                    node = { [rel]: { is: node } }
                }
                return node
            }

            for (const f of search.fields) {
                if (f.includes(".")) or.push(pathToWhere(f))
                else or.push({ [f]: makeContains() })
            }

            if (or.length > 0) where.AND.push({ OR: or })
        }
    }

    filters.forEach((filter) => {
        const key = filter.property as string
        // For date ranges, we might need to look for multiple keys,
        // but let's assume the strategy handles the value extraction if passed the full params map,
        // or for simplicity here, we assume single key per filter for now.
        const value = params.get(key)

        if (value) {
            const strategy = getFilterStrategy(filter.type)
            // Delegate logic to the strategy
            const clause = strategy.getWhereClause(filter as any, value)
            if (clause && typeof clause === "object" && Object.keys(clause).length > 0) {
                where.AND.push(clause)
            }
        }
    })

    return where.AND.length > 0 ? where : {}
}
