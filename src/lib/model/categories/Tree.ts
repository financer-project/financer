export class TreeNode<T> {
    protected readonly _data: T | null
    protected readonly children: TreeNode<T>[]
    protected readonly idKey: keyof T
    protected readonly parentKey: keyof T

    protected constructor(data: T | null, children: TreeNode<T>[], idKey: keyof T, parentKey: keyof T) {
        this._data = data
        this.children = children
        this.idKey = idKey
        this.parentKey = parentKey
    }

    /**
     * Factory method to create a Tree from a flat list of nodes.
     * @param items - The flat list of nodes.
     * @param idKey - The key identifying the ID of a node.
     * @param parentKey - The key identifying the parent ID of a node.
     */
    static fromFlatList<T>(
        items: T[],
        idKey: keyof T,
        parentKey: keyof T
    ): Tree<T> {
        // 1) Create all TreeNode instances and index them by their ID
        const nodeMap = new Map<T[typeof idKey], TreeNode<T>>()
        for (const item of items) {
            const node = new TreeNode(item, [], idKey, parentKey)
            nodeMap.set(item[idKey], node)
        }

        // 2) Link children to parents, collect roots
        const roots: TreeNode<T>[] = []
        for (const item of items) {
            const node = nodeMap.get(item[idKey])!
            const parentId = item[parentKey]

            // Explicitly check for null/undefined (accepts 0 or '')
            if (parentId != null && nodeMap.has(parentId)) {
                const parent = nodeMap.get(parentId)!
                parent.children.push(node)
            } else {
                roots.push(node)
            }
        }

        return new Tree(roots, idKey, parentKey)
    }

    /**
     * Get the ID of this node
     */
    get id() {
        if (this.data) {
            return this.data[this.idKey]
        }
        return null
    }

    /**
     * Get the parent ID of this node
     */
    get parentId() {
        if (this.data) {
            return this.data[this.parentKey]
        }
        return null
    }

    get data(): T {
        if (!this._data) {
            throw new Error("Cannot access data of a null node")
        }
        return this._data
    }

    getChildren(): TreeNode<T>[] {
        return this.children
    }

    /**
     * Find a node in the tree that matches the predicate
     */
    findNode(predicate: (node: TreeNode<T>) => boolean): TreeNode<T> | null {
        if (predicate(this)) {
            return this
        }

        for (const child of this.children) {
            const found = child.findNode(predicate)
            if (found) {
                return found
            }
        }

        return null
    }

    /**
     * Filter the tree to only include nodes that match the predicate
     * or have descendants that match the predicate
     */
    filter(predicate: (node: TreeNode<T>) => boolean): TreeNode<T> | null {
        const filteredChildren = this.children
            .map(child => child.filter(predicate))
            .filter((node): node is TreeNode<T> => node !== null)

        if (predicate(this) || filteredChildren.length > 0) {
            return new TreeNode(
                this._data,
                filteredChildren,
                this.idKey,
                this.parentKey
            )
        }

        return null
    }

    /**
     * Traverse all nodes in the tree and call the callback for each node
     */
    traverseNodes(callback: (node: TreeNode<T>) => void): void {
        callback(this)
        this.children.forEach(child => child.traverseNodes(callback))
    }

    /**
     * Get all nodes in the tree as a flat array
     */
    flatten(): TreeNode<T>[] {
        const nodes: TreeNode<T>[] = []
        this.traverseNodes(node => nodes.push(node))
        return nodes
    }
}

export class Tree<T> extends TreeNode<T> {
    constructor(rootNodes: TreeNode<T>[], idKey: keyof T, parentKey: keyof T) {
        super(null, rootNodes, idKey, parentKey)
    }

    override flatten(): TreeNode<T>[] {
        return this.children.flatMap(child => child.flatten())
    }

    override findNode(predicate: (node: TreeNode<T>) => boolean): TreeNode<T> | null {
        return this.children.find(child => child.findNode(predicate)) ?? null
    }

    override filter(predicate: (node: TreeNode<T>) => boolean): TreeNode<T> | null {
        const result = this.children.filter(child => child.filter(predicate))
        if (result.length > 0) {
            return new Tree(result, this.idKey, this.parentKey)
        }
        return null
    }

    override traverseNodes(callback: (node: TreeNode<T>) => void): void {
        this.children.forEach(child => child.traverseNodes(callback))
    }
}
