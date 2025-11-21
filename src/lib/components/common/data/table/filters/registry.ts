import { FilterType, FilterStrategy } from "./types"
import { StringFilterStrategy } from "./StringFilter"
import { SelectFilterStrategy } from "./SelectFilter"
import { DateFilterStrategy } from "./DateFilter"

// Registry Mapping
const registry: Record<FilterType, FilterStrategy<any, any>> = {
    string: StringFilterStrategy,
    select: SelectFilterStrategy,
    date: DateFilterStrategy,
}

export function getFilterStrategy(type: FilterType): FilterStrategy<any, any> {
    const strategy = registry[type]
    if (!strategy) {
        throw new Error(`No filter strategy found for type: ${type}`)
    }
    return strategy
}
