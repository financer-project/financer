import { DateFilterConfig, FilterStrategy, FilterType, SelectFilterConfig, StringFilterConfig } from "./types"
import { StringFilterStrategy } from "./StringFilter"
import { SelectFilterStrategy } from "./SelectFilter"
import { DateFilterStrategy } from "./DateFilter"

// A strongly-typed strategy map per filter type
type StrategyMap<T> = {
    string: FilterStrategy<T, StringFilterConfig<T>>
    select: FilterStrategy<T, SelectFilterConfig<T>>
    date: FilterStrategy<T, DateFilterConfig<T>>
}

// Registry Mapping stored with `unknown` and safely casted on read
const registry: StrategyMap<unknown> = {
    string: StringFilterStrategy,
    select: SelectFilterStrategy,
    date: DateFilterStrategy,
}

export function getFilterStrategy<T, K extends FilterType = FilterType>(type: K): StrategyMap<T>[K] {
    const strategy = registry[type] as StrategyMap<T>[K]
    if (!strategy) {
        throw new Error(`No filter strategy found for type: ${type}`)
    }
    return strategy
}
