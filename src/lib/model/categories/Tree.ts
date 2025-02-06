export type TreeNode<T> = T & {
    [key: string]: TreeNode<T>[] | undefined // This makes the child property dynamic
}

export default class Tree<T> {
    public readonly nodes: TreeNode<T>[]
    public readonly childrenKey: keyof T
    public readonly idKey: keyof T
    public readonly parentKey: keyof T

    private constructor(items: TreeNode<T>[], idKey: keyof T, parentKey: keyof T, childrenKey: keyof T) {
        this.nodes = items
        this.idKey = idKey
        this.parentKey = parentKey
        this.childrenKey = childrenKey
    }

    /**
     * Factory method to create a Tree from a flat list of nodes.
     * @param items - The flat list of nodes.
     * @param idKey - The key identifying the ID of a node.
     * @param parentKey - The key identifying the parent ID of a node.
     * @param childrenKey - The key used to store child nodes.
     */
    static fromFlatList<T>(
        items: T[],
        idKey: keyof T,
        parentKey: keyof T,
        childrenKey: keyof T
    ): Tree<T> {
        const nodes = this.buildTree(items, idKey, parentKey, childrenKey)
        return new Tree(nodes, idKey, parentKey, childrenKey)
    }


    /**
     * Factory method to create a Tree from an already structured tree.
     * @param structuredNodes - The tree structure.
     * @param idKey - The key identifying the ID of a node.
     * @param parentKey - The key identifying the parent ID of a node.
     * @param childrenKey - The key used to store child nodes.
     */
    static fromStructuredTree<T>(
        structuredNodes: TreeNode<T>[],
        idKey: keyof T,
        parentKey: keyof T,
        childrenKey: keyof T
    ): Tree<T> {
        return new Tree(structuredNodes, idKey, parentKey, childrenKey)
    }

    private static buildTree<T>(
        items: T[],
        idKey: keyof T,
        parentKey: keyof T,
        childrenKey: keyof T
    ): TreeNode<T>[] {
        const nodeMap = new Map<any, TreeNode<T>>() // Map to store nodes by their ID
        const tree: TreeNode<T>[] = [] // This will hold the root nodes

        // Initialize all nodes with a dynamic children property
        items.forEach((item) => {
            const node = { ...item, [childrenKey]: [] } as TreeNode<T>
            nodeMap.set(item[idKey], node)
        })

        // Build the tree structure
        items.forEach((item) => {
            const node = nodeMap.get(item[idKey])! // Current node
            const parentId = item[parentKey] // Parent ID

            // If the node has a parent, add it to its parent's children array
            if (parentId && nodeMap.has(parentId)) {
                const parentNode = nodeMap.get(parentId)!
                ;(parentNode[childrenKey] as TreeNode<T>[]).push(node)
            } else {
                // If no parent, it's a root node, add it to the tree
                tree.push(node)
            }
        })

        return tree
    }

    getRootNodes(): TreeNode<T>[] {
        return this.nodes
    }

    flatten(): T[] {
        const result: T[] = []

        const traverse = (node: TreeNode<T>) => {
            // Extract the original item (without children) and add it to the result
            const { [this.childrenKey]: _, ...data } = node
            result.push(data as T)
            // Recursively process children
            const children = node[this.childrenKey]
            if (children) {
                children.forEach(traverse)
            }
        }

        this.nodes.forEach(traverse)
        return result
    }

    findNode(predicate: (node: TreeNode<T>) => boolean): TreeNode<T> | undefined {
        let result: TreeNode<T> | undefined = undefined

        const traverse = (node: TreeNode<T>) => {
            if (predicate(node)) {
                result = node
                return true // Stop searching
            }
            const children = node[this.childrenKey]
            if (children) {
                for (const child of children) {
                    if (traverse(child)) return true
                }
            }
            return false
        }

        for (const node of this.nodes) {
            if (traverse(node)) break
        }

        return result
    }

    filter(predicate: (node: TreeNode<T>) => boolean): Tree<T> {
        const filterNodes = (nodes: TreeNode<T>[]): TreeNode<T>[] => {
            return nodes
                .map((node) => {
                    const children = node[this.childrenKey]
                    const filteredChildren = children ? filterNodes(children) : []

                    if (predicate(node) || (filteredChildren && filteredChildren.length > 0)) {
                        return {
                            ...node,
                            [this.childrenKey]: filteredChildren
                        }
                    }

                    return null
                })
                .filter((node): node is TreeNode<T> => node !== null)
        }

        const filteredNodes = filterNodes(this.nodes)
        return Tree.fromStructuredTree<T>(filteredNodes, this.idKey, this.parentKey, this.childrenKey)
    }
}