import * as React from "react"

export function useDebounce<T>(value: T, delay = 300): T {
    const [debounced, setDebounced] = React.useState(value)

    React.useEffect(() => {
        const handle = setTimeout(() => setDebounced(value), delay)
        return () => clearTimeout(handle)
    }, [value, delay])

    return debounced
}
