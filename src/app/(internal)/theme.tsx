"use client"

import { useEffect } from "react"

const Theme = ({ theme }: { theme: string }) => {
    useEffect(() => {
        if (theme === "dark") {
            document.documentElement.classList.add("dark")
        } else {
            document.documentElement.classList.remove("dark")
        }
    }, [theme]) // Runs the effect whenever the 'theme' prop changes

    return (<></>)
}

export default Theme