// components/TreeView.tsx
import React, { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import Tree, { TreeNode } from "@/src/lib/model/categories/Tree"

// Generic type for TreeNode
interface TreeViewProps<T> {
    tree: Tree<T>
    renderNode: (node: T) => React.ReactNode
}

// Recursive TreeView component
export function TreeView<T>({ tree, renderNode }: Readonly<TreeViewProps<T>>) {
    const rootNodes = tree.getRootNodes() // Get the root nodes from the Tree class

    return (
        <ul className="space-y-2">
            {rootNodes.map((node) => (
                <TreeNodeComponent
                    key={`${node.id}`}
                    node={node}
                    renderNode={renderNode}
                    childrenKey={tree.childrenKey}
                />
            ))}
        </ul>
    )
}

// Individual tree node component
function TreeNodeComponent<T>({ node, renderNode, childrenKey }: Readonly<{
    node: TreeNode<T>
    renderNode: (node: TreeNode<T>) => React.ReactNode
    childrenKey: keyof T
}>) {
    const [isExpanded, setIsExpanded] = useState(false)

    const handleToggle = () => setIsExpanded((prev) => !prev)

    const children = node[childrenKey]

    return (
        <li className="flex flex-col">
            <div
                className="flex items-center space-x-2 cursor-pointer"
                onClick={handleToggle}>
                {children && children.length > 0 && (
                    <button
                        className="text-gray-500"
                        title={isExpanded ? "Collapse" : "Expand"}>
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                )}
                <span>{renderNode(node)}</span>
            </div>
            {isExpanded && children && (
                <ul className="ml-4 space-y-2">
                    {children.map((child) => (
                        <TreeNodeComponent
                            key={`${child.id}`}
                            node={child}
                            renderNode={renderNode}
                            childrenKey={childrenKey}
                        />
                    ))}
                </ul>
            )}
        </li>
    )
}
