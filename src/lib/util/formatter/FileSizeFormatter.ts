const UNITS = ["B", "KB", "MB", "GB", "TB"] as const

export type FileSizeUnit = (typeof UNITS)[number]

export interface FileSizeFormatOptions {
    /** Number of decimal places (default: 1) */
    decimals?: number
    /** Force a specific unit instead of auto-detecting */
    unit?: FileSizeUnit
}

/**
 * Formats a file size in bytes to a human-readable string.
 * @param bytes - The file size in bytes
 * @param options - Formatting options
 * @returns Formatted string like "1.5 MB"
 */
export function formatFileSize(bytes: number, options?: FileSizeFormatOptions): string {
    const { decimals = 1, unit } = options ?? {}

    if (bytes === 0) return `0 ${unit ?? "B"}`

    if (unit) {
        const unitIndex = UNITS.indexOf(unit)
        const divisor = Math.pow(1024, unitIndex)
        return `${(bytes / divisor).toFixed(decimals)} ${unit}`
    }

    const unitIndex = Math.min(
        Math.floor(Math.log(bytes) / Math.log(1024)),
        UNITS.length - 1
    )
    const size = bytes / Math.pow(1024, unitIndex)

    return `${size.toFixed(decimals)} ${UNITS[unitIndex]}`
}
