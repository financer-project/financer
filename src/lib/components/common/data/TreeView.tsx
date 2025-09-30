import React, { useState } from "react"
import { ChevronDown, ChevronRight, Squirrel } from "lucide-react"
import { Tree, TreeNode } from "@/src/lib/model/categories/Tree"
import { cn } from "@/src/lib/util/utils"
import { useRouter } from "next/navigation"
import { Separator } from "../../ui/separator"
import { sort } from "d3-array"

interface TreeViewProps<T> {
    tree: Tree<T> | TreeNode<T> | null
    renderNode: (node: T) => React.ReactNode
    itemRoute: (item: T) => string
    expandedAll?: boolean,
    sort?: (a: T, b: T) => number
}

export function TreeView<T>({ tree, renderNode, itemRoute, expandedAll, sort }: Readonly<TreeViewProps<T>>) {
    if (!tree || tree.getChildren().length === 0) {
        return (
            <div className={"flex flex-col items-center w-full text-muted-foreground gap-2"}>
                <Squirrel size={32} />
                <p className={" text-sm mb-4"}>No data.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-2">
            {tree.getChildren()
                .sort((a, b) => sort ? sort(a.data, b.data) : 0)
                .map((node) => (
                    <TreeNodeComponent
                        key={`${node.id}`}
                        node={node}
                        renderNode={renderNode}
                        itemRoute={itemRoute}
                        expandedAll={expandedAll}
                        sort={sort}
                    />
                ))}
        </div>
    )
}

export function TreeNodeComponent<T>({ node, renderNode, itemRoute, expandedAll, sort }: Readonly<{
    node: TreeNode<T>
    renderNode: (node: T) => React.ReactNode
    itemRoute: (item: T) => string
    expandedAll?: boolean,
    sort?: (a: T, b: T) => number
}>) {
    const [isExpanded, setIsExpanded] = useState<boolean>(expandedAll ?? false)
    const router = useRouter()

    const children = node.getChildren() && node.getChildren().length > 0 ? node.getChildren() : undefined

    React.useEffect(() => {
        setIsExpanded(expandedAll ?? false)
    }, [expandedAll])


    const handleToggle = () => {
        if (children && children.length > 0) {
            setIsExpanded((prev) => !prev)
        }
    }

    return (
        <div className="flex flex-col gap-1 ms-2">
            <div className="flex items-center space-x-2 cursor-pointer">
                <span
                    className={cn("text-gray-500", children ? "" : "invisible")}
                    title={isExpanded ? "Collapse" : "Expand"}
                    onClick={handleToggle}>
                    {isExpanded
                        ? <ChevronDown size={16} />
                        : <ChevronRight size={16} />}
                </span>
                <span className={"hover:bg-accent rounded-md transition py-1 px-2 w-full"}
                      onClick={() => router.push(itemRoute(node.data))}>
                    {renderNode(node.data)}
                </span>
            </div>
            {isExpanded && children && (
                <div className={"flex flex-row gap-4 px-2"}>
                    <Separator orientation={"vertical"} />
                    <div className={"flex flex-col w-full"}>
                        {children
                            .sort((a, b) => sort ? sort(a.data, b.data) : 0)
                            .map((child) => (
                            <TreeNodeComponent
                                key={`${child.id}`}
                                node={child}
                                renderNode={renderNode}
                                itemRoute={itemRoute}
                                expandedAll={expandedAll}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
