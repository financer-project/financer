import React, { useState } from "react"
import { ChevronDown, ChevronRight, Squirrel } from "lucide-react"
import Tree, { TreeNode } from "@/src/lib/model/categories/Tree"
import { cn } from "@/lib/utils"

interface TreeViewProps<T> {
    tree: Tree<T>
    renderNode: (node: T) => React.ReactNode
    expandedAll?: boolean
}

export function TreeView<T>({ tree, renderNode, expandedAll }: Readonly<TreeViewProps<T>>) {
    const rootNodes = tree.getRootNodes()

    if (!rootNodes || rootNodes.length === 0) {
        return (
            <div className={"flex flex-col items-center w-full text-muted-foreground gap-2"}>
                <Squirrel size={32} />
                <p className={" text-sm mb-4"}>No data.</p>
            </div>
        )
    }

    return (
        <ul className="flex flex-col gap-2">
            {rootNodes.map((node) => (
                <TreeNodeComponent
                    key={`${node.id}`}
                    node={node}
                    renderNode={renderNode}
                    childrenKey={tree.childrenKey}
                    expandedAll={expandedAll}
                />
            ))}
        </ul>
    )
}

function TreeNodeComponent<T>({ node, renderNode, childrenKey, expandedAll }: Readonly<{
    node: TreeNode<T>
    renderNode: (node: TreeNode<T>) => React.ReactNode
    childrenKey: keyof T,
    expandedAll?: boolean
}>) {
    const [isExpanded, setIsExpanded] = useState<boolean>(expandedAll ?? false)

    const children = node[childrenKey] && node[childrenKey].length > 0 ? node[childrenKey] : undefined

    React.useEffect(() => {
        setIsExpanded(expandedAll ?? false)
    }, [expandedAll])


    const handleToggle = () => {
        if (children && children.length > 0) {
            setIsExpanded((prev) => !prev)
        }
    }

    return (
        <li className="flex flex-col gap-1 ml-2">
            <div
                className="flex items-center space-x-2 cursor-pointer"
                onClick={handleToggle}>
                <span
                    className={cn("text-gray-500", children ? "" : "hidden")}
                    title={isExpanded ? "Collapse" : "Expand"}>
                    {isExpanded
                        ? <ChevronDown size={16} />
                        : <ChevronRight size={16} />}
                </span>
                <span className={"hover:bg-accent rounded-md transition py-1 px-2 w-full"}>{renderNode(node)}</span>
            </div>
            {isExpanded && children && (
                <ul className={cn("ml-2 border-l-1 pl-4")}>
                    {children.map((child) => (
                        <TreeNodeComponent
                            key={`${child.id}`}
                            node={child}
                            renderNode={renderNode}
                            childrenKey={childrenKey}
                            expandedAll={expandedAll}
                        />
                    ))}
                </ul>
            )}
        </li>
    )
}
