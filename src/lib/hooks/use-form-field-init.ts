import { useEffect, useRef } from "react"
import { FieldHelperProps } from "formik"

/**
 * Default value comparison that handles dates and primitives.
 * For dates, compares by timestamp. For other values, uses strict equality.
 */
function defaultAreEqual<T>(a: T | null | undefined, b: T | null | undefined): boolean {
    if (a === b) return true
    if (a == null || b == null) return a == b

    // Handle Date comparison by timestamp
    if (a instanceof Date && b instanceof Date) {
        return a.getTime() === b.getTime()
    }

    // Handle array comparison (shallow)
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false
        return a.every((val, idx) => defaultAreEqual(val, b[idx]))
    }

    return false
}

interface UseFormFieldInitOptions<T> {
    fieldValue: T | undefined
    propValue: T | null | undefined
    defaultValue: T
    helpers: FieldHelperProps<T>
    /** Custom equality function. Defaults to handling dates and arrays. */
    areEqual?: (a: T | null | undefined, b: T | null | undefined) => boolean
}

/**
 * Hook to sync a Formik field with an external prop value.
 * - Initializes the field on mount
 * - Updates the field when propValue actually changes (using value comparison, not reference)
 * - Prevents spurious updates from unstable references (e.g., new Date objects on every render)
 */
export function useFormFieldInit<T>({
                                        fieldValue,
                                        propValue,
                                        defaultValue,
                                        helpers,
                                        areEqual = defaultAreEqual
                                    }: UseFormFieldInitOptions<T>): void {
    const lastPropValue = useRef<T | null | undefined>(propValue)
    const isInitialized = useRef(false)

    useEffect(() => {
        if (!isInitialized.current) {
            // Initial mount: set field value from prop or default
            if (fieldValue === undefined) {
                helpers.setValue(propValue ?? defaultValue)
            } else if (propValue != null && fieldValue === defaultValue) {
                helpers.setValue(propValue)
            }
            isInitialized.current = true
            lastPropValue.current = propValue
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        // After initialization: sync when prop value actually changes
        if (isInitialized.current && !areEqual(propValue, lastPropValue.current)) {
            helpers.setValue(propValue ?? defaultValue)
            lastPropValue.current = propValue
        }
    }, [propValue, defaultValue, helpers, areEqual])
}
