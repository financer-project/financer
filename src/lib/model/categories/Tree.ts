export type TreeNode<T> = T & {
    [key: string]: TreeNode<T>[] | undefined // This makes the child property dynamic
}

export default class Tree<T> {

    public readonly nodes: TreeNode<T>[]
    public readonly childrenKey: keyof T
    public readonly idKey: keyof T
    public readonly parentKey: keyof T

    constructor(items: T[], idKey: keyof T, parentKey: keyof T, childrenKey: keyof T) {
        this.idKey = idKey
        this.parentKey = parentKey
        this.childrenKey = childrenKey
        this.nodes = Tree.buildTree(items, idKey, parentKey, childrenKey)
    }

    static buildTree<T>(
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
            const children = node[this.childrenKey] as TreeNode<T>[] | undefined
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
            const children = node[this.childrenKey] as TreeNode<T>[] | undefined
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
}