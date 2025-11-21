import { FilterConfig } from "@/src/lib/components/common/data/table/filters/types"
import { getFilterStrategy } from "@/src/lib/components/common/data/table/filters/registry"

interface BuildWhereParams<T> {
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>
  filters?: FilterConfig<T>[]
}

export function buildPrismaWhere<T>({ searchParams, filters = [] }: BuildWhereParams<T>): any {
  const where: any = { AND: [] }
  const params = new URLSearchParams(searchParams as any)

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
