import React, { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/lib/components/ui/card"
import { Button } from "@/src/lib/components/ui/button"

export interface SectionInfo {
    id: string;
    title: string;
}

interface SectionSidebarProps {
    sections: SectionInfo[];
    className?: string;
}

const SectionSidebar: React.FC<SectionSidebarProps> = ({ sections, className }) => {
    // Function to handle clicking on a section link
    const handleSectionClick = (sectionId: string) => {
        // Get the section element
        const sectionElement = document.getElementById(sectionId)

        if (sectionElement) {
            // Update the URL hash
            window.history.pushState(null, "", `#${sectionId}`)

            // Scroll to the section with smooth behavior
            sectionElement.scrollIntoView({ behavior: "smooth" })
        }
    }

    // Check if there's a hash in the URL on initial load and scroll to that section
    useEffect(() => {
        const hash = window.location.hash.replace("#", "")
        if (hash) {
            const sectionElement = document.getElementById(hash)
            if (sectionElement) {
                // Use a small timeout to ensure the page is fully loaded
                setTimeout(() => {
                    sectionElement.scrollIntoView({ behavior: "smooth" })
                }, 100)
            }
        }
    }, [])

    return (
        <Card className={className}>
            <CardHeader className={"p-4"}>
                <CardTitle className={"text-md"}>Content</CardTitle>
            </CardHeader>
            <CardContent className={"flex flex-col gap-4 p-4 pt-0"}>
                <nav>
                    <ul className="space-y-1">
                        {sections.map((section) => (
                            <li key={section.id} className={"m-0"}>
                                <Button
                                    onClick={() => handleSectionClick(section.id)}
                                    variant={"link"}
                                    size={"sm"}
                                    className={"px-0"}
                                    type={"button"}>
                                    {section.title}
                                </Button>
                            </li>
                        ))}
                    </ul>
                </nav>
            </CardContent>
        </Card>
    )
}

export default SectionSidebar