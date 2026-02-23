"use client"

import { useCallback, useEffect } from "react"

const THEME_COOKIE_NAME = "financer-theme"
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

function setThemeCookie(theme: string) {
    document.cookie = `${THEME_COOKIE_NAME}=${theme};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`
}

const Theme = ({ theme }: { theme: string }) => {
    const applyTheme = useCallback(() => {
        if (theme === "system") {
            const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches
            document.documentElement.classList.toggle("dark", isDark)
        } else {
            document.documentElement.classList.toggle("dark", theme === "dark")
        }
    }, [theme])

    useEffect(() => {
        setThemeCookie(theme)
        applyTheme()

        if (theme === "system") {
            const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
            const handler = () => applyTheme()
            mediaQuery.addEventListener("change", handler)
            return () => mediaQuery.removeEventListener("change", handler)
        }
    }, [theme, applyTheme])

    return null
}

export default Theme
