"use client"

const Theme = ({ theme }: { theme: string }) => {
    if (theme === "dark") {
        document.documentElement.classList.add("dark")
    } else {
        document.documentElement.classList.remove("dark")
    }

    return (
        <></>
    )
}

export default Theme