import { IterableOr, Discriminator, Updater, KeyedReducer, TreeEntry, KeyedMapper } from "./types/helpers";
import { ITree } from "./types/itree";

export class Tree<T> implements ITree<T> {
    protected _store: {
        [key: string]: TreeEntry<T>;
    };
    // TODO: should I hold onto roots in a seperate array?
    // roots: string[] = []; //hold onto roots

    constructor() {
        this._store = {};
        this.has = this.has.bind(this);
        this.contains = this.contains.bind(this);
        this.some = this.some.bind(this);
        this.keyOf = this.keyOf.bind(this);
        this.findKeyOf = this.findKeyOf.bind(this);
        this.isRoot = this.isRoot.bind(this);
        this.isLeaf = this.isLeaf.bind(this);
        this.get = this.get.bind(this);
        this.depth = this.depth.bind(this);
        this.size = this.size.bind(this);
        this.subtreeCount = this.subtreeCount.bind(this);
        this.add = this.add.bind(this);
        this.addLeaf = this.addLeaf.bind(this);
        this.addRoot = this.addRoot.bind(this);
        this.move = this.move.bind(this);

        this.update = this.update.bind(this);
        this.updateWith = this.updateWith.bind(this);
        this.upsert = this.upsert.bind(this);
        this.upsertWith = this.upsertWith.bind(this);
        this.emplace = this.emplace.bind(this);
        this.emplaceWith = this.emplaceWith.bind(this);

        this.graft = this.graft.bind(this);
        this.sprout = this.sprout.bind(this);
        this.truncate = this.truncate.bind(this);
        this.pluck = this.pluck.bind(this);
        this.prune = this.prune.bind(this);
        this.splice = this.splice.bind(this);
        this.trim = this.trim.bind(this);
        this.condense = this.condense.bind(this);
        this.clear = this.clear.bind(this);
        this.populate = this.populate.bind(this);
        this.detach = this.detach.bind(this);
        this.subtrees = this.subtrees.bind(this);

        this.rootKeyOf = this.rootKeyOf.bind(this);
        this.parentKey = this.parentKey.bind(this);
        this.parent = this.parent.bind(this);
        this.ancestorKeys = this.ancestorKeys.bind(this);
        this.ancestors = this.ancestors.bind(this);
        this.childrenKeys = this.childrenKeys.bind(this);
        this.children = this.children.bind(this);
        this.siblingKeys = this.siblingKeys.bind(this);
        this.siblings = this.siblings.bind(this);

        this.wideDescendentKeys = this.wideDescendentKeys.bind(this);
        this.wideDescendents = this.wideDescendents.bind(this);
        this.deepDescendentKeys = this.deepDescendentKeys.bind(this);
        this.deepDescendents = this.deepDescendents.bind(this);

        this.rootKeys = this.rootKeys.bind(this);
        this.rootValues = this.rootValues.bind(this);
        this.rootTuples = this.rootTuples.bind(this);
        this.rootCollection = this.rootCollection.bind(this);

        this.leafKeys = this.leafKeys.bind(this);
        this.leafValues = this.leafValues.bind(this);
        this.leafTuples = this.leafTuples.bind(this);
        this.leafCollection = this.leafCollection.bind(this);

        this.wideKeys = this.wideKeys.bind(this);
        this.wideValues = this.wideValues.bind(this);
        this.wideTuples = this.wideTuples.bind(this);
        this.widePairs = this.widePairs.bind(this);
        this.reduceWide = this.reduceWide.bind(this);
        this.mapWide = this.mapWide.bind(this);

        this.deepKeys = this.deepKeys.bind(this);
        this.deepValues = this.deepValues.bind(this);
        this.deepTuples = this.deepTuples.bind(this);
        this.deepPairs = this.deepPairs.bind(this);
        this.reduceDeep = this.reduceDeep.bind(this);
        this.mapDeep = this.mapDeep.bind(this);

        this.pathKeys = this.pathKeys.bind(this);
        this.pathValues = this.pathValues.bind(this);
        this.pathTuples = this.pathTuples.bind(this);
        this.pathPairs = this.pathPairs.bind(this);
        this.reducePath = this.reducePath.bind(this);
        this.mapPath = this.mapPath.bind(this);

        this.wideUpwardKeys = this.wideUpwardKeys.bind(this);
        this.wideUpwardValues = this.wideUpwardValues.bind(this);
        this.wideUpwardTuples = this.wideUpwardTuples.bind(this);
        this.wideUpwardPairs = this.wideUpwardPairs.bind(this);
        this.reduceUpwardsWide = this.reduceUpwardsWide.bind(this);
        this.mapUpwardsWide = this.mapUpwardsWide.bind(this);

        this.deepUpwardKeys = this.deepUpwardKeys.bind(this);
        this.deepUpwardValues = this.deepUpwardValues.bind(this);
        this.deepUpwardTuples = this.deepUpwardTuples.bind(this);
        this.deepUpwardPairs = this.deepUpwardPairs.bind(this);
        this.reduceUpwardsDeep = this.reduceUpwardsDeep.bind(this);
        this.mapUpwardsDeep = this.mapUpwardsDeep.bind(this);
    }

    /* Basics */

    /**
     * Checks if the tree contains the specified key.
     * @param {string} key The key to check.
     * @returns {boolean} True if the key exists in the tree; otherwise, false.
     */

    has(key: string): boolean {
        return key in this._store;
    }

    /**
     * Checks if the tree contains a node with the given value.
     * @param {T} value The value to check.
     * @returns {boolean} True if a node with the given value exists in the tree; otherwise, false.
     */
    contains(value: T): boolean {
        return Object.values(this._store).some((e) => e.value === value);
    }

    /**
     * Checks if any node in the tree satisfies the given discriminator function.
     * @param {(value: T) => boolean} discriminator The discriminator function.
     * @returns {boolean} True if any node satisfies the discriminator function; otherwise, false.
     */
    some(discriminator: Discriminator<T>): boolean {
        return Object.values(this._store).some((e) => discriminator(e.value));
    }

    /**
     * Returns the key associated with the given value in the tree.
     * @param {T} value The value to find the key for.
     * @returns {string | undefined} The key associated with the value, or undefined if not found.
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
     */
    findKeyOf(discriminator: Discriminator<T>): string | undefined {
        return Object.values(this._store).find((v) => {
            return discriminator(v.value);
        })?.key;
    }

    /**
     * Checks if the node with the given key is the root of the tree.
     * @param {string} key The key of the node to check.
     * @returns {boolean} True if the node is the root; otherwise, false.
     */
    isRoot(key: string): boolean {
        return this._store[key]?.parent === null;
    }

    /**
     * Checks if the node with the given key is a leaf node (has no children).
     * @param {string} key The key of the node to check.
     * @returns {boolean} True if the node is a leaf; otherwise, false.
     */
    isLeaf(key: string): boolean {
        return this.has(key) ? (this._store[key]?.children ?? []).length === 0 : false;
    }

    /**
     * Gets the value associated with the node of the given key.
     * @param {string} key The key of the node to get the value of.
     * @returns {T} The value associated with the node.
     */
    get(key: string): T | undefined {
        return this._store[key]?.value;
    }

    /**
     * Calculates the depth of the node with the given key in the tree.
     * The depth is the number of ancestors a node has.
     * @param {string} key The key of the node to calculate the depth for.
     * @returns {number} The depth of the node.
     */
    depth(key: string): number {
        return this.ancestorKeys(key).length;
    }

    /**
     * How many entries are in the tree
     * @returns {number} The number of entries.
     */
    size(): number {
        return Object.keys(this._store).length;
    }

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
                throw `invalid parent '${parent}' when inserting key '${key}'`;
            }
        }
    }

    addRoot(key: string, value: T): void {
        this.add(key, null, value);
    }

    addLeaf(key: string, parent: string, value: T): void {
        this.add(key, parent, value);
    }

    /**
     * Updates the value of an existing node in the tree with the given key.
     * If the node does not exist, this method does nothing.
     * @param {string} key The key of the node to update.
     * @param {T | (previous: T) => T} value The new value to set for the node.
     * If the value is a function, it will be used as an updater function that takes the previous value as an argument and returns the new value.
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
     * @param {T | (previous: T) => T} value The new value to set for the node.
     * If the value is a function, it will be used as an updater function that takes the previous value as an argument and returns the new value.
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
     */
    graft(sapling: ITree<T>, saplingRoot: string, graftPoint: string): void {
        if (sapling.has(saplingRoot) && this.has(graftPoint)) {
            const r = sapling.get(saplingRoot);
            this.add(saplingRoot, graftPoint, r!);
            sapling.childrenKeys(saplingRoot).forEach((cid) => {
                this.graft(sapling, cid, saplingRoot);
            });
        }
    }

    /**
     * Adds multiple child nodes to an existing node in the tree with the given key.
     * If the node does not exist, this method does nothing.
     * @param {string} key The key of the node to which children should be added.
     * @param {Iterable<[string, T]> | { [key: string]: T } | Iterable<{ key: string, value: T }> } generation
     * An iterable of `[string, T]` pairs, or an object with key-value pairs, or an iterable of `{ key: string, value: T }` objects.
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
     * Truncates the subtree rooted at the node with the given key from the tree and returns the truncated subtree as a new object.
     * The original tree will no longer include the node and its descendants.
     * @param {string} key The key of the node that serves as the root of the subtree to be truncated.
     * @returns {{[key: string]: T} | undefined} An object representing the truncated subtree, where the keys are the keys of the nodes,
     * and the values are the values associated with each node (or undefined if the node was not present)
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
            n.children.forEach(this.truncate);
            if (n.parent !== null) {
                this._store[n.parent].children = this._store[n.parent].children.filter((cid) => cid !== key);
            }
            delete this._store[key];
            return res;
        }
    }

    /**
     * Removes the node with the given key from the tree.
     * that node's childrens become detached within the original tree (effectively as new roots).
     * @param {string} key The key of the node to be removed from the tree.
     * @returns {T | undefined} The value of the node that was removed, or undefined if the node does not exist.
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
     */
    prune(key: string): ITree<T> {
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
     * Condenses the tree by merging nodes with single children using the provided merger function.
     * The merger function takes two adjacent nodes 'a' and 'b', and if applicable, returns a new merged node 'r'.
     * If the merger function returns false, no merge is performed between 'a' and 'b'.
     *
     * @param {(a: TreeEntry<T>, b: TreeEntry<T>) => TreeEntry<T> | false} merger - The function to merge adjacent nodes with single children.
     */
    condense(merger: (a: TreeEntry<T>, b: TreeEntry<T>) => TreeEntry<T> | false): void {
        const doMerge = (aKey: string) => {
            const a = this._store[aKey];
            if (a.children.length === 1) {
                const bKey = a.children[0];
                const b = this._store[bKey];
                const r = merger(a, b);
                if (r !== false) {
                    // If 'merger' returns a new node, replace a and b with the new node in 'hold'
                    delete this._store[aKey];
                    delete this._store[bKey];
                    this._store[r.key] = r;

                    // Update parent-child relationship for the merged node
                    if (a.parent && this._store[a.parent]) {
                        this._store[a.parent].children = [...this._store[a.parent].children.filter((t) => t !== aKey), r.key];
                    }
                    doMerge(r.key);
                } else {
                    doMerge(bKey); // Continue merging recursively for b's children
                }
            } else {
                // If a has more than one child, recursively merge children
                a.children.forEach(doMerge);
            }
        };
        // to de determined: should this be on rootKeys or rootKeys.children...
        this.rootKeys().forEach(doMerge);
    }

    detach(key: string | null): void {
        if (key !== null) {
            const p = this._store[key].parent;
            if (p !== null) {
                this._store[p].children = this._store[p].children.filter((k) => k !== key);
            }
            this._store[key].parent = null;
        }
    }

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
     * Completely removes all entries from the tree.
     *
     */

    clear() {
        this._store = {};
    }

    populate<F>(list: Iterable<F>, allocator: (data: F) => IterableOr<{ key: string; value: T; parent: string | null }> | void) {
        const hold: { [key: string]: { key: string; value: T; parent: string | null } } = {};

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
            if (!this.has(k)) {
                const { parent, value } = hold[k];
                if (parent !== null && !this.has(parent)) {
                    doAllocation(parent);
                }
                this.add(k, parent, value);
            }
        };

        Object.keys(hold).forEach(doAllocation);
    }

    /* Hierarchy */

    /**
     * Returns the key of the parent node of the node with the given key.
     * @param {string} key The key of the node for which to find the parent.
     * @returns {string} The key of the parent node as a string, or null if the node has no parent, or undefined if the node was not in the key
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
     * @returns {string | null} The key of the parent node as a string, or null if the node has no parent, or undefined if the node was not in the key
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
     */
    ancestors(key: string): T[] {
        return this.ancestorKeys(key).map((k) => this._store[k].value);
    }

    /**
     * Returns an array of keys representing the child nodes of the node with the given key.
     * @param {string} key The key of the node for which to find the children.
     * @returns {string[]} An array of keys representing the child nodes.
     */
    childrenKeys(key: string): string[] {
        return [...(this._store[key]?.children ?? [])];
    }

    /**
     * Returns an array of values representing the child nodes of the node with the given key.
     * @param {string} key The key of the node for which to find the children.
     * @returns {T[]} An array of values representing the child nodes.
     */
    children(key: string): T[] {
        return (this._store[key]?.children ?? []).map((k) => this._store[k].value);
    }

    /**
     * Returns an array of keys representing the sibling nodes of the node with the given key.
     * @param {string} key The key of the node for which to find the siblings.
     * @returns {string[]} An array of keys representing the sibling nodes.
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
     */
    wideDescendents(key: string): T[] {
        return this.wideDescendentKeys(key).map((k) => this._store[k].value);
    }

    /**
     * Returns an array of keys representing the descendant nodes of the node with the given key, in depth-first order.
     * @param {string} key The key of the node for which to find the descendants.
     * @returns {string[]} An array of keys representing the descendant nodes.
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
     * Returns an array of values representing the descendant nodes of the node with the given key , in depth-first order.
     * @param {string} key The key of the node for which to find the descendants.
     * @returns {T[]} An array of values representing the descendant nodes.
     */
    deepDescendents(key: string): T[] {
        return this.deepDescendentKeys(key).map((k) => this._store[k].value);
    }

    /* Traversal */

    /**
     * Returns an array of keys representing the root nodes of the tree.
     * @returns {string[]} An array of keys representing the root nodes.
     */
    rootKeys(): string[] {
        return Object.keys(this._store).filter((a) => this._store[a].parent === null);
    }

    /**
     * Returns an array of values representing the root nodes of the tree.
     * @returns {T[]} An array of values representing the root nodes.
     */
    rootValues(): T[] {
        return this.rootKeys().map((k) => this._store[k].value);
    }

    /**
     * Returns an array of key-value pairs representing the root nodes of the tree.
     * @returns {[string, T][]} An array of key-value pairs representing the root nodes.
     */
    rootTuples(): [string, T][] {
        return this.rootKeys().map((k) => [k, this._store[k].value]);
    }

    /**
     * Returns an object representing the root nodes of the tree, with keys as node keys and values as node values.
     * @returns {{ [key: string]: T }} An object representing the root nodes.
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
     */
    leafKeys(): string[] {
        return Object.keys(this._store).filter((a) => this._store[a].children.length === 0);
    }

    /**
     * Returns an array of values representing the leaf nodes of the tree.
     * @returns {T[]} An array of values representing the leaf nodes.
     */
    leafValues(): T[] {
        return this.leafKeys().map((k) => this._store[k].value);
    }

    /**
     * Returns an array of key-value pairs representing the leaf nodes of the tree.
     * @returns {[string, T][]} An array of key-value pairs representing the leaf nodes.
     */
    leafTuples(): [string, T][] {
        return this.leafKeys().map((k) => [k, this._store[k].value]);
    }

    /**
     * Returns an object representing the leaf nodes of the tree, with keys as node keys and values as node values.
     * @returns {{ [key: string]: T }} An object representing the leaf nodes.
     */
    leafCollection(): { [key: string]: T } {
        return this.leafKeys().reduce<{ [key: string]: T }>((acc, k) => {
            acc[k] = this._store[k].value;
            return acc;
        }, {});
    }

    /**
     * Returns an array of keys representing the nodes of the tree in a wide order traversal.
     * @returns {string[]} An array of keys representing the nodes in wide order.
     */
    wideKeys(): string[] {
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
        traverse(this.rootKeys());
        return res;
    }

    /**
     * Returns an array of values representing the nodes of the tree in a wide order traversal.
     * @returns {T[]} An array of values representing the nodes in wide order.
     */
    wideValues(): T[] {
        return this.wideKeys().map((k) => this._store[k].value);
    }

    /**
     * Returns an array of key-value pairs representing the nodes of the tree in a wide order traversal.
     * @returns {[string, T][]} An array of key-value pairs representing the nodes in wide order.
     */
    wideTuples(): [string, T][] {
        return this.wideKeys().map((k) => [k, this._store[k].value]);
    }

    /**
     * Returns an array of key-value pairs representing the nodes of the tree in a wide order traversal.
     * @returns { { key: string; value: T }[] } An array of objects representing the key-value pairs of the nodes in wide order.
     * Each object in the array has two properties: `key` (string) representing the key of the node and `value` (type `T`) representing the value associated with the node.
     */
    widePairs(): { key: string; value: T }[] {
        return this.wideKeys().map((key) => ({ key, value: this._store[key].value }));
    }

    /**
     * Applies a reducer function to each node in the tree in a wide order traversal.
     * @param {(key: string, value: T, i: number, accumulation: R) => R} reducer The reducer function to be applied. It takes four arguments:
     * - `key` (string): The key of the current node being processed.
     * - `value` (type `T`): The value associated with the current node being processed.
     * - `i` (number): The index of the current node in the wide order traversal.
     * - `accumulation` (type `R`): The accumulated result from previous reductions.
     * @param {R} start The initial value of the accumulator for the reduction.
     * @returns {R} The final accumulated result after applying the reducer to all nodes.
     */
    reduceWide<R = void>(reducer: KeyedReducer<T, string, R>, start: R): R {
        return this.wideKeys().reduce((acc, key, i) => {
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
     * @returns {R[]} - An array containing the results of applying the mapper to all nodes.
     */
    mapWide<R>(mapper: KeyedMapper<T, string, R>): R[] {
        return this.wideKeys().map<R>((key, i) => {
            return mapper(this._store[key].value, key, i);
        });
    }

    /**
     * Returns an array of keys representing all nodes in the tree in a deep order traversal.
     * @returns {string[]} An array of keys representing all nodes in the tree in a deep order traversal.
     */
    deepKeys(): string[] {
        const res: string[] = [];
        const traverse = (key: string) => {
            res.push(key);
            this.childrenKeys(key).forEach(traverse);
        };
        this.rootKeys().forEach(traverse);
        return res;
    }

    /**
     * Returns an array of values associated with all nodes in the tree in a deep order traversal.
     * @returns {T[]} An array of values associated with all nodes in the tree in a deep order traversal.
     */
    deepValues(): T[] {
        return this.deepKeys().map((k) => this._store[k].value);
    }

    /**
     * Returns an array of key-value pairs representing all nodes in the tree in a deep order traversal.
     * @returns {[string, T][]} An array of key-value pairs representing all nodes in the tree in a deep order traversal.
     */
    deepTuples(): [string, T][] {
        return this.deepKeys().map((k) => [k, this._store[k].value]);
    }

    /**
     * Returns an array of key-value pairs representing the nodes of the tree in a depth-first traversal.
     * @returns { { key: string; value: T }[] } An array of objects representing the key-value pairs of the nodes in depth-first.
     * Each object in the array has two properties: `key` (string) representing the key of the node and `value` (type `T`) representing the value associated with the node.
     */
    deepPairs(): { key: string; value: T }[] {
        return this.deepKeys().map((key) => ({ key, value: this._store[key].value }));
    }

    /**
     * Applies a reducer function to each node in the tree in a deep order traversal.
     * @param {(key: string, value: T, i: number, accumulation: R) => R} reducer The reducer function to be applied. It takes four arguments:
     * - `value` (type `T`): The value associated with the current node being processed.
     * - `key` (string): The key of the current node being processed.
     * - `i` (number): The index of the current node in the deep order traversal.
     * - `accumulation` (type `R`): The accumulated result from previous reductions.
     * @param {R} start The initial value of the accumulator for the reduction.
     * @returns {R} The final accumulated result after applying the reducer to all nodes.
     */
    reduceDeep<R = void>(reducer: KeyedReducer<T, string, R>, start: R): R {
        return this.deepKeys().reduce((acc, key, i) => {
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
     * @returns {R[]} - An array containing the results of applying the mapper to all nodes.
     */
    mapDeep<R>(mapper: KeyedMapper<T, string, R>): R[] {
        return this.deepKeys().map<R>((key, i) => {
            return mapper(this._store[key].value, key, i);
        });
    }

    /**
     * Finds the keys representing the path from one node to another in the tree, if it exists.
     * @param {string} from The key of the starting node.
     * @param {string} to The key of the ending node.
     * @returns {string[]} An array of keys representing the path from the starting node to the ending node, if it exists.
     */
    // TODO: should unfindable paths return undefined rather than an empty array?
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
     *
     */
    pathValues(from: string, to: string): T[] {
        return this.pathKeys(from, to).map((each) => this._store[each].value);
    }

    /**
     * Finds the key-value pairs representing the nodes along the path from one node to another in the tree, if it exists.
     * @param {string} from The key of the starting node.
     * @param {string} to The key of the ending node.
     * @returns {[string, T][]} An array of key-value pairs representing the nodes along the path from the starting node to the ending node, if it exists.
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
     */
    pathPairs(from: string, to: string): { key: string; value: T }[] {
        return this.pathKeys(from, to).map((key) => ({ key, value: this._store[key].value }));
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
     */
    mapPath<R = void>(from: string, to: string, mapper: KeyedMapper<T, string, R>): R[] {
        return this.pathKeys(from, to).map((key, i) => {
            return mapper(this._store[key].value, key, i);
        });
    }

    /**
     * Returns an array of keys representing the nodes of the tree in a width-first traversal starting from leaf nodes.
     * @returns {string[]} An array of keys representing the nodes in width-first starting from leaf nodes.
     */
    wideUpwardKeys(): string[] {
        const visited = new Set<string>();

        const traverse = (keys: string[]) => {
            const next: string[] = [];
            keys.forEach((k) => {
                visited.add(k);
                const p = this.parentKey(k);
                if (p !== null && p !== undefined) {
                    next.push(p);
                }
            });
            if (next.length > 0) {
                traverse(next);
            }
        };
        traverse(this.leafKeys());
        return [...visited];
    }

    /**
     * Returns an array of values associated with all nodes in the tree in a wide order traversal starting at leaves and working upwards.
     * @returns {T[]} An array of values associated with all nodes in the tree in a wide order traversal.
     */
    wideUpwardValues(): T[] {
        return this.wideUpwardKeys().map((k) => this._store[k].value);
    }

    /**
     * Returns an array of key-value pairs representing all nodes in the tree in a wide order traversal starting at leaves and working upwards.
     * @returns {[string, T][]} An array of key-value pairs representing all nodes in the tree in a wide order traversal.
     */
    wideUpwardTuples(): [string, T][] {
        return this.wideUpwardKeys().map((k) => [k, this._store[k].value]);
    }

    /**
     * Returns an array of key-value pairs representing the nodes of the tree in a wide-first traversal starting at leaves and working upwards.
     * @returns { { key: string; value: T }[] } An array of objects representing the key-value pairs of the nodes in wide-first.
     * Each object in the array has two properties: `key` (string) representing the key of the node and `value` (type `T`) representing the value associated with the node.
     */
    wideUpwardPairs(): { key: string; value: T }[] {
        return this.wideUpwardKeys().map((key) => ({ key, value: this._store[key].value }));
    }

    /**
     * Applies a reducer function to each node in the tree in a wide order traversal starting at leaves and working upwards.
     * @param {(key: string, value: T, i: number, accumulation: R) => R} reducer The reducer function to be applied. It takes four arguments:
     * - `value` (type `T`): The value associated with the current node being processed.
     * - `key` (string): The key of the current node being processed.
     * - `i` (number): The index of the current node in the wide order traversal.
     * - `accumulation` (type `R`): The accumulated result from previous reductions.
     * @param {R} start The initial value of the accumulator for the reduction.
     * @returns {R} The final accumulated result after applying the reducer to all nodes.
     */
    reduceUpwardsWide<R = void>(reducer: KeyedReducer<T, string, R>, start: R): R {
        return this.wideUpwardKeys().reduce((acc, key, i) => {
            return reducer(this._store[key].value, key, i, acc);
        }, start);
    }

    /**
     * Maps a function to each node in the tree in a wide-order traversal starting at leaves and working upwards.
     *
     * @template R - The type of the result.
     * @param {KeyedMapper<T, string, R>} mapper - The mapping function to be applied. It takes three arguments:
     *   - `value` (type `T`): The value associated with the current node being processed.
     *   - `key` (string): The key of the current node being processed.
     *   - `i` (number): The index of the current node in the wide-order traversal.
     * @returns {R[]} - An array containing the results of applying the mapper to all nodes.
     */
    mapUpwardsWide<R>(mapper: KeyedMapper<T, string, R>): R[] {
        return this.wideUpwardKeys().map<R>((key, i) => {
            return mapper(this._store[key].value, key, i);
        });
    }

    /**
     * Returns an array of keys representing all nodes in the tree in a depth-first traversal.
     * @returns {string[]} An array of keys representing all nodes in the tree in a depth-first traversal.
     */
    deepUpwardKeys(): string[] {
        const visited = new Set<string>();
        const traverse = (key: string) => {
            visited.add(key);
            const p = this.parentKey(key);
            if (p !== null && p !== undefined) {
                traverse(p);
            }
        };
        this.leafKeys().forEach(traverse);
        return [...visited];
    }

    /**
     * Returns an array of values associated with all nodes in the tree in a deep order traversal starting at leaves and working upwards.
     * @returns {T[]} An array of values associated with all nodes in the tree in a deep order traversal.
     */
    deepUpwardValues(): T[] {
        return this.deepUpwardKeys().map((k) => this._store[k].value);
    }

    /**
     * Returns an array of key-value pairs representing all nodes in the tree in a deep order traversal starting at leaves and working upwards.
     * @returns {[string, T][]} An array of key-value pairs representing all nodes in the tree in a deep order traversal.
     */
    deepUpwardTuples(): [string, T][] {
        return this.deepUpwardKeys().map((k) => [k, this._store[k].value]);
    }

    /**
     * Returns an array of key-value pairs representing the nodes of the tree in a depth-first traversal starting at leaves and working upwards.
     * @returns { { key: string; value: T }[] } An array of objects representing the key-value pairs of the nodes in depth-first.
     * Each object in the array has two properties: `key` (string) representing the key of the node and `value` (type `T`) representing the value associated with the node.
     */
    deepUpwardPairs(): { key: string; value: T }[] {
        return this.deepUpwardKeys().map((key) => ({ key, value: this._store[key].value }));
    }

    /**
     * Applies a reducer function to each node in the tree in a deep order traversal starting at leaves and working upwards.
     * @param {(key: string, value: T, i: number, accumulation: R) => R} reducer The reducer function to be applied. It takes four arguments:
     * - `value` (type `T`): The value associated with the current node being processed.
     * - `key` (string): The key of the current node being processed.
     * - `i` (number): The index of the current node in the deep order traversal.
     * - `accumulation` (type `R`): The accumulated result from previous reductions.
     * @param {R} start The initial value of the accumulator for the reduction.
     * @returns {R} The final accumulated result after applying the reducer to all nodes.
     */
    reduceUpwardsDeep<R = void>(reducer: KeyedReducer<T, string, R>, start: R): R {
        return this.deepUpwardKeys().reduce((acc, key, i) => {
            return reducer(this._store[key].value, key, i, acc);
        }, start);
    }

    /**
     * Maps a function to each node in the tree in a deep-order traversal starting at leaves and working upwards.
     *
     * @template R - The type of the result.
     * @param {KeyedMapper<T, string, R>} mapper - The mapping function to be applied. It takes three arguments:
     *   - `value` (type `T`): The value associated with the current node being processed.
     *   - `key` (string): The key of the current node being processed.
     *   - `i` (number): The index of the current node in the deep-order traversal.
     * @returns {R[]} - An array containing the results of applying the mapper to all nodes.
     */
    mapUpwardsDeep<R>(mapper: KeyedMapper<T, string, R>): R[] {
        return this.deepUpwardKeys().map<R>((key, i) => {
            return mapper(this._store[key].value, key, i);
        });
    }
}
