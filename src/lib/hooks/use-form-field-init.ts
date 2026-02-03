import { useEffect, useRef } from "react"
import { FieldHelperProps } from "formik"

interface UseFormFieldInitOptions<T> {
    fieldValue: T | undefined
    propValue: T | null | undefined
    defaultValue: T
    helpers: FieldHelperProps<T>
}

/**
 * Hook to initialize a Formik field value once on mount.
 * Prevents the field from being reset on every re-render when props.value changes.
 */
export function useFormFieldInit<T>({
    fieldValue,
    propValue,
    defaultValue,
    helpers
}: UseFormFieldInitOptions<T>): void {
    const isInitialized = useRef(false)

    useEffect(() => {
        if (!isInitialized.current) {
            if (fieldValue === undefined) {
                helpers.setValue(propValue ?? defaultValue)
            } else if (propValue != null && fieldValue === defaultValue) {
                helpers.setValue(propValue)
            }
            isInitialized.current = true
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
