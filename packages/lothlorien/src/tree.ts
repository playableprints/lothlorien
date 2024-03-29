import { Err } from "./errors";
import { IterableOr, Discriminator, Updater, KeyedReducer, TreeEntry, KeyedMapper, Allocation, ReadonlyTreeEntry } from "./types";

/*
    nKeys,
    nValues,
        SOMETHINGs(key: string): T[] { return this.SOMETHINGValues(key); }
        SOMETHINGValues(key: string): T[] {
            return this.SOMETHINGKeys(key).map((k) => this._store[k].value);
        }
        SOMETHINGTuples(key: string): [string, T][] {
            return this.SOMETHINGKeys(key).map((k) => [k, this._store[k].value])
        }
        SOMETHINGCollection(key: string): { [key: string]: T } {
            return this.SOMETHINGKeys(key).reduce<{ [key: string]: T }>((acc, k) => {
                acc[k] = this._store[k].value;
                return acc;
            }, {})
        }
        SOMETHINGPairs(key: string): {key: string, value: T}[] {
            return this.SOMETHINGKeys(key).map((key) => ({
                key,
                value: this._store[key].value,
            }));
        }
        reduceSOMETHING<R = void>(reducer: KeyedReducer<T, string, R>, start: R, key: string): R {
            return this.SOMETHINGKeys(key).reduce((acc, key, i) => {
                return reducer(this._store[key].value, key, i, acc);
            }, start)
        }
        mapSOMETHING<R>(mapper: KeyedMapper<T, string, R>, key: string): R[] {
            return this.SOMETHINGKeys(key).map<R>((key, i) => {
                return mapper(this._store[key].value, key, i);
            })
        }
    
*/

export class Tree<T> {
    protected _store: {
        [key: string]: TreeEntry<T>;
    };

    constructor() {
        this._store = {};
    }

    /**
     * Creates a new tree from a raw store. This does not do any validation checks for completeness.
     * @param { {[key: string]: TreeEntry<T>} } contents the raw store to use as a tree
     * @returns {Tree<T>}
     * @group Utility
     */

    static from<T>(contents: { [key: string]: TreeEntry<T> }): Tree<T> {
        const t = new Tree<T>();
        t._store = contents;
        return t;
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
     * @returns {Readonly TreeEntry<T> | undefined} the tree entry
     * @group Query
     */
    entry(key: string): ReadonlyTreeEntry<T> | undefined {
        return this._store[key];
    }

    /**
     * Gives access to the Tree store directly for reference reasons; Warning: cannot be modified, lest something get messed up with three internal state.
     * @returns {Readonly {[key: string]: Readonly TreeEntry<T>}} the tree store
     * @group Query
     */
    contents(): { readonly [key: string]: ReadonlyTreeEntry<T> } {
        return this._store;
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
        const current = { ...this._store };
        const migrate = (k: string) => {
            const { parent, children, value } = this._store[k];
            res.add(k, k === key ? null : parent, value);
            children.forEach(migrate);
            delete current[k];
        };
        const pKey = this.parentKey(key);
        if (pKey !== undefined && pKey !== null) {
            current[pKey] = {
                ...current[pKey],
                children: current[pKey].children.filter((k) => k !== key),
            };
        }
        migrate(key);
        this._store = current;
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
        const current = { ...this._store };

        const doMerge = (pKey: string) => {
            const pNode = current[pKey];
            if (pNode.children.length === 1) {
                const cKey = pNode.children[0];
                const cNode = current[cKey];
                const r = merger(pNode, cNode);
                if (r) {
                    // If 'merger' returns a new node, replace a and b with the new node in 'hold'
                    delete current[pKey];
                    delete current[cKey];
                    current[r.key] = {
                        key: r.key,
                        value: r.value,
                        parent: pNode.parent,
                        children: cNode.children,
                    };

                    // Update parent-child relationship for the merged node
                    if (pNode.parent && this._store[pNode.parent]) {
                        current[pNode.parent] = {
                            ...current[pNode.parent],
                            children: [...current[pNode.parent].children.filter((t) => t !== pKey), r.key],
                        };
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

        this._store = current;
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

        let current = { ...this._store };

        const doAllocation = (k: string) => {
            if (k in current) {
                // already in tree
                return;
            }
            if (!hold[k]) {
                // missing from allocation
                throw Err.UNALLOCATED(k);
            }
            const { parent, value } = hold[k];
            if (parent !== null && !(parent in current)) {
                doAllocation(parent);
            }
            current[k] = {
                key: k,
                parent,
                children: [],
                value,
            };
            if (parent !== null) {
                current[parent] = {
                    ...current[parent],
                    children: [...current[parent].children, k],
                };
            }
        };

        Object.keys(hold).forEach(doAllocation);

        this._store = current;
    }

    /**
     * Given a list of nodes, allocate them into the forest, but asynchronously
     * @param {Iterable<F>} list
     * @param {(data: F) => Promise<IterableOr<{ key: string; value: T; parent: string | null }> | void>} allocator
     * @group Modify
     */
    async populateAsync<F>(list: Iterable<F>, allocator: (data: F) => Promise<IterableOr<Allocation<T>> | void>): Promise<void> {
        const hold: {
            [key: string]: Allocation<T>;
        } = {};

        // Convert the input data entries into nodes and store them in the 'hold' object
        for (const entry of list) {
            const each = await allocator(entry);
            if (each) {
                for (const n of Symbol.iterator in each ? each : [each]) {
                    hold[n.key] = n;
                }
            }
        }

        let current = { ...this._store };

        const doAllocation = async (k: string) => {
            if (k in current) {
                return;
            }
            if (!hold[k]) {
                // missing from allocation
                throw Err.UNALLOCATED(k);
            }
            const { parent, value } = hold[k];
            if (parent !== null && !(parent in current)) {
                await doAllocation(parent);
            }
            current[k] = {
                key: k,
                parent,
                children: [],
                value,
            };
            if (parent !== null) {
                current[parent] = {
                    ...current[parent],
                    children: [...current[parent].children, k],
                };
            }
        };

        await Promise.all(Object.keys(hold).map(doAllocation));
        this._store = current;
    }

    /* Hierarchy */

    /**
     * Get the root key of the subtree that this key is in.
     * @param {string} key The key to check.
     * @returns {string} The root key in question.
     * @group Hierarchy / Root
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
     * @group Hierarchy / Parent
     */
    parentKey(key: string): string | null | undefined {
        if (this.has(key)) {
            return this._store[key].parent;
        }
    }

    /**
     * Returns the value of the parent node of the node with the given key.
     * @alias parentValue
     * @param {string} key The key of the node for which to find the parent.
     * @returns {T | undefined} The value of the parent node, or undefined if the node has no parent or the key does not exist.
     * @group Hierarchy / Parent
     */

    parent(key: string): T | undefined {
        return this.parentValue(key);
    }

    /**
     * Returns the value of the parent node of the node with the given key.
     * @param {string} key The key of the node for which to find the parent.
     * @returns {T | undefined} The value of the parent node, or undefined if the node has no parent or the key does not exist.
     * @group Hierarchy / Parent
     */
    parentValue(key: string): T | undefined {
        if (this.has(key)) {
            const pid = this.parentKey(key)!;
            if (pid !== null) {
                return this.get(pid);
            }
        }
    }

    /**
     * Returns a tuples representing this nodes parent key and value.
     * @param {string} key The key of the node for which to find the parent.
     * @returns {[string | undefined | null, T | undefined]} A tuple consistent of the parent key and value, if applicable.
     * @group Hierarchy / Parent
     */
    parentTuple(key: string): [string | undefined | null, T | undefined] {
        return [this.parentKey(key), this.parentValue(key)];
    }

    /**
     * Returns an objects representing the pareent key and node of the given node.
     * @param {string} key The key of the node for which to find the parent.
     * @returns {{ key: string | undefined | null, value: T | undefined}} An object representing the parent node.
     * @group Hierarchy / Parent
     */
    parentPair(key: string): { key: string | undefined | null; value: T | undefined } {
        return { key: this.parentKey(key), value: this.parentValue(key) };
    }

    /**
     * Returns an array of keys representing the ancestor nodes of the node with the given key, from closest to root.
     * @param {string} key The key of the node for which to find the ancestors.
     * @returns {string[]} An array of keys representing the ancestor nodes.
     * @group Hierarchy / Ancestors
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
     * Returns an array of values representing the ancestor nodes of the node with the given key, from closest to root.
     * @alias ancestorValues
     * @param {string} key The key of the node for which to find the ancestors.
     * @returns {T[]} An array of values representing the ancestor nodes.
     * @group Hierarchy / Ancestors
     */
    ancestors(key: string): T[] {
        return this.ancestorValues(key);
    }

    /**
     * Returns an array of values representing the ancestor nodes of the node with the given key, from closest to root.
     * @param {string} key The key of the node for which to find the ancestors.
     * @returns {T[]} An array of values representing the ancestor nodes.
     * @group Hierarchy / Ancestors
     */
    ancestorValues(key: string): T[] {
        return this.ancestorKeys(key).map((k) => this._store[k].value);
    }

    /**
     * Returns an array of tuples representing the ancestor keys and nodes of the node with the given key, from closest to root.
     * @param {string} key The key of the node for which to find the ancestors.
     * @returns {[string, T][]} An array of values representing the ancestor nodes.
     * @group Hierarchy / Ancestors
     */
    ancestorTuples(key: string): [string, T][] {
        return this.ancestorKeys(key).map((k) => [k, this._store[k].value]);
    }

    /**
     * Returns an object representing the ancestors nodes of the given node, with keys as node keys and values as node values, from closest to root.
     * @param {string} key The key of the node for which to find the ancestors.
     * @returns {{[key: string]: T}} An array of values representing the ancestor nodes.
     * @group Hierarchy / Ancestors
     */
    ancestorCollection(key: string): { [key: string]: T } {
        return this.ancestorKeys(key).reduce<{ [key: string]: T }>((acc, k) => {
            acc[k] = this._store[k].value;
            return acc;
        }, {});
    }

    /**
     * Returns an array of objects representing the ancestor keys and nodes of the node with the given key, from closest to root.
     * @param {string} key The key of the node for which to find the ancestors.
     * @returns {{ key: string, value: T}[]} An array of values representing the ancestor nodes.
     * @group Hierarchy / Ancestors
     */
    ancestorPairs(key: string): { key: string; value: T }[] {
        return this.ancestorKeys(key).map((key) => ({
            key,
            value: this._store[key].value,
        }));
    }

    /**
     * Applies a reducer function to each ancestors in the tree from the given node, from closest to root
     * @param {(key: string, value: T, i: number, accumulation: R) => R} reducer The reducer function to be applied. It takes four arguments:
     * - `key` (string): The key of the current node being processed.
     * - `value` (type `T`): The value associated with the current node being processed.
     * - `i` (number): The index of the current node in the ancestor list traversal.
     * - `accumulation` (type `R`): The accumulated result from previous reductions.
     * @param {R} start The initial value of the accumulator for the reduction.
     * @param {string} key the node from which to traverse upward from
     * @returns {R} The final accumulated result after applying the reducer to all nodes.
     * @group Hierarchy / Ancestors
     */
    reduceAncestors<R = void>(reducer: KeyedReducer<T, string, R>, start: R, key: string): R {
        return this.ancestorKeys(key).reduce((acc, key, i) => {
            return reducer(this._store[key].value, key, i, acc);
        }, start);
    }

    /**
     * Applies a reducer function to each ancestors in the tree from the given node, from root to closest
     * @param {(key: string, value: T, i: number, accumulation: R) => R} reducer The reducer function to be applied. It takes four arguments:
     * - `key` (string): The key of the current node being processed.
     * - `value` (type `T`): The value associated with the current node being processed.
     * - `i` (number): The index of the current node in the ancestor list traversal.
     * - `accumulation` (type `R`): The accumulated result from previous reductions.
     * @param {R} start The initial value of the accumulator for the reduction.
     * @param {string} key the node from which to traverse upward from
     * @returns {R} The final accumulated result after applying the reducer to all nodes.
     * @group Hierarchy / Ancestors
     */
    reduceAncestorsDownwards<R = void>(reducer: KeyedReducer<T, string, R>, start: R, key: string): R {
        return this.ancestorKeys(key)
            .reverse()
            .reduce((acc, key, i) => {
                return reducer(this._store[key].value, key, i, acc);
            }, start);
    }

    /**
     * Maps a function to each ancestors of the target node, from closest to root.
     *
     * @template R - The type of the result.
     * @param {KeyedMapper<T, string, R>} mapper - The mapping function to be applied. It takes three arguments:
     *   - `value` (type `T`): The value associated with the current node being processed.
     *   - `key` (string): The key of the current node being processed.
     *   - `i` (number): The index of the current node in the ancestor line.
     * @param {string} key the node from which to iterate the descendents from
     * @returns {R[]} - An array containing the results of applying the mapper to all nodes.
     * @group Hierarchy / Ancestors
     */
    mapAncestors<R>(mapper: KeyedMapper<T, string, R>, key: string): R[] {
        return this.ancestorKeys(key).map<R>((key, i) => {
            return mapper(this._store[key].value, key, i);
        });
    }

    /**
     * Maps a function to each ancestors of the target node, from root to closest.
     *
     * @template R - The type of the result.
     * @param {KeyedMapper<T, string, R>} mapper - The mapping function to be applied. It takes three arguments:
     *   - `value` (type `T`): The value associated with the current node being processed.
     *   - `key` (string): The key of the current node being processed.
     *   - `i` (number): The index of the current node in the ancestor line.
     * @param {string} key the node from which to iterate the descendents from
     * @returns {R[]} - An array containing the results of applying the mapper to all nodes.
     * @group Hierarchy / Ancestors
     */
    mapAncestorsDownwards<R>(mapper: KeyedMapper<T, string, R>, key: string): R[] {
        return this.ancestorKeys(key)
            .reverse()
            .map<R>((key, i) => {
                return mapper(this._store[key].value, key, i);
            });
    }

    /**
     * Returns an array of keys representing the child nodes of the node with the given key.
     * @param {string} key The key of the node for which to find the children.
     * @returns {string[]} An array of keys representing the child nodes.
     * @group Hierarchy / Children
     */
    childrenKeys(key: string): string[] {
        return [...(this._store[key]?.children ?? [])];
    }

    /**
     * Returns an array of values representing the child nodes of the node with the given key.
     * @alias childrenValues
     * @param {string} key The key of the node for which to find the children.
     * @returns {T[]} An array of values representing the child nodes.
     * @group Hierarchy / Children
     */
    children(key: string): T[] {
        return this.childrenValues(key);
    }

    /**
     * Returns an array of values representing the child nodes of the node with the given key.
     * @param {string} key The key of the node for which to find the children.
     * @returns {T[]} An array of values representing the child nodes.
     * @group Hierarchy / Children
     */
    childrenValues(key: string): T[] {
        return this.childrenKeys(key).map((k) => this._store[k].value);
    }

    /**
     * Returns an array of tuples representing the children keys of the given node
     * @param {string} key The key of the node for which to find the children.
     * @returns {[string, T][]} An array of values representing the children nodes.
     * @group Hierarchy / Children
     */
    childrenTuples(key: string): [string, T][] {
        return this.childrenKeys(key).map((k) => [k, this._store[k].value]);
    }

    /**
     * Returns an object representing the children nodes of the given node, with keys as node keys and values as node values.
     * @param {string} key The key of the node for which to find the children.
     * @returns {{[key: string]: T}} An array of values representing the child nodes.
     * @group Hierarchy / Children
     */
    childrenCollection(key: string): { [key: string]: T } {
        return this.childrenKeys(key).reduce<{ [key: string]: T }>((acc, k) => {
            acc[k] = this._store[k].value;
            return acc;
        }, {});
    }

    /**
     * Returns an array of objects representing the children keys and nodes of the node with the given key.
     * @param {string} key The key of the node for which to find the children.
     * @returns {{ key: string, value: T}[]} An array of values representing the children nodes.
     * @group Hierarchy / Children
     */
    childrenPairs(key: string): { key: string; value: T }[] {
        return this.childrenKeys(key).map((key) => ({
            key,
            value: this._store[key].value,
        }));
    }

    /**
     * Applies a reducer function to each child of the given node
     * @param {(key: string, value: T, i: number, accumulation: R) => R} reducer The reducer function to be applied. It takes four arguments:
     * - `key` (string): The key of the current node being processed.
     * - `value` (type `T`): The value associated with the current node being processed.
     * - `i` (number): The index of the current node in the child.
     * - `accumulation` (type `R`): The accumulated result from previous reductions.
     * @param {R} start The initial value of the accumulator for the reduction.
     * @param {string} key the node from which to get children from
     * @returns {R} The final accumulated result after applying the reducer to all nodes.
     * @group Hierarchy / Children
     */
    reduceChildren<R = void>(reducer: KeyedReducer<T, string, R>, start: R, key: string): R {
        return this.childrenKeys(key).reduce((acc, key, i) => {
            return reducer(this._store[key].value, key, i, acc);
        }, start);
    }

    /**
     * Maps a function to each child of the target node.
     *
     * @template R - The type of the result.
     * @param {KeyedMapper<T, string, R>} mapper - The mapping function to be applied. It takes three arguments:
     *   - `value` (type `T`): The value associated with the current node being processed.
     *   - `key` (string): The key of the current node being processed.
     *   - `i` (number): The index of the current node in the child.
     * @param {string} key the node from which to get children from
     * @returns {R[]} - An array containing the results of applying the mapper to all nodes.
     * @group Hierarchy / Children
     */
    mapChildren<R>(mapper: KeyedMapper<T, string, R>, key: string): R[] {
        return this.childrenKeys(key).map<R>((key, i) => {
            return mapper(this._store[key].value, key, i);
        });
    }

    /**
     * Returns an array of keys representing the sibling nodes of the node with the given key.
     * @param {string} key The key of the node for which to find the siblings.
     * @returns {string[]} An array of keys representing the sibling nodes.
     * @group Hierarchy / Siblings
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
     * @alias siblingValues
     * @param {string} key The key of the node for which to find the siblings.
     * @returns {T[]} An array of values representing the sibling nodes.
     * @group Hierarchy / Siblings
     */
    siblings(key: string): T[] {
        return this.siblingValues(key);
    }

    /**
     * Returns an array of values representing the sibling nodes of the node with the given key.
     * @param {string} key The key of the node for which to find the siblings.
     * @returns {T[]} An array of values representing the sibling nodes.
     * @group Hierarchy / Siblings
     */
    siblingValues(key: string): T[] {
        return this.siblingKeys(key).map((k) => this._store[k].value);
    }

    /**
     * Returns an array of tuples representing the sibling keys and nodes of the node with the given key.
     * @param {string} key The key of the node for which to find the siblings.
     * @returns {[string, T][]} An array of values representing the sibling nodes.
     * @group Hierarchy / Siblings
     */
    siblingTuples(key: string): [string, T][] {
        return this.siblingKeys(key).map((k) => [k, this._store[k].value]);
    }

    /**
     * Returns an object representing the sibling nodes of the given node, with keys as node keys and values as node values.
     * @param {string} key The key of the node for which to find the sibling.
     * @returns {{[key: string]: T}} An array of values representing the sibling nodes.
     * @group Hierarchy / Siblings
     */
    siblingCollection(key: string): { [key: string]: T } {
        return this.siblingKeys(key).reduce<{ [key: string]: T }>((acc, k) => {
            acc[k] = this._store[k].value;
            return acc;
        }, {});
    }

    /**
     * Returns an array of objects representing the sibling keys and nodes of the node with the given key.
     * @param {string} key The key of the node for which to find the sibling.
     * @returns {{ key: string, value: T}[]} An array of values representing the sibling nodes.
     * @group Hierarchy / Siblings
     */
    siblingPairs(key: string): { key: string; value: T }[] {
        return this.siblingKeys(key).map((key) => ({
            key,
            value: this._store[key].value,
        }));
    }

    /**
     * Applies a reducer function to each sibling of the given node
     * @param {(key: string, value: T, i: number, accumulation: R) => R} reducer The reducer function to be applied. It takes four arguments:
     * - `key` (string): The key of the current node being processed.
     * - `value` (type `T`): The value associated with the current node being processed.
     * - `i` (number): The index of the current node in the sibling.
     * - `accumulation` (type `R`): The accumulated result from previous reductions.
     * @param {R} start The initial value of the accumulator for the reduction.
     * @param {string} key the node from which to get siblings from
     * @returns {R} The final accumulated result after applying the reducer to all nodes.
     * @group Hierarchy / Siblings
     */
    reduceSiblings<R = void>(reducer: KeyedReducer<T, string, R>, start: R, key: string): R {
        return this.siblingKeys(key).reduce((acc, key, i) => {
            return reducer(this._store[key].value, key, i, acc);
        }, start);
    }

    /**
     * Maps a function to each sibling of the target node.
     *
     * @template R - The type of the result.
     * @param {KeyedMapper<T, string, R>} mapper - The mapping function to be applied. It takes three arguments:
     *   - `value` (type `T`): The value associated with the current node being processed.
     *   - `key` (string): The key of the current node being processed.
     *   - `i` (number): The index of the current node in the sibling.
     * @param {string} key the node from which to get siblings from
     * @returns {R[]} - An array containing the results of applying the mapper to all nodes.
     * @group Hierarchy / Siblings
     */
    mapSiblings<R>(mapper: KeyedMapper<T, string, R>, key: string): R[] {
        return this.siblingKeys(key).map<R>((key, i) => {
            return mapper(this._store[key].value, key, i);
        });
    }

    /**
     * Returns an array of keys representing the descendant nodes of the node with the given key.
     * @param {string} key The key of the node for which to find the descendants.
     * @returns {string[]} An array of keys representing the descendant nodes.
     * @group Hierarchy / Descendents
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
     * @alias wideDescendentValues
     * @param {string} key The key of the node for which to find the descendants.
     * @returns {T[]} An array of values representing the descendant nodes.
     * @group Hierarchy / Descendents
     */
    wideDescendents(key: string): T[] {
        return this.wideDescendentValues(key);
    }

    /**
     * Returns an array of values representing the descendant nodes of the node with the given key.
     * @param {string} key The key of the node for which to find the descendants.
     * @returns {T[]} An array of values representing the descendant nodes.
     * @group Hierarchy / Descendents
     */
    wideDescendentValues(key: string): T[] {
        return this.wideDescendentKeys(key).map((k) => this._store[k].value);
    }

    /**
     * Returns an array of tuples representing the descemdemt keys and nodes of the node with the given key in width-first order.
     * @param {string} key The key of the node for which to find the descendents.
     * @returns {[string, T][]} An array of values representing the descendent nodes.
     * @group Hierarchy / Descendents
     */
    wideDescendentTuples(key: string): [string, T][] {
        return this.wideDescendentKeys(key).map((k) => [k, this._store[k].value]);
    }

    /**
     * Returns an object representing the descendent nodes of the given node, with keys as node keys and values as node values in width-first order.
     * @param {string} key The key of the node for which to find the descendents.
     * @returns {{[key: string]: T}} An array of values representing the descendents nodes.
     * @group Hierarchy / Descendents
     */
    wideDescendentCollection(key: string): { [key: string]: T } {
        return this.wideDescendentKeys(key).reduce<{ [key: string]: T }>((acc, k) => {
            acc[k] = this._store[k].value;
            return acc;
        }, {});
    }

    /**
     * Returns an array of objects representing the descendent keys and nodes of the node with the given key in width-first order.
     * @param {string} key The key of the node for which to find the descendents.
     * @returns {{ key: string, value: T}[]} An array of values representing the descendent nodes.
     * @group Hierarchy / Descendents
     */
    wideDescendentPairs(key: string): { key: string; value: T }[] {
        return this.wideDescendentKeys(key).map((key) => ({
            key,
            value: this._store[key].value,
        }));
    }

    /**
     * Applies a reducer function to each descendent in the tree in a width-first traversal.
     * @param {(key: string, value: T, i: number, accumulation: R) => R} reducer The reducer function to be applied. It takes four arguments:
     * - `key` (string): The key of the current node being processed.
     * - `value` (type `T`): The value associated with the current node being processed.
     * - `i` (number): The index of the current node in the width-first traversal.
     * - `accumulation` (type `R`): The accumulated result from previous reductions.
     * @param {R} start The initial value of the accumulator for the reduction.
     * @param {string} key the node from which to iterate the descendents from
     * @returns {R} The final accumulated result after applying the reducer to all nodes.
     * @group Hierarchy / Descendents
     */
    reduceWideDescendents<R = void>(reducer: KeyedReducer<T, string, R>, start: R, key: string): R {
        return this.wideDescendentKeys(key).reduce((acc, key, i) => {
            return reducer(this._store[key].value, key, i, acc);
        }, start);
    }

    /**
     * Maps a function to each descendent of the target node in a wide-order traversal.
     *
     * @template R - The type of the result.
     * @param {KeyedMapper<T, string, R>} mapper - The mapping function to be applied. It takes three arguments:
     *   - `value` (type `T`): The value associated with the current node being processed.
     *   - `key` (string): The key of the current node being processed.
     *   - `i` (number): The index of the current node in the wide-order traversal.
     * @param {string} key the node from which to iterate the descendents from
     * @returns {R[]} - An array containing the results of applying the mapper to all nodes.
     * @group Hierarchy / Descendents
     */
    mapWideDescendents<R>(mapper: KeyedMapper<T, string, R>, key: string): R[] {
        return this.wideDescendentKeys(key).map<R>((key, i) => {
            return mapper(this._store[key].value, key, i);
        });
    }

    /**
     * Returns an array of keys representing the descendant nodes of the node with the given key in depth-first order.
     * @param {string} key The key of the node for which to find the descendants.
     * @returns {string[]} An array of keys representing the descendant nodes.
     * @group Hierarchy / Descendents
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
     * @alias deepDescendentValues
     * @param {string} key The key of the node for which to find the descendants.
     * @returns {T[]} An array of values representing the descendant nodes.
     * @group Hierarchy / Descendents
     */
    deepDescendents(key: string): T[] {
        return this.deepDescendentValues(key);
    }

    /**
     * Returns an array of values representing the descendant nodes of the node with the given key in depth-first order.
     * @param {string} key The key of the node for which to find the descendants.
     * @returns {T[]} An array of values representing the descendant nodes.
     * @group Hierarchy / Descendents
     */
    deepDescendentValues(key: string): T[] {
        return this.deepDescendentKeys(key).map((k) => this._store[k].value);
    }

    /**
     * Returns an array of tuples representing the descemdemt keys and nodes of the node with the given key in depth-first order.
     * @param {string} key The key of the node for which to find the descendents.
     * @returns {[string, T][]} An array of values representing the descendent nodes.
     * @group Hierarchy / Descendents
     */
    deepDescendentTuples(key: string): [string, T][] {
        return this.deepDescendentKeys(key).map((k) => [k, this._store[k].value]);
    }

    /**
     * Returns an object representing the descendent nodes of the given node, with keys as node keys and values as node values in depth-first order.
     * @param {string} key The key of the node for which to find the descendents.
     * @returns {{[key: string]: T}} An array of values representing the descendents nodes.
     * @group Hierarchy / Descendents
     */
    deepDescendentCollection(key: string): { [key: string]: T } {
        return this.deepDescendentKeys(key).reduce<{ [key: string]: T }>((acc, k) => {
            acc[k] = this._store[k].value;
            return acc;
        }, {});
    }

    /**
     * Returns an array of objects representing the descendent keys and nodes of the node with the given key in depth-first order.
     * @param {string} key The key of the node for which to find the descendents.
     * @returns {{ key: string, value: T}[]} An array of values representing the descendent nodes.
     * @group Hierarchy / Descendents
     */
    deepDescendentPairs(key: string): { key: string; value: T }[] {
        return this.deepDescendentKeys(key).map((key) => ({
            key,
            value: this._store[key].value,
        }));
    }

    /**
     * Applies a reducer function to each descendent in the tree in a depth-first traversal.
     * @param {(key: string, value: T, i: number, accumulation: R) => R} reducer The reducer function to be applied. It takes four arguments:
     * - `key` (string): The key of the current node being processed.
     * - `value` (type `T`): The value associated with the current node being processed.
     * - `i` (number): The index of the current node in the depth-first traversal.
     * - `accumulation` (type `R`): The accumulated result from previous reductions.
     * @param {R} start The initial value of the accumulator for the reduction.
     * @param {string} key the node from which to iterate the descendents from
     * @returns {R} The final accumulated result after applying the reducer to all nodes.
     * @group Hierarchy / Descendents
     */
    reduceDeepDescendents<R = void>(reducer: KeyedReducer<T, string, R>, start: R, key: string): R {
        return this.deepDescendentKeys(key).reduce((acc, key, i) => {
            return reducer(this._store[key].value, key, i, acc);
        }, start);
    }

    /**
     * Maps a function to each descendent of the target node in a depth-order traversal.
     *
     * @template R - The type of the result.
     * @param {KeyedMapper<T, string, R>} mapper - The mapping function to be applied. It takes three arguments:
     *   - `value` (type `T`): The value associated with the current node being processed.
     *   - `key` (string): The key of the current node being processed.
     *   - `i` (number): The index of the current node in the depth-order traversal.
     * @param {string} key the node from which to iterate the descendents from
     * @returns {R[]} - An array containing the results of applying the mapper to all nodes.
     * @group Hierarchy / Descendents
     */
    mapDeepDescendents<R>(mapper: KeyedMapper<T, string, R>, key: string): R[] {
        return this.deepDescendentKeys(key).map<R>((key, i) => {
            return mapper(this._store[key].value, key, i);
        });
    }

    /* Traversal */

    /**
     * Returns an array of keys representing the root nodes of the tree.
     * @returns {string[]} An array of keys representing the root nodes.
     * @group Hierarchy / Root
     */
    rootKeys(): string[] {
        return Object.keys(this._store).filter((a) => this._store[a].parent === null);
    }

    /**
     * Returns an array of values representing the root nodes of the tree.
     * @alias rootValues
     * @returns {T[]} An array of values representing the root nodes.
     * @group Hierarchy / Root
     */
    roots(): T[] {
        return this.rootValues();
    }

    /**
     * Returns an array of values representing the root nodes of the tree.
     * @returns {T[]} An array of values representing the root nodes.
     * @group Hierarchy / Root
     */
    rootValues(): T[] {
        return this.rootKeys().map((k) => this._store[k].value);
    }

    /**
     * Returns an array of key-value pairs representing the root nodes of the tree.
     * @returns {[string, T][]} An array of key-value pairs representing the root nodes.
     * @group Hierarchy / Root
     */
    rootTuples(): [string, T][] {
        return this.rootKeys().map((k) => [k, this._store[k].value]);
    }

    /**
     * Returns an object representing the root nodes of the tree, with keys as node keys and values as node values.
     * @returns {{ [key: string]: T }} An object representing the root nodes.
     * @group Hierarchy / Root
     */
    rootCollection(): { [key: string]: T } {
        return this.rootKeys().reduce<{ [key: string]: T }>((acc, k) => {
            acc[k] = this._store[k].value;
            return acc;
        }, {});
    }

    /**
     * Returns an array of objects representing the root keys and nodes of the tree.
     * @returns {{ key: string, value: T}[]} An array of values representing the sibling nodes.
     * @group Hierarchy / Root
     */
    rootPairs(): { key: string; value: T }[] {
        return this.rootKeys().map((key) => ({
            key,
            value: this._store[key].value,
        }));
    }

    /**
     * Applies a reducer function to each root of the tree
     * @param {(key: string, value: T, i: number, accumulation: R) => R} reducer The reducer function to be applied. It takes four arguments:
     * - `key` (string): The key of the current node being processed.
     * - `value` (type `T`): The value associated with the current node being processed.
     * - `i` (number): The index of the current node in the root list.
     * - `accumulation` (type `R`): The accumulated result from previous reductions.
     * @param {R} start The initial value of the accumulator for the reduction.
     * @returns {R} The final accumulated result after applying the reducer to all root nodes.
     * @group Hierarchy / Root
     */
    reduceRoots<R = void>(reducer: KeyedReducer<T, string, R>, start: R): R {
        return this.rootKeys().reduce((acc, key, i) => {
            return reducer(this._store[key].value, key, i, acc);
        }, start);
    }

    /**
     * Maps a function to each root of the tree.
     *
     * @template R - The type of the result.
     * @param {KeyedMapper<T, string, R>} mapper - The mapping function to be applied. It takes three arguments:
     *   - `value` (type `T`): The value associated with the current node being processed.
     *   - `key` (string): The key of the current node being processed.
     *   - `i` (number): The index of the current node in the root list.
     * @returns {R[]} - An array containing the results of applying the mapper to all root nodes.
     * @group Hierarchy / Root
     */
    mapRoots<R>(mapper: KeyedMapper<T, string, R>): R[] {
        return this.rootKeys().map<R>((key, i) => {
            return mapper(this._store[key].value, key, i);
        });
    }

    /**
     * Returns an array of keys representing the leaf nodes of the tree.
     * @returns {string[]} An array of keys representing the leaf nodes.
     * @group Hierarchy / Leaves
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
     * @alias leafValues
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {T[]} An array of values representing the leaf nodes.
     * @group Hierarchy / Leaves
     */

    leaves(origin?: string | string[], ...moreOrigins: string[]): T[] {
        return this.leafValues(origin, ...moreOrigins);
    }

    /**
     * Returns an array of values representing the leaf nodes of the tree.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {T[]} An array of values representing the leaf nodes.
     * @group Hierarchy / Leaves
     */
    leafValues(origin?: string | string[], ...moreOrigins: string[]): T[] {
        return this.leafKeys(origin, ...moreOrigins).map((k) => this._store[k].value);
    }

    /**
     * Returns an array of key-value pairs representing the leaf nodes of the tree.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {[string, T][]} An array of key-value pairs representing the leaf nodes.
     * @group Hierarchy / Leaves
     */
    leafTuples(origin?: string | string[], ...moreOrigins: string[]): [string, T][] {
        return this.leafKeys(origin, ...moreOrigins).map((k) => [k, this._store[k].value]);
    }

    /**
     * Returns an object representing the leaf nodes of the tree, with keys as node keys and values as node values.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {{ [key: string]: T }} An object representing the leaf nodes.
     * @group Hierarchy / Leaves
     */
    leafCollection(origin?: string | string[], ...moreOrigins: string[]): { [key: string]: T } {
        return this.leafKeys(origin, ...moreOrigins).reduce<{ [key: string]: T }>((acc, k) => {
            acc[k] = this._store[k].value;
            return acc;
        }, {});
    }

    /**
     * Returns an array of objects object representing the leaf keys and value of the tree.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {{ key: string, value: T }[]} An object representing the leaf nodes.
     * @group Hierarchy / Leaves
     */
    leafPairs(origin?: string | string[], ...moreOrigins: string[]): { key: string; value: T }[] {
        return this.leafKeys(origin, ...moreOrigins).map((key) => ({
            key,
            value: this._store[key].value,
        }));
    }

    /**
     * Applies a reducer function to each sibling of the given node
     * @param {(key: string, value: T, i: number, accumulation: R) => R} reducer The reducer function to be applied. It takes four arguments:
     * - `key` (string): The key of the current node being processed.
     * - `value` (type `T`): The value associated with the current node being processed.
     * - `i` (number): The index of the current node in the sibling.
     * - `accumulation` (type `R`): The accumulated result from previous reductions.
     * @param {R} start The initial value of the accumulator for the reduction.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {R} The final accumulated result after applying the reducer to all nodes.
     * @group Hierarchy / Leaves
     */
    reduceLeaves<R = void>(reducer: KeyedReducer<T, string, R>, start: R, origin?: string | string[], ...moreOrigins: string[]): R {
        return this.leafKeys(origin, ...moreOrigins).reduce((acc, key, i) => {
            return reducer(this._store[key].value, key, i, acc);
        }, start);
    }

    /**
     * Maps a function to each sibling of the target node.
     *
     * @template R - The type of the result.
     * @param {KeyedMapper<T, string, R>} mapper - The mapping function to be applied. It takes three arguments:
     *   - `value` (type `T`): The value associated with the current node being processed.
     *   - `key` (string): The key of the current node being processed.
     *   - `i` (number): The index of the current node in the sibling.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {R[]} - An array containing the results of applying the mapper to all nodes.
     * @group Hierarchy / Leaves
     */
    mapLeaves<R>(mapper: KeyedMapper<T, string, R>, origin?: string | string[], ...moreOrigins: string[]): R[] {
        return this.leafKeys(origin, ...moreOrigins).map<R>((key, i) => {
            return mapper(this._store[key].value, key, i);
        });
    }

    /**
     * Returns an array of keys representing the nodes of the tree in a width-first traversal.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {string[]} An array of keys representing the nodes in width-first.
     * @group Traversal / Wide
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
     * @group Traversal / Wide
     */
    wideValues(origin?: string | string[], ...moreOrigins: string[]): T[] {
        return this.wideKeys(origin, ...moreOrigins).map((k) => this._store[k].value);
    }

    /**
     * Returns an array of key-value tuples representing the nodes of the tree in a width-first traversal.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {[string, T][]} An array of key-value tuples representing the nodes in width-first.
     * @group Traversal / Wide
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
     * @group Traversal / Wide
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
     * @group Traversal / Wide
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
     * @group Traversal / Wide
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
     * @group Traversal / Deep
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
     * @group Traversal / Deep
     */
    deepValues(origin?: string | string[], ...moreOrigins: string[]): T[] {
        return this.deepKeys(origin, ...moreOrigins).map((k) => this._store[k].value);
    }

    /**
     * Returns an array of key-value tuples representing all nodes in the tree in a depth-first traversal.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {[string, T][]} An array of key-value tuples representing all nodes in the tree in a depth-first traversal.
     * @group Traversal / Deep
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
     * @group Traversal / Deep
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
     * @group Traversal / Deep
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
     * @group Traversal / Deep
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
     * @group Traversal / Wide
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
     * @group Traversal / Wide
     */
    wideUpwardValues(origin?: string | string[], ...moreOrigins: string[]): T[] {
        return this.wideUpwardKeys(origin, ...moreOrigins).map((k) => this._store[k].value);
    }

    /**
     * Returns an array of key-value pairs representing the nodes of the tree in a width-first traversal starting from leaf nodes.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {[string, T][]} An array of key-value pairs representing the nodes in width-first starting from leaf nodes.
     * @group Traversal / Wide
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
     * @group Traversal / Wide
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
     * @group Traversal / Wide
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
     * @group Traversal / Wide
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
     * @group Traversal / Deep
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
     * @group Traversal / Deep
     */
    deepUpwardValues(origin?: string | string[], ...moreOrigins: string[]): T[] {
        return this.deepUpwardKeys(origin, ...moreOrigins).map((k) => this._store[k].value);
    }

    /**
     * Returns an array of key-value tuples representing all nodes in the tree in a depth-first traversal.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {[string, T][]} An array of key-value tuples representing all nodes in the tree in a depth-first traversal.
     * @group Traversal / Deep
     */
    deepUpwardTuples(origin?: string | string[], ...moreOrigins: string[]): [string, T][] {
        return this.deepUpwardKeys(origin, ...moreOrigins).map((k) => [k, this._store[k].value]);
    }

    /**
     * Returns an array of key-value pairs representing all nodes in the tree in a depth-first traversal.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns { { key: string; value: T }[] } An array of key-value pairs representing all nodes in the tree in a depth-first traversal.
     * @group Traversal / Deep
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
     * @group Traversal / Deep
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
     * @group Traversal / Deep
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
     * @group Traversal / Path
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
     * @group Traversal / Path
     */
    pathValues(from: string, to: string): T[] {
        return this.pathKeys(from, to).map((each) => this._store[each].value);
    }

    /**
     * Finds the key-value tuples representing the nodes along the path from one node to another in the tree, if it exists.
     * @param {string} from The key of the starting node.
     * @param {string} to The key of the ending node.
     * @returns {[string, T][]} An array of key-value tuples representing the nodes along the path from the starting node to the ending node, if it exists.
     * @group Traversal / Path
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
     * @group Traversal / Path
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
     * @group Traversal / Path
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
     * @group Traversal / Path
     */
    mapPath<R = void>(from: string, to: string, mapper: KeyedMapper<T, string, R>): R[] {
        return this.pathKeys(from, to).map((key, i) => {
            return mapper(this._store[key].value, key, i);
        });
    }
}
