import { Err } from "./errors";
import { IterableOr, Discriminator, Updater, KeyedReducer, TreeEntry, KeyedMapper, Allocation, ReadonlyTreeEntry } from "./types/helpers";

export class Tree<T> {
    protected _store: {
        [key: string]: TreeEntry<T>;
    };

    constructor() {
        this._store = {};
    }

    /* Basics */

    /**
     * Checks if the tree contains the specified key.
     * @param {string} key The key to check.
     * @returns {boolean} True if the key exists in the tree; otherwise, false.
     * @group Query
     */

    has(key: string): boolean {
        return key in this._store;
    }

    /**
     * Checks if the tree contains a node with the given value.
     * @param {T} value The value to check.
     * @returns {boolean} True if a node with the given value exists in the tree; otherwise, false.
     * @group Query
     */
    contains(value: T): boolean {
        return Object.values(this._store).some((e) => e.value === value);
    }

    /**
     * Checks if any node in the tree satisfies the given discriminator function.
     * @param {(value: T) => boolean} discriminator The discriminator function.
     * @returns {boolean} True if any node satisfies the discriminator function; otherwise, false.
     * @group Query
     */
    some(discriminator: Discriminator<T>): boolean {
        return Object.values(this._store).some((e) => discriminator(e.value));
    }

    /**
     * Returns the key associated with the given value in the tree.
     * @param {T} value The value to find the key for.
     * @returns {string | undefined} The key associated with the value, or undefined if not found.
     * @group Query
     */
    keyOf(value: T): string | undefined {
        return Object.values(this._store).find((v) => {
            return v.value === value;
        })?.key;
    }

    /**
     * Returns the key of the first node that satisfies the given discriminator function.
     * @param {Discriminator<T>} discriminator The discriminator function.
     * @returns {string | undefined} The key of the first node that satisfies the discriminator function, or undefined if not found.
     * @group Query
     */
    findKeyOf(discriminator: Discriminator<T>): string | undefined {
        return Object.values(this._store).find((v) => {
            return discriminator(v.value);
        })?.key;
    }

    /**
     * Checks if the node with the given key is a root of the tree.
     * @param {string} key The key of the node to check.
     * @returns {boolean} True if the node is the root; otherwise, false.
     * @group Query
     */
    isRoot(key: string): boolean {
        return this._store[key]?.parent === null;
    }

    /**
     * Checks if the node with the given key is a leaf node (has no children).
     * @param {string} key The key of the node to check.
     * @returns {boolean} True if the node is a leaf; otherwise, false.
     * @group Query
     */
    isLeaf(key: string): boolean {
        return this.has(key) ? (this._store[key]?.children ?? []).length === 0 : false;
    }

    /**
     * Gets the value associated with the node of the given key.
     * @param {string} key The key of the node to get the value of.
     * @returns {T} The value associated with the node.
     * @group Query
     */
    get(key: string): T | undefined {
        return this._store[key]?.value;
    }

    /**
     * Gives access to the Tree Entry directly for reference reasons; Warning: cannot be modified, lest something get messed up with three internal state.
     * @param {string} key The key of the node to get the entry of.
     * @returns {Readonly TreeEntr<T> | undefined} the tree entry
     * @group Query
     */
    entry(key: string): ReadonlyTreeEntry<T> | undefined {
        return this._store[key];
    }

    /**
     * Calculates the depth of the node with the given key in the tree.
     * The depth is the number of ancestors a node has.
     * @param {string} key The key of the node to calculate the depth for.
     * @returns {number} The depth of the node.
     * @group Query
     */
    depth(key: string): number {
        return this.ancestorKeys(key).length;
    }

    /**
     * How many entries are in the tree
     * @returns {number} The number of entries.
     * @group Query
     */
    size(): number {
        return Object.keys(this._store).length;
    }

    /**
     * How many subtrees are in the tree
     * @returns {number} The number of subtrees
     * @group Query
     */
    subtreeCount(): number {
        return this.rootKeys().length;
    }

    /* Add / Edit / Remove */

    /**
     * Adds a new node to the tree with the given key, parent, and value.
     * If a node with the given key already exists in the tree, this method does nothing.
     * @param {string} key The key of the new node to add.
     * @param {string | null} parent The key of the parent node for the new node. Use `null` if the node is a root node.
     * @param {T} value The value associated with the new node.
     * @group Modify
     */
    add(key: string, parent: string | null, value: T): void {
        if (!this.has(key)) {
            if (parent === null) {
                this._store[key] = {
                    key,
                    parent: null,
                    children: [],
                    value,
                };
            } else if (this.has(parent)) {
                this._store[key] = {
                    key,
                    parent,
                    children: [],
                    value,
                };
                this._store[parent].children.push(key);
            } else {
                throw Err.INVALID_PARENT(parent);
            }
        }
    }

    /**
     * Adds a new root to the tree with the given key, and value.
     * If a node with the given key already exists in the tree, this method does nothing.
     * @param {string} key The key of the new node to add.
     * @param {T} value The value associated with the new node.
     * @group Modify
     */
    addRoot(key: string, value: T): void {
        this.add(key, null, value);
    }

    /**
     * Adds a new node to the tree with the given key, parent, and value.
     * If a node with the given key already exists in the tree, this method does nothing.
     * @param {string} key The key of the new node to add.
     * @param {string} parent The key of the parent node for the new node.
     * @param {T} value The value associated with the new node.
     * @group Modify
     */
    addLeaf(key: string, parent: string, value: T): void {
        this.add(key, parent, value);
    }

    /**
     * Updates the value of an existing node in the tree with the given key.
     * If the node does not exist, this method does nothing.
     * @param {string} key The key of the node to update.
     * @param {T} value The new value to set for the node.
     * @group Modify
     */
    update(key: string, value: T | Updater<T>): void {
        if (this.has(key)) {
            const res = this._store[key].value;
            this._store[key].value = typeof value === "function" ? (value as Updater<T>)(res) : value;
        }
    }

    /**
     * Updates the value of an existing node in the tree with the given key.
     * If the node does not exist, this method does nothing.
     * @param {string} key The key of the node to update.
     * @param {(previous: T) => T} updater The callback that will take in the previous value and return the new value
     * @group Modify
     */
    updateWith(key: string, updater: Updater<T>): void {
        if (this.has(key)) {
            const res = this._store[key].value;
            this._store[key].value = updater(res);
        }
    }

    /**
     * Adds a node to a given parent if it doesn't exist, otherweise will update an existing node and ignore parent
     * @param {string} key The key of the node to update.
     * @param {string | null} parent If the node is to be inserted, it will become a child of this node, otherwise it is ignored
     * @param {T} value The new value to set for the node.
     * @group Modify
     */
    upsert(key: string, parent: string | null, value: T): void {
        if (this.has(key)) {
            this._store[key].value = value;
        } else {
            this.add(key, parent, value);
        }
    }

    /**
     * Adds a node to a given parent if it doesn't exist, otherweise will update an existing node and ignore parent
     * @param {string} key The key of the node to update.
     * @param {string | null} parent If the node is to be inserted, it will become a child of this node, otherwise it is ignored
     * @param {(previous: T | undefined) => T} updater The callback that will take in the previous value and return the new value.
     * @group Modify
     */
    upsertWith(key: string, parent: string | null, updater: Updater<T | undefined, T>): void {
        if (this.has(key)) {
            const prev = this._store[key].value;
            this._store[key].value = updater(prev);
        } else {
            this.add(key, parent, updater(undefined));
        }
    }

    /**
     * Adds a node to a given parent if it doesn't exist, otherweise will update an existing node and move the node to be a child of the designated parent
     * @param {string} key The key of the node to update.
     * @param {string | null} parent If the node is to be inserted, it will become a child of this node, otherwise it is ignored
     * @param {T} value The new value to set for the node.
     * @group Modify
     */
    emplace(key: string, parent: string | null, value: T): void {
        if (this.has(key)) {
            this.move(key, parent);
            this._store[key].value = value;
        } else {
            this.add(key, parent, value);
        }
    }

    /**
     * Adds a node to a given parent if it doesn't exist, otherweise will update an existing node and move the node to be a child of the designated parent
     * @param {string} key The key of the node to update.
     * @param {string | null} parent If the node is to be inserted, it will become a child of this node, otherwise it is ignored
     * @param {(previous: T | undefined) => T} updater The callback that will take in the previous value and return the new value.
     * @group Modify
     */
    emplaceWith(key: string, parent: string | null, updater: Updater<T | undefined, T>): void {
        if (this.has(key)) {
            this.move(key, parent);
            const prev = this._store[key].value;
            this._store[key].value = updater(prev);
        } else {
            this.add(key, parent, updater(undefined));
        }
    }

    /**
     * Will move a node, and by extension its children, to under the designated new parent
     * If the node does not exist, this method does nothing.
     * @param {string} key The key of the node to update.
     * @param {string | null} parent The new parent node.
     * @group Modify
     */
    move(key: string, parent: string | null): void {
        if (this.has(key) && (parent === null || this.has(parent))) {
            const op = this._store[key].parent;
            if (op !== null) {
                this._store[op].children = this._store[op].children.filter((k) => k !== key);
            }
            this._store[key].parent = parent;
            if (parent !== null) {
                this._store[parent].children.push(key);
            }
        }
    }

    /**
     * Removes a node so long as it has no children, otherwise, does nothing.
     * @param {string} key The key of the node to be removed.
     * @returns {T | undefined} The value removed or undefined if it was not removed or the node was not present.
     * @group Modify
     */
    trim(key: string): T | undefined {
        if (this.has(key)) {
            if (this._store[key].children.length === 0) {
                const prev = this._store[key].value;
                const parent = this._store[key].parent;
                if (parent !== null) {
                    this._store[parent].children = this._store[parent].children.filter((k) => k !== key);
                }
                delete this._store[key];
                return prev;
            }
        }
        return undefined;
    }

    /**
     * Grafts a sapling tree into the current tree, connecting it to a specific node.
     * The sapling tree will be added as a subtree rooted at the graft point in the current tree.
     * @param {Tree<T>} sapling The sapling tree to graft into the current tree.
     * @param {string} saplingRoot The key of the root node of the sapling tree to graft.
     * @param {string} graftPoint The key of the node in the current tree where the sapling will be grafted.
     * @group Modify
     */
    graft(sapling: Tree<T>, saplingRoot: string, graftPoint: string): void {
        if (sapling.has(saplingRoot) && this.has(graftPoint)) {
            const r = sapling.get(saplingRoot);
            this.add(saplingRoot, graftPoint, r!);
            sapling.childrenKeys(saplingRoot).forEach((cid) => {
                this.graft.call(this, sapling, cid, saplingRoot);
            });
        }
    }

    /**
     * Adds multiple child nodes to an existing node in the tree with the given key.
     * If the node does not exist, this method does nothing.
     * @param {string} key The key of the node to which children should be added.
     * @param {Iterable<[string, T]> | { [key: string]: T } | Iterable<{ key: string, value: T }> } generation
     * An iterable of `[string, T]` pairs, or an object with key-value pairs, or an iterable of `{ key: string, value: T }` objects.
     * @group Modify
     */
    sprout(key: string, generation: Iterable<[string, T]> | { [key: string]: T } | Iterable<{ key: string; value: T }>): void {
        if (this.has(key)) {
            if (Symbol.iterator in generation) {
                for (const entry of generation) {
                    if (Array.isArray(entry)) {
                        this.add(entry[0], key, entry[1]);
                    } else {
                        this.add(entry.key, key, entry.value);
                    }
                }
            } else {
                Object.entries(generation).forEach(([k, p]) => {
                    this.add(k, key, p);
                });
            }
        }
    }

    /**
     * Truncates the subtree rooted at the node with the given key from the tree and returns a key-value collection of those removed.
     * The original tree will no longer include the node and its descendants.
     * @param {string} key The key of the node that serves as the root of the subtree to be truncated.
     * @returns {{[key: string]: T} | undefined} An object representing the truncated subtree, where the keys are the keys of the nodes,
     * and the values are the values associated with each node (or undefined if the node was not present)
     * @group Modify
     */
    truncate(key: string): { [key: string]: T } | undefined {
        if (this.has(key)) {
            const res = this.wideDescendentKeys(key).reduce<{ [key: string]: T }>(
                (acc, cid) => {
                    acc[cid] = this._store[cid].value;
                    return acc;
                },
                { [key]: this._store[key].value }
            );
            const n = this._store[key];
            n.children.forEach((cid) => {
                this.truncate.call(this, cid);
            });
            if (n.parent !== null) {
                this._store[n.parent].children = this._store[n.parent].children.filter((cid) => cid !== key);
            }
            delete this._store[key];
            return res;
        }
    }

    /**
     * Removes the node with the given key from the tree.
     * that node's childrens become detached within the original tree as additional roots.
     * @param {string} key The key of the node to be removed from the tree.
     * @returns {T | undefined} The value of the node that was removed, or undefined if the node does not exist.
     * @group Modify
     */
    pluck(key: string): T | undefined {
        if (this.has(key)) {
            const n = this._store[key];
            n.children.forEach((cid) => {
                this._store[cid].parent = null;
            });
            if (n.parent !== null) {
                this._store[n.parent].children = this._store[n.parent].children.filter((a) => a !== key);
            }
            delete this._store[key];
            return n.value;
        }
    }

    /**
     * Creates a new tree by pruning the subtree rooted at the node with the given key from the original tree.
     * The pruned tree includes the node and its descendants as a new tree instance. Items are removed from the original tree.
     * @param {string} key The key of the node that serves as the root of the subtree to be pruned.
     * @returns {Tree<T>} A new Tree instance representing the pruned subtree.
     * @group Modify
     */
    prune(key: string): Tree<T> {
        const res = new Tree<T>();
        const migrate = (k: string) => {
            const { parent, children, value } = this._store[k];
            res.add(k, k === key ? null : parent, value);
            children.forEach(migrate);
            delete this._store[k];
        };
        const pKey = this.parentKey(key);
        if (pKey !== undefined && pKey !== null) {
            this._store[pKey].children = this._store[pKey].children.filter((k) => k !== key);
        }
        migrate(key);
        return res;
    }

    /**
     * Removes the node with the given key from the tree and splices its children into its parent's children list.
     * @param {string} key The key of the node to be spliced.
     * @returns {T | undefined} The value of the node that was spliced, or undefined if the node does not exist.
     * @group Modify
     */
    splice(key: string): T | undefined {
        if (this.has(key)) {
            const n = this._store[key];
            const p = n.parent;
            if (p !== null) {
                this._store[p].children = this._store[p].children.filter((k) => k !== key);
            }
            n.children.forEach((cId) => {
                this._store[cId].parent = p;
                if (p !== null) {
                    this._store[p].children.push(cId);
                }
            });
            delete this._store[key];
            return n.value;
        }
    }

    /**
     * Condenses the tree by merging nodes with one child with that one child using the provided merger function.
     * The merger function takes two adjacent nodes 'parent' and 'child', and if applicable, returns a new merged node 'r'.
     * If the merger function returns void, no merge is performed between 'parent' and 'child'.
     * @param {(parent: TreeEntry<T>, child: TreeEntry<T>) => void | { key: string, value: T }} merger - The function to merge adjacent nodes with single children.
     * @group Modify
     */
    condense(merger: (parent: TreeEntry<T>, child: TreeEntry<T>) => void | { key: string; value: T }): void {
        const doMerge = (pKey: string) => {
            const pNode = this._store[pKey];
            if (pNode.children.length === 1) {
                const cKey = pNode.children[0];
                const cNode = this._store[cKey];
                const r = merger(pNode, cNode);
                if (r) {
                    // If 'merger' returns a new node, replace a and b with the new node in 'hold'
                    delete this._store[pKey];
                    delete this._store[cKey];
                    this._store[r.key] = {
                        key: r.key,
                        value: r.value,
                        parent: pNode.parent,
                        children: cNode.children,
                    };

                    // Update parent-child relationship for the merged node
                    if (pNode.parent && this._store[pNode.parent]) {
                        this._store[pNode.parent].children = [...this._store[pNode.parent].children.filter((t) => t !== pKey), r.key];
                    }
                    doMerge(r.key);
                } else {
                    doMerge(cKey); // Continue merging recursively for b's children
                }
            } else {
                // If a has more than one child, recursively merge children
                pNode.children.forEach(doMerge);
            }
        };
        // to de determined: should this be on rootKeys or rootKeys.children...
        this.rootKeys().forEach(doMerge);
    }

    /**
     * Detaches a part of a tree at the given key, and makes that node the root of a new subtree within this tree.
     * @param {string | null} key The key of the node to be detatched - the new root of it's own subtree.
     * @group Modify
     */
    detach(key: string | null): void {
        if (key !== null) {
            const p = this._store[key].parent;
            if (p !== null) {
                this._store[p].children = this._store[p].children.filter((k) => k !== key);
            }
            this._store[key].parent = null;
        }
    }

    /**
     * splits out each subtree as a member of an array
     * @returns {ITree<T>[]} an array of subtrees.
     * @group Query
     */
    subtrees(): Tree<T>[] {
        return this.rootKeys().reduce<Tree<T>[]>((acc, rootKey) => {
            const allKeys = this.deepDescendentKeys(rootKey);
            const nTree = new Tree<T>();
            nTree._store = {
                [rootKey]: this._store[rootKey],
                ...allKeys.reduce<{ [key: string]: TreeEntry<T> }>((acc2, key) => {
                    acc2[key] = this._store[key];
                    return acc2;
                }, {}),
            };
            acc.push(nTree);
            return acc;
        }, []);
    }

    /**
     * Empties the whole forest
     * @group Modify
     */
    clear() {
        this._store = {};
    }

    /**
     * Given a list of nodes, allocate them into the forest.
     * @param {Iterable<F>} list
     * @param {(data: F) => IterableOr<{ key: string; value: T; parent: string | null }> | void} allocator
     * @group Modify
     */
    populate<F>(list: Iterable<F>, allocator: (data: F) => IterableOr<Allocation<T>> | void) {
        const hold: {
            [key: string]: Allocation<T>;
        } = {};

        // Convert the input data entries into nodes and store them in the 'hold' object
        for (const entry of list) {
            const each = allocator(entry);
            if (each) {
                for (const n of Symbol.iterator in each ? each : [each]) {
                    hold[n.key] = n;
                }
            }
        }

        const doAllocation = (k: string) => {
            if (this.has(k)) {
                // already in tree
                return;
            }
            if (!hold[k]) {
                // missing from allocation
                throw Err.UNALLOCATED(k);
            }
            const { parent, value } = hold[k];
            if (parent !== null && !this.has(parent)) {
                doAllocation(parent);
            }
            this.add(k, parent, value);
        };

        Object.keys(hold).forEach(doAllocation);
    }

    /* Hierarchy */

    /**
     * Get the root key of the subtree that this key is in.
     * @param {string} key The key to check.
     * @returns {string} The root key in question.
     * @group Hierarchy
     */
    rootKeyOf(key: string): string | undefined {
        if (this.has(key)) {
            let k = key;
            let p = this.parentKey(k);
            while (p !== null) {
                if (p === undefined) {
                    return;
                }
                k = p;
                p = this.parentKey(k);
            }
            return k;
        }
    }

    /**
     * Returns the key of the parent node of the node with the given key.
     * @param {string} key The key of the node for which to find the parent.
     * @returns {string | null | undefined} The key of the parent node as a string, or null if the node has no parent, or undefined if the node was not in the key
     * @group Hierarchy
     */
    parentKey(key: string): string | null | undefined {
        if (this.has(key)) {
            return this._store[key].parent;
        }
    }

    /**
     * Returns the value of the parent node of the node with the given key.
     * @param {string} key The key of the node for which to find the parent.
     * @returns {T | undefined} The value of the parent node, or undefined if the node has no parent or the key does not exist.
     * @group Hierarchy
     */
    parent(key: string): T | undefined {
        if (this.has(key)) {
            const pid = this.parentKey(key)!;
            if (pid !== null) {
                return this.get(pid);
            }
        }
    }

    /**
     * Returns an array of keys representing the ancestor nodes of the node with the given key.
     * @param {string} key The key of the node for which to find the ancestors.
     * @returns {string[]} An array of keys representing the ancestor nodes.
     * @group Hierarchy
     */
    ancestorKeys(key: string): string[] {
        const t = this._store[key];
        const res = [] as string[];
        if (t && t.parent) {
            res.push(t.parent);
            res.push(...this.ancestorKeys(t.parent));
        }
        return res;
    }

    /**
     * Returns an array of values representing the ancestor nodes of the node with the given key.
     * @param {string} key The key of the node for which to find the ancestors.
     * @returns {T[]} An array of values representing the ancestor nodes.
     * @group Hierarchy
     */
    ancestors(key: string): T[] {
        return this.ancestorKeys(key).map((k) => this._store[k].value);
    }

    /**
     * Returns an array of keys representing the child nodes of the node with the given key.
     * @param {string} key The key of the node for which to find the children.
     * @returns {string[]} An array of keys representing the child nodes.
     * @group Hierarchy
     */
    childrenKeys(key: string): string[] {
        return [...(this._store[key]?.children ?? [])];
    }

    /**
     * Returns an array of values representing the child nodes of the node with the given key.
     * @param {string} key The key of the node for which to find the children.
     * @returns {T[]} An array of values representing the child nodes.
     * @group Hierarchy
     */
    children(key: string): T[] {
        return (this._store[key]?.children ?? []).map((k) => this._store[k].value);
    }

    /**
     * Returns an array of keys representing the sibling nodes of the node with the given key.
     * @param {string} key The key of the node for which to find the siblings.
     * @returns {string[]} An array of keys representing the sibling nodes.
     * @group Hierarchy
     */
    siblingKeys(key: string): string[] {
        if (this.has(key)) {
            const p = this._store[key].parent;
            if (p === null) {
                return this.rootKeys();
            }
            return this._store[p].children.filter((a) => a !== key);
        }
        return [];
    }

    /**
     * Returns an array of values representing the sibling nodes of the node with the given key.
     * @param {string} key The key of the node for which to find the siblings.
     * @returns {T[]} An array of values representing the sibling nodes.
     * @group Hierarchy
     */
    siblings(key: string): T[] {
        if (this.has(key)) {
            return this.siblingKeys(key).map((k) => this._store[k].value);
        }
        return [];
    }

    /**
     * Returns an array of keys representing the descendant nodes of the node with the given key.
     * @param {string} key The key of the node for which to find the descendants.
     * @returns {string[]} An array of keys representing the descendant nodes.
     * @group Hierarchy
     */
    wideDescendentKeys(key: string): string[] {
        const res: string[] = [];
        const traverse = (keys: string[]) => {
            const next: string[] = [];
            keys.forEach((k) => {
                res.push(k);
                next.push(...this.childrenKeys(k));
            });
            if (next.length > 0) {
                traverse(next);
            }
        };
        traverse(this.childrenKeys(key));
        return res;
    }

    /**
     * Returns an array of values representing the descendant nodes of the node with the given key.
     * @param {string} key The key of the node for which to find the descendants.
     * @returns {T[]} An array of values representing the descendant nodes.
     * @group Hierarchy
     */
    wideDescendents(key: string): T[] {
        return this.wideDescendentKeys(key).map((k) => this._store[k].value);
    }

    /**
     * Returns an array of keys representing the descendant nodes of the node with the given key in depth-first order.
     * @param {string} key The key of the node for which to find the descendants.
     * @returns {string[]} An array of keys representing the descendant nodes.
     * @group Hierarchy
     */
    deepDescendentKeys(key: string): string[] {
        const res: string[] = [];
        const traverse = (k: string) => {
            res.push(k);
            this.childrenKeys(k).forEach(traverse);
        };
        this.childrenKeys(key).forEach(traverse);
        return res;
    }

    /**
     * Returns an array of values representing the descendant nodes of the node with the given key in depth-first order.
     * @param {string} key The key of the node for which to find the descendants.
     * @returns {T[]} An array of values representing the descendant nodes.
     * @group Hierarchy
     */
    deepDescendents(key: string): T[] {
        return this.deepDescendentKeys(key).map((k) => this._store[k].value);
    }

    /* Traversal */

    /**
     * Returns an array of keys representing the root nodes of the tree.
     * @returns {string[]} An array of keys representing the root nodes.
     * @group Traversal
     */
    rootKeys(): string[] {
        return Object.keys(this._store).filter((a) => this._store[a].parent === null);
    }

    /**
     * Returns an array of values representing the root nodes of the tree.
     * @returns {T[]} An array of values representing the root nodes.
     * @group Traversal
     */
    rootValues(): T[] {
        return this.rootKeys().map((k) => this._store[k].value);
    }

    /**
     * Returns an array of key-value pairs representing the root nodes of the tree.
     * @returns {[string, T][]} An array of key-value pairs representing the root nodes.
     * @group Traversal
     */
    rootTuples(): [string, T][] {
        return this.rootKeys().map((k) => [k, this._store[k].value]);
    }

    /**
     * Returns an object representing the root nodes of the tree, with keys as node keys and values as node values.
     * @returns {{ [key: string]: T }} An object representing the root nodes.
     * @group Traversal
     */
    rootCollection(): { [key: string]: T } {
        return this.rootKeys().reduce<{ [key: string]: T }>((acc, k) => {
            acc[k] = this._store[k].value;
            return acc;
        }, {});
    }

    /**
     * Returns an array of keys representing the leaf nodes of the tree.
     * @returns {string[]} An array of keys representing the leaf nodes.
     * @group Traversal
     */
    leafKeys(origin: string | string[] = this.rootKeys(), ...moreOrigins: string[]): string[] {
        const from = [...(Array.isArray(origin) ? origin : [origin]), ...moreOrigins];

        //get all leaves
        const allLeaves = Object.keys(this._store).filter((a) => this._store[a].children.length === 0);

        //filter by if ancestors is among 'from' list
        return allLeaves.filter((leafKey) => {
            for (const ancestor of this.ancestorKeys(leafKey)) {
                if (from.includes(ancestor)) {
                    return true;
                }
            }
            return false;
        });
    }

    /**
     * Returns an array of values representing the leaf nodes of the tree.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {T[]} An array of values representing the leaf nodes.
     * @group Traversal
     */
    leafValues(origin?: string | string[], ...moreOrigins: string[]): T[] {
        return this.leafKeys(origin, ...moreOrigins).map((k) => this._store[k].value);
    }

    /**
     * Returns an array of key-value pairs representing the leaf nodes of the tree.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {[string, T][]} An array of key-value pairs representing the leaf nodes.
     * @group Traversal
     */
    leafTuples(origin?: string | string[], ...moreOrigins: string[]): [string, T][] {
        return this.leafKeys(origin, ...moreOrigins).map((k) => [k, this._store[k].value]);
    }

    /**
     * Returns an object representing the leaf nodes of the tree, with keys as node keys and values as node values.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {{ [key: string]: T }} An object representing the leaf nodes.
     * @group Traversal
     */
    leafCollection(origin?: string | string[], ...moreOrigins: string[]): { [key: string]: T } {
        return this.leafKeys(origin, ...moreOrigins).reduce<{ [key: string]: T }>((acc, k) => {
            acc[k] = this._store[k].value;
            return acc;
        }, {});
    }

    /**
     * Returns an array of keys representing the nodes of the tree in a width-first traversal.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {string[]} An array of keys representing the nodes in width-first.
     * @group Traversal
     */
    wideKeys(origin: string | string[] = this.rootKeys(), ...moreOrigins: string[]): string[] {
        const from = [...(Array.isArray(origin) ? origin : [origin]), ...moreOrigins];
        const res = new Set<string>();
        const traverse = (keys: string[]) => {
            const next: string[] = [];
            keys.forEach((k) => {
                res.add(k);
                next.push(...this.childrenKeys(k));
            });
            if (next.length > 0) {
                traverse(next);
            }
        };
        traverse(from);
        return [...res];
    }

    /**
     * Returns an array of values representing the nodes of the tree in a width-first traversal.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {T[]} An array of values representing the nodes in width-first.
     * @group Traversal
     */
    wideValues(origin?: string | string[], ...moreOrigins: string[]): T[] {
        return this.wideKeys(origin, ...moreOrigins).map((k) => this._store[k].value);
    }

    /**
     * Returns an array of key-value tuples representing the nodes of the tree in a width-first traversal.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {[string, T][]} An array of key-value tuples representing the nodes in width-first.
     * @group Traversal
     */
    wideTuples(origin?: string | string[], ...moreOrigins: string[]): [string, T][] {
        return this.wideKeys(origin, ...moreOrigins).map((k) => [k, this._store[k].value]);
    }

    /**
     * Returns an array of key-value pairs representing the nodes of the tree in a width-first traversal.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns { { key: string; value: T }[] } An array of objects representing the key-value pairs of the nodes in width-first.
     * Each object in the array has two properties: `key` (string) representing the key of the node and `value` (type `T`) representing the value associated with the node.
     * @group Traversal
     */
    widePairs(origin?: string | string[], ...moreOrigins: string[]): { key: string; value: T }[] {
        return this.wideKeys(origin, ...moreOrigins).map((key) => ({
            key,
            value: this._store[key].value,
        }));
    }

    /**
     * Applies a reducer function to each node in the tree in a width-first traversal.
     * @param {(key: string, value: T, i: number, accumulation: R) => R} reducer The reducer function to be applied. It takes four arguments:
     * - `key` (string): The key of the current node being processed.
     * - `value` (type `T`): The value associated with the current node being processed.
     * - `i` (number): The index of the current node in the width-first traversal.
     * - `accumulation` (type `R`): The accumulated result from previous reductions.
     * @param {R} start The initial value of the accumulator for the reduction.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {R} The final accumulated result after applying the reducer to all nodes.
     * @group Traversal
     */
    reduceWide<R = void>(reducer: KeyedReducer<T, string, R>, start: R, origin?: string | string[], ...moreOrigins: string[]): R {
        return this.wideKeys(origin, ...moreOrigins).reduce((acc, key, i) => {
            return reducer(this._store[key].value, key, i, acc);
        }, start);
    }

    /**
     * Maps a function to each node in the tree in a wide-order traversal.
     *
     * @template R - The type of the result.
     * @param {KeyedMapper<T, string, R>} mapper - The mapping function to be applied. It takes three arguments:
     *   - `value` (type `T`): The value associated with the current node being processed.
     *   - `key` (string): The key of the current node being processed.
     *   - `i` (number): The index of the current node in the wide-order traversal.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {R[]} - An array containing the results of applying the mapper to all nodes.
     * @group Traversal
     */
    mapWide<R>(mapper: KeyedMapper<T, string, R>, origin?: string | string[], ...moreOrigins: string[]): R[] {
        return this.wideKeys(origin, ...moreOrigins).map<R>((key, i) => {
            return mapper(this._store[key].value, key, i);
        });
    }

    /**
     * Returns an array of keys representing all nodes in the tree in a depth-first traversal.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {string[]} An array of keys representing all nodes in the tree in a depth-first traversal.
     * @group Traversal
     */
    deepKeys(origin: string | string[] = this.rootKeys(), ...moreOrigins: string[]): string[] {
        const from = [...(Array.isArray(origin) ? origin : [origin]), ...moreOrigins];
        const res = new Set<string>();
        const traverse = (key: string) => {
            res.add(key);
            this.childrenKeys(key).forEach(traverse);
        };
        from.forEach(traverse);
        return [...res];
    }

    /**
     * Returns an array of values associated with all nodes in the tree in a depth-first traversal.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {T[]} An array of values associated with all nodes in the tree in a depth-first traversal.
     * @group Traversal
     */
    deepValues(origin?: string | string[], ...moreOrigins: string[]): T[] {
        return this.deepKeys(origin, ...moreOrigins).map((k) => this._store[k].value);
    }

    /**
     * Returns an array of key-value tuples representing all nodes in the tree in a depth-first traversal.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {[string, T][]} An array of key-value tuples representing all nodes in the tree in a depth-first traversal.
     * @group Traversal
     */
    deepTuples(origin?: string | string[], ...moreOrigins: string[]): [string, T][] {
        return this.deepKeys(origin, ...moreOrigins).map((k) => [k, this._store[k].value]);
    }

    /**
     * Returns an array of key-value pairs representing the nodes of the tree in a depth-first traversal.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns { { key: string; value: T }[] } An array of objects representing the key-value pairs of the nodes in depth-first.
     * Each object in the array has two properties: `key` (string) representing the key of the node and `value` (type `T`) representing the value associated with the node.
     * @group Traversal
     */
    deepPairs(origin?: string | string[], ...moreOrigins: string[]): { key: string; value: T }[] {
        return this.deepKeys(origin, ...moreOrigins).map((key) => ({
            key,
            value: this._store[key].value,
        }));
    }

    /**
     * Applies a reducer function to each node in the tree in a depth-first traversal.
     * @param {(key: string, value: T, i: number, accumulation: R) => R} reducer The reducer function to be applied. It takes four arguments:
     * - `key` (string): The key of the current node being processed.
     * - `value` (type `T`): The value associated with the current node being processed.
     * - `i` (number): The index of the current node in the depth-first traversal.
     * - `accumulation` (type `R`): The accumulated result from previous reductions.
     * @param {R} start The initial value of the accumulator for the reduction.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {R} The final accumulated result after applying the reducer to all nodes.
     * @group Traversal
     */
    reduceDeep<R = void>(reducer: KeyedReducer<T, string, R>, start: R, origin?: string | string[], ...moreOrigins: string[]): R {
        return this.deepKeys(origin, ...moreOrigins).reduce((acc, key, i) => {
            return reducer(this._store[key].value, key, i, acc);
        }, start);
    }

    /**
     * Maps a function to each node in the tree in a deep-order traversal.
     *
     * @template R - The type of the result.
     * @param {KeyedMapper<T, string, R>} mapper - The mapping function to be applied. It takes three arguments:
     *   - `value` (type `T`): The value associated with the current node being processed.
     *   - `key` (string): The key of the current node being processed.
     *   - `i` (number): The index of the current node in the deep-order traversal.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {R[]} - An array containing the results of applying the mapper to all nodes.
     * @group Traversal
     */
    mapDeep<R>(mapper: KeyedMapper<T, string, R>, origin?: string | string[], ...moreOrigins: string[]): R[] {
        return this.deepKeys(origin, ...moreOrigins).map<R>((key, i) => {
            return mapper(this._store[key].value, key, i);
        });
    }

    /**
     * Returns an array of keys representing the nodes of the tree in a width-first traversal starting from leaf nodes.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {string[]} An array of keys representing the nodes in width-first starting from leaf nodes.
     * @group Traversal
     */
    wideUpwardKeys(origin?: string | string[], ...moreOrigins: string[]): string[] {
        const from = [...(Array.isArray(origin) ? origin : [origin]), ...moreOrigins];
        const visited = new Set<string>();

        const traverse = (keys: string[]) => {
            const next: string[] = [];
            keys.forEach((k) => {
                visited.add(k);
                if (!from.includes(k)) {
                    //stop at origin, please
                    const p = this.parentKey(k);
                    if (p !== null && p !== undefined) {
                        next.push(p);
                    }
                }
            });
            if (next.length > 0) {
                traverse(next);
            }
        };
        traverse(this.leafKeys(...from));
        return [...visited];
    }

    /**
     * Returns an array of values representing the nodes of the tree in a width-first traversal starting from leaf nodes.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {T[]} An array of values representing the nodes in width-first starting from leaf nodes.
     * @group Traversal
     */
    wideUpwardValues(origin?: string | string[], ...moreOrigins: string[]): T[] {
        return this.wideUpwardKeys(origin, ...moreOrigins).map((k) => this._store[k].value);
    }

    /**
     * Returns an array of key-value pairs representing the nodes of the tree in a width-first traversal starting from leaf nodes.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {[string, T][]} An array of key-value pairs representing the nodes in width-first starting from leaf nodes.
     * @group Traversal
     */
    wideUpwardTuples(origin?: string | string[], ...moreOrigins: string[]): [string, T][] {
        return this.wideUpwardKeys(origin, ...moreOrigins).map((k) => [k, this._store[k].value]);
    }

    /**
     * Returns an array of key-value pairs representing the nodes of the tree in a width-first traversal starting from leaf nodes.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns { { key: string; value: T }[] } An array of objects representing the key-value pairs of the nodes in width-first.
     * Each object in the array has two properties: `key` (string) representing the key of the node and `value` (type `T`) representing the value associated with the node.
     * @group Traversal
     */
    wideUpwardPairs(origin?: string | string[], ...moreOrigins: string[]): { key: string; value: T }[] {
        return this.wideUpwardKeys(origin, ...moreOrigins).map((key) => ({
            key,
            value: this._store[key].value,
        }));
    }

    /**
     * Applies a reducer function to each node in the tree in a width-first traversal.
     * @param {(key: string, value: T, i: number, accumulation: R) => R} reducer The reducer function to be applied. It takes four arguments:
     * - `key` (string): The key of the current node being processed.
     * - `value` (type `T`): The value associated with the current node being processed.
     * - `i` (number): The index of the current node in the width-first traversal.
     * - `accumulation` (type `R`): The accumulated result from previous reductions.
     * @param {R} start The initial value of the accumulator for the reduction.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {R} The final accumulated result after applying the reducer to all nodes.
     * @group Traversal
     */
    reduceUpwardsWide<R = void>(reducer: KeyedReducer<T, string, R>, start: R, origin?: string | string[], ...moreOrigins: string[]): R {
        return this.wideUpwardKeys(origin, ...moreOrigins).reduce((acc, key, i) => {
            return reducer(this._store[key].value, key, i, acc);
        }, start);
    }

    /**
     * Maps a function to each node in the tree in a wide-order traversal, starting at leaves and going upwards towards roots.
     *
     * @template R - The type of the result.
     * @param {KeyedMapper<T, string, R>} mapper - The mapping function to be applied. It takes three arguments:
     *   - `value` (type `T`): The value associated with the current node being processed.
     *   - `key` (string): The key of the current node being processed.
     *   - `i` (number): The index of the current node in the wide-order traversal.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {R[]} - An array containing the results of applying the mapper to all nodes.
     * @group Traversal
     */
    mapUpwardsWide<R>(mapper: KeyedMapper<T, string, R>, origin?: string | string[], ...moreOrigins: string[]): R[] {
        return this.wideUpwardKeys(origin, ...moreOrigins).map<R>((key, i) => {
            return mapper(this._store[key].value, key, i);
        });
    }

    /**
     * Returns an array of keys representing all nodes in the tree in a depth-first traversal.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {string[]} An array of keys representing all nodes in the tree in a depth-first traversal.
     * @group Traversal
     */
    deepUpwardKeys(origin?: string | string[], ...moreOrigins: string[]): string[] {
        const from = [...(Array.isArray(origin) ? origin : [origin]), ...moreOrigins];
        const visited = new Set<string>();
        const traverse = (k: string) => {
            visited.add(k);
            if (!from.includes(k)) {
                //stop at origin
                const p = this.parentKey(k);
                if (p !== null && p !== undefined) {
                    traverse(p);
                }
            }
        };
        this.leafKeys(...from).forEach(traverse);
        return [...visited];
    }

    /**
     * Returns an array of values associated with all nodes in the tree in a depth-first traversal.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {T[]} An array of values associated with all nodes in the tree in a depth-first traversal.
     * @group Traversal
     */
    deepUpwardValues(origin?: string | string[], ...moreOrigins: string[]): T[] {
        return this.deepUpwardKeys(origin, ...moreOrigins).map((k) => this._store[k].value);
    }

    /**
     * Returns an array of key-value tuples representing all nodes in the tree in a depth-first traversal.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {[string, T][]} An array of key-value tuples representing all nodes in the tree in a depth-first traversal.
     * @group Traversal
     */
    deepUpwardTuples(origin?: string | string[], ...moreOrigins: string[]): [string, T][] {
        return this.deepUpwardKeys(origin, ...moreOrigins).map((k) => [k, this._store[k].value]);
    }

    /**
     * Returns an array of key-value pairs representing all nodes in the tree in a depth-first traversal.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns { { key: string; value: T }[] } An array of key-value pairs representing all nodes in the tree in a depth-first traversal.
     * @group Traversal
     */
    deepUpwardPairs(origin?: string | string[], ...moreOrigins: string[]): { key: string; value: T }[] {
        return this.deepUpwardKeys(origin, ...moreOrigins).map((key) => ({
            key,
            value: this._store[key].value,
        }));
    }

    /**
     * Applies a reducer function to each node in the tree in a depth-first traversal.
     * @param {(key: string, value: T, i: number, accumulation: R) => R} reducer The reducer function to be applied. It takes four arguments:
     * - `key` (string): The key of the current node being processed.
     * - `value` (type `T`): The value associated with the current node being processed.
     * - `i` (number): The index of the current node in the depth-first traversal.
     * - `accumulation` (type `R`): The accumulated result from previous reductions.
     * @param {R} start The initial value of the accumulator for the reduction.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {R} The final accumulated result after applying the reducer to all nodes.
     * @group Traversal
     */
    reduceUpwardsDeep<R = void>(reducer: KeyedReducer<T, string, R>, start: R, origin?: string | string[], ...moreOrigins: string[]): R {
        return this.deepUpwardKeys(origin, ...moreOrigins).reduce((acc, key, i) => {
            return reducer(this._store[key].value, key, i, acc);
        }, start);
    }

    /**
     * Maps a function to each node in the tree in a deep-order traversal, starting at leaves and going upwards towards roots.
     *
     * @template R - The type of the result.
     * @param {KeyedMapper<T, string, R>} mapper - The mapping function to be applied. It takes three arguments:
     *   - `value` (type `T`): The value associated with the current node being processed.
     *   - `key` (string): The key of the current node being processed.
     *   - `i` (number): The index of the current node in the deep-order traversal.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {R[]} - An array containing the results of applying the mapper to all nodes.
     * @group Traversal
     */
    mapUpwardsDeep<R>(mapper: KeyedMapper<T, string, R>, origin?: string | string[], ...moreOrigins: string[]): R[] {
        return this.deepUpwardKeys(origin, ...moreOrigins).map<R>((key, i) => {
            return mapper(this._store[key].value, key, i);
        });
    }

    /* Paths */

    // TODO: should unfindable paths return undefined rather than an empty array?

    /**
     * Finds the keys representing the path from one node to another in the tree, if it exists. If no such path is viable, the array will be empty.
     * @param {string} from The key of the starting node.
     * @param {string} to The key of the ending node.
     * @returns {string[]} An array of keys representing the path from the starting node to the ending node, if it exists. If no such path is viable, the array will be empty.
     * @group Traversal
     */
    pathKeys(from: string, to: string): string[] {
        if (from === to) {
            return [from];
        }
        let fromHead = this._store[from];
        let toHead = this._store[to];
        if (!fromHead || !toHead) {
            return [] as string[];
        }
        let fromRoot = fromHead.parent === null ? fromHead.key : null;
        let toRoot = toHead.parent === null ? toHead.key : null;
        const pathFrom = [from];
        const pathTo = [to];
        let fromSearchlight = -1;
        let toSearchlight = -1;

        while (fromSearchlight === -1 || toSearchlight === -1) {
            if (fromRoot && toRoot) {
                if (fromRoot !== toRoot) {
                    // not the same root
                    return [];
                }
                return [...pathFrom.slice(0, -1), toRoot, ...pathTo.slice(0, -1).reverse()];
            }
            if (!fromRoot) {
                //from-leg is still searching up the tree
                fromSearchlight = pathTo.indexOf(fromHead.key);
                if (fromHead.parent !== null) {
                    pathFrom.push(fromHead.parent);
                    fromHead = this._store[fromHead.parent];
                }
                //stop searching upwards if you've found root
            }
            if (!toRoot) {
                //to-leg is still searching up the tree
                toSearchlight = pathFrom.indexOf(toHead.key);
                if (toHead.parent !== null) {
                    pathTo.push(toHead.parent);
                    toHead = this._store[toHead.parent];
                }
                //stop searching upwards if you've found root
            }
            toRoot = toHead.parent === null ? toHead.key : toRoot;
            fromRoot = fromHead.parent === null ? fromHead.key : fromRoot;
        }
        return [...pathFrom.slice(0, toSearchlight), ...pathTo.slice(0, fromSearchlight).reverse()];
    }

    /**
     * Finds the values associated with the nodes along the path from one node to another in the tree, if it exists.
     * @param {string} from The key of the starting node.
     * @param {string} to The key of the ending node.
     * @returns {T[]} An array of values associated with the nodes along the path from the starting node to the ending node, if it exists.
     * @group Traversal
     */
    pathValues(from: string, to: string): T[] {
        return this.pathKeys(from, to).map((each) => this._store[each].value);
    }

    /**
     * Finds the key-value tuples representing the nodes along the path from one node to another in the tree, if it exists.
     * @param {string} from The key of the starting node.
     * @param {string} to The key of the ending node.
     * @returns {[string, T][]} An array of key-value tuples representing the nodes along the path from the starting node to the ending node, if it exists.
     * @group Traversal
     */
    pathTuples(from: string, to: string): [string, T][] {
        return this.pathKeys(from, to).map((each) => [each, this._store[each].value]);
    }

    /**
     * Returns an array of key-value representing the nodes along the path from one node to another in the tree, if it exists.
     * @param {string} from The key of the starting node.
     * @param {string} to The key of the ending node.
     * @returns { { key: string; value: T }[] } An array of objects representing the key-value pairs of the nodes in depth-first.
     * Each object in the array has two properties: `key` (string) representing the key of the node and `value` (type `T`) representing the value associated with the node.
     * @group Traversal
     */
    pathPairs(from: string, to: string): { key: string; value: T }[] {
        return this.pathKeys(from, to).map((key) => ({
            key,
            value: this._store[key].value,
        }));
    }

    /**
     * Applies a reducer function to each node along the path from one node to another in the tree, if it exists.
     * @param {string} from The key of the starting node.
     * @param {string} to The key of the ending node.
     * @param {(key: string, value: T, i: number, accumulation: R) => R} reducer The reducer function to be applied. It takes four arguments:
     * - `key` (string): The key of the current node being processed.
     * - `value` (type `T`): The value associated with the current node being processed.
     * - `i` (number): The index of the current node along the path.
     * - `accumulation` (type `R`): The accumulated result from previous reductions.
     * @param {R} start The initial value of the accumulator for the reduction.
     * @returns {R} The final accumulated result after applying the reducer to all nodes along the path.
     * @group Traversal
     */
    reducePath<R = void>(from: string, to: string, reducer: KeyedReducer<T, string, R>, start: R): R {
        return this.pathKeys(from, to).reduce((acc, key, i) => {
            return reducer(this._store[key].value, key, i, acc);
        }, start);
    }

    /**
     * Maps a function to each node in the a path starting at 'from' node and ending at 'to' node.
     *
     * @template R - The type of the result.
     * @param {string} from The key of the starting node.
     * @param {string} to The key of the ending node.
     * @param {KeyedMapper<T, string, R>} mapper - The mapping function to be applied. It takes three arguments:
     *   - `value` (type `T`): The value associated with the current node being processed.
     *   - `key` (string): The key of the current node being processed.
     *   - `i` (number): The index of the current node in the wide-order traversal.
     * @returns {R[]} - An array containing the results of applying the mapper to all nodes.
     * @group Traversal
     */
    mapPath<R = void>(from: string, to: string, mapper: KeyedMapper<T, string, R>): R[] {
        return this.pathKeys(from, to).map((key, i) => {
            return mapper(this._store[key].value, key, i);
        });
    }
}
