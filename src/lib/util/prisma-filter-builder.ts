import { BaseFilterConfig, FilterConfig } from "@/src/lib/components/common/data/table/filters/types"
import { getFilterStrategy } from "@/src/lib/components/common/data/table/filters/registry"

interface BuildWhereParams<T> {
    searchParams: URLSearchParams | Record<string, string | string[] | undefined>
    filters?: FilterConfig<T>[]
    search?: {
        fields: string[]
        paramKey?: string
    }
}

/**
 * Build a Prisma `where` object by combining:
 * - A fuzzy search OR across configured fields, if provided
 * - Strategy-provided clauses for each active filter
 *
 * The function is generic over `W`, allowing you to obtain a strongly-typed
 * Prisma WhereInput at the call-site, e.g.:
 *   const where = buildPrismaWhere<TransactionModel, Prisma.TransactionWhereInput>({...})
 */
export function buildPrismaWhere<T, W extends Record<string, unknown> = Record<string, unknown>>(
    { searchParams, filters = [], search }: BuildWhereParams<T>
): W {
    const andClauses: W[] = []

    const params = toUrlSearchParams(searchParams)

    // 1) Fuzzy search across fields
    if (search && Array.isArray(search.fields) && search.fields.length > 0) {
        const key = search.paramKey ?? "q"
        const term = (params.get(key) ?? "").trim()
        if (term) {
            const or: W[] = []

            const makeContains = (): Record<string, unknown> => ({ contains: term })

            // Convert dotted paths like "account.name" to nested where object
            const pathToWhere = (path: string): Record<string, unknown> => {
                const parts = path.split(".")
                const field = parts.pop()!
                // Reduce from last relation inward using { is: { ... } }
                let node: Record<string, unknown> = { [field]: makeContains() }
                for (let i = parts.length - 1; i >= 0; i--) {
                    const rel = parts[i]
                    // By default, use `is` for to-one relations; if your schema uses to-many here,
                    // you may switch to `{ some: node }`.
                    node = { [rel]: { is: node } }
                }
                return node
            }

            for (const f of search.fields) {
                if (f.includes(".")) or.push(pathToWhere(f) as W)
                else or.push({ [f]: makeContains() } as W)
            }

            if (or.length > 0) andClauses.push({ OR: or } as W)
        }
    }

    filters.forEach((filter) => {
        const key = filter.property as string
        // For date ranges, we might need to look for multiple keys,
        // but let's assume the strategy handles the value extraction if passed the full params map,
        // or for simplicity here, we assume single key per filter for now.
        const value = params.get(key)

        if (value) {
            const strategy = getFilterStrategy<unknown>(filter.type)
            // Delegate logic to the strategy; cast the config to a generic base to avoid `any`.
            const clause = strategy.getWhereClause(filter as unknown as BaseFilterConfig<unknown>, value)
            if (clause && typeof clause === "object" && Object.keys(clause).length > 0) {
                andClauses.push(clause as W)
            }
        }
    })

    return andClauses.length > 0 ? ({ AND: andClauses } as unknown as W) : ({} as W)
}

function toUrlSearchParams(input: URLSearchParams | Record<string, string | string[] | undefined>): URLSearchParams {
    if (input instanceof URLSearchParams) return input
    const entries: Array<[string, string]> = []
    for (const [k, v] of Object.entries(input)) {
        if (v === undefined) continue
        if (Array.isArray(v)) entries.push(...v.map((x) => [k, x]))
        else entries.push([k, v])
    }
    return new URLSearchParams(entries)
}
