import React, { Children, isValidElement, PropsWithChildren, useEffect, useState } from "react"
import Section, { SectionProps } from "./Section"
import SectionSidebar, { SectionInfo } from "./SectionSidebar"
import { cn } from "@/src/lib/util/utils"

interface SectionContainerProps {
    children: React.ReactNode;
    className?: string;
    sidebarClassName?: string;
    contentClassName?: string;
}

const SectionContainer: React.FC<SectionContainerProps> = ({
                                                               children,
                                                               className,
                                                               sidebarClassName,
                                                               contentClassName
                                                           }) => {
    const [sections, setSections] = useState<SectionInfo[]>([])

    // Extract section information from children on mount
    useEffect(() => {
        const sectionInfos: SectionInfo[] = []


        // Recursively search for Section components in the children
        const extractSections = (children: React.ReactNode) => {
            Children.forEach(children, (child) => {
                if (isValidElement(child)) {
                    // Check if this is a Section component
                    if (child.type && ((typeof child.type === "function" && child.type.name === "Section")
                        || child.type === Section)) {
                        const props = child.props as SectionProps
                        const id = props.id ?? props.title.toLowerCase().replace(/\s+/g, "-")
                        sectionInfos.push({
                            id,
                            title: props.title
                        })
                    }

                    // Recursively check children
                    if ((child as React.ReactElement<PropsWithChildren>).props.children) {
                        extractSections((child as React.ReactElement<PropsWithChildren>).props.children)
                    }
                }
            })
        }

        extractSections(children)
        setSections(sectionInfos)
    }, [children])

    return (
        <div className={cn("flex flex-row gap-6", className)}>
            <div className={cn("flex-1", contentClassName)}>
                {children}
            </div>
            {sections.length > 0 && (
                <div className={cn("w-64 sticky top-4 self-start hidden lg:block", sidebarClassName)}>
                    <SectionSidebar sections={sections} />
                </div>
            )}
        </div>
    )
}

export default SectionContainer