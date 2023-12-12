import { Discriminator, Updater, KeyedReducer, TreeEntry, KeyedMapper, IterableOr, ReadonlyTreeEntry } from "./helpers";

export interface ITree<T> {
    /* Basics */

    /**
     * Checks if the tree contains the specified key.
     * @param {string} key The key to check.
     * @returns {boolean} True if the key exists in the tree; otherwise, false.
     * @group Query
     */

    has(key: string): boolean;

    /**
     * Checks if the tree contains a node with the given value.
     * @param {T} value The value to check.
     * @returns {boolean} True if a node with the given value exists in the tree; otherwise, false.
     * @group Query
     */
    contains(value: T): boolean;

    /**
     * Checks if any node in the tree satisfies the given discriminator function.
     * @param {(value: T) => boolean} discriminator The discriminator function.
     * @returns {boolean} True if any node satisfies the discriminator function; otherwise, false.
     * @group Query
     */
    some(discriminator: Discriminator<T>): boolean;

    /**
     * Returns the key associated with the given value in the tree.
     * @param {T} value The value to find the key for.
     * @returns {string | undefined} The key associated with the value, or undefined if not found.
     * @group Query
     */
    keyOf(value: T): string | undefined;

    /**
     * Returns the key of the first node that satisfies the given discriminator function.
     * @param {Discriminator<T>} discriminator The discriminator function.
     * @returns {string | undefined} The key of the first node that satisfies the discriminator function, or undefined if not found.
     * @group Query
     */
    findKeyOf(discriminator: Discriminator<T>): string | undefined;

    /**
     * Checks if the node with the given key is the root of the tree.
     * @param {string} key The key of the node to check.
     * @returns {boolean} True if the node is the root; otherwise, false.
     * @group Query
     */
    isRoot(key: string): boolean;

    /**
     * Checks if the node with the given key is a leaf node (has no children).
     * @param {string} key The key of the node to check.
     * @returns {boolean} True if the node is a leaf; otherwise, false.
     * @group Query
     */
    isLeaf(key: string): boolean;

    /**
     * Gets the value associated with the node of the given key.
     * @param {string} key The key of the node to get the value of.
     * @returns {T} The value associated with the node.
     * @group Query
     */
    get(key: string): T | undefined;

    /**
     * Gives access to the Tree Entry directly for reference reasons; Warning: cannot be modified, lest something get messed up with three internal state.
     * @param {string} key The key of the node to get the entry of.
     * @returns {Readonly TreeEntr<T> | undefined} the tree entry
     * @group Query
     */
    entry(key: string): ReadonlyTreeEntry<T> | undefined;

    /**
     * Calculates the depth of the node with the given key in the tree.
     * The depth is the number of ancestors a node has.
     * @param {string} key The key of the node to calculate the depth for.
     * @returns {number} The depth of the node.
     * @group Query
     */
    depth(key: string): number;

    /**
     * Get the root key of the subtree that this key is in.
     * @param {string} key The key to check.
     * @returns {string} The root key in question.
     * @group Query
     */

    rootKeyOf(key: string): string | undefined;

    /**
     * How many entries are in the tree
     * @returns {number} The number of entries.
     * @group Query
     */
    size(): number;

    /**
     * How many subtrees are in the tree
     * @returns {number} The number of subtrees
     * @group Query
     */

    subtreeCount(): number;

    /* Add / Edit / Remove */

    /**
     * Adds a new node to the tree with the given key, parent, and value.
     * If a node with the given key already exists in the tree, this method does nothing.
     * @param {string} key The key of the new node to add.
     * @param {string | null} parent The key of the parent node for the new node. Use `null` if the node is a root node.
     * @param {T} value The value associated with the new node.
     * @group Modify
     */
    add(key: string, parent: string | null, value: T): void;

    /**
     * Adds a new root to the tree with the given key, and value.
     * If a node with the given key already exists in the tree, this method does nothing.
     * @param {string} key The key of the new node to add.
     * @param {T} value The value associated with the new node.
     * @group Modify
     */
    addRoot(key: string, value: T): void;

    /**
     * Adds a new node to the tree with the given key, parent, and value.
     * If a node with the given key already exists in the tree, this method does nothing.
     * @param {string} key The key of the new node to add.
     * @param {string} parent The key of the parent node for the new node.
     * @param {T} value The value associated with the new node.
     * @group Modify
     */
    addLeaf(key: string, parent: string, value: T): void;

    /**
     * Updates the value of an existing node in the tree with the given key.
     * If the node does not exist, this method does nothing.
     * @param {string} key The key of the node to update.
     * @param {T} value The new value to set for the node.
     * @group Modify
     */
    update(key: string, value: T): void;

    /**
     * Adds a node to a given parent if it doesn't exist, otherweise will update an existing node and ignore parent
     * @param {string} key The key of the node to update.
     * @param {string | null} parent If the node is to be inserted, it will become a child of this node, otherwise it is ignored
     * @param {T} value The new value to set for the node.
     * @group Modify
     */
    upsert(key: string, parent: string | null, value: T): void;

    /**
     * Adds a node to a given parent if it doesn't exist, otherweise will update an existing node and ignore parent
     * @param {string} key The key of the node to update.
     * @param {string | null} parent If the node is to be inserted, it will become a child of this node, otherwise it is ignored
     * @param {(previous: T | undefined) => T} updater The callback that will take in the previous value and return the new value.
     * @group Modify
     */
    upsertWith(key: string, parent: string | null, updater: Updater<T | undefined, T>): void;

    /**
     * Adds a node to a given parent if it doesn't exist, otherweise will update an existing node and move the node to be a child of the designated parent
     * @param {string} key The key of the node to update.
     * @param {string | null} parent If the node is to be inserted, it will become a child of this node, otherwise it is ignored
     * @param {T} value The new value to set for the node.
     * @group Modify
     */
    emplace(key: string, parent: string | null, value: T): void;

    /**
     * Adds a node to a given parent if it doesn't exist, otherweise will update an existing node and move the node to be a child of the designated parent
     * @param {string} key The key of the node to update.
     * @param {string | null} parent If the node is to be inserted, it will become a child of this node, otherwise it is ignored
     * @param {(previous: T | undefined) => T} updater The callback that will take in the previous value and return the new value.
     * @group Modify
     */
    emplaceWith(key: string, parent: string | null, updater: Updater<T | undefined, T>): void;

    /**
     * Updates the value of an existing node in the tree with the given key.
     * If the node does not exist, this method does nothing.
     * @param {string} key The key of the node to update.
     * @param {(previous: T) => T} updater The callback that will take in the previous value and return the new value
     * @group Modify
     */
    updateWith(key: string, updater: Updater<T>): void;

    /**
     * Will move a node, and by extension its children, to under the designated new parent
     * If the node does not exist, this method does nothing.
     * @param {string} key The key of the node to update.
     * @param {string | null} parent The new parent node.
     * @group Modify
     */
    move(key: string, parent: string | null): void;

    /**
     * Grafts a sapling tree into the current tree, connecting it to a specific node.
     * The sapling tree will be added as a subtree rooted at the graft point in the current tree.
     * @param {Tree<T>} sapling The sapling tree to graft into the current tree.
     * @param {string} saplingRoot The key of the root node of the sapling tree to graft.
     * @param {string} graftPoint The key of the node in the current tree where the sapling will be grafted.
     * @group Modify
     */
    graft(sapling: ITree<T>, saplingRoot: string, graftPoint: string | null): void;

    /**
     * Adds multiple child nodes to an existing node in the tree with the given key.
     * If the node does not exist, this method does nothing.
     * @param {string} key The key of the node to which children should be added.
     * @param {Iterable<[string, T]> | { [key: string]: T } | Iterable<{ key: string, value: T }> } generation
     * An iterable of `[string, T]` pairs, or an object with key-value pairs, or an iterable of `{ key: string, value: T }` objects.
     * @group Modify
     */
    sprout(key: string, generation: Iterable<[string, T]> | { [key: string]: T } | Iterable<{ key: string; value: T }>): void;

    /**
     * Truncates the subtree rooted at the node with the given key from the tree and returns a key-value collection of those removed.
     * The original tree will no longer include the node and its descendants.
     * @param {string} key The key of the node that serves as the root of the subtree to be truncated.
     * @returns {{[key: string]: T} | undefined} An object representing the truncated subtree, where the keys are the keys of the nodes,
     * and the values are the values associated with each node (or undefined if the node was not present)
     * @group Modify
     */
    truncate(key: string): { [key: string]: T } | undefined;

    /**
     * Removes a node so long as it has no children, otherwise, does nothing.
     * @param {string} key The key of the node to be removed.
     * @returns {T | undefined} The value removed or undefined if it was not removed or the node was not present.
     * @group Modify
     */
    trim(key: string): T | undefined;

    /**
     * Removes the node with the given key from the tree.
     * that node's childrens become detached within the original tree as additional roots.
     * @param {string} key The key of the node to be removed from the tree.
     * @returns {T | undefined} The value of the node that was removed, or undefined if the node does not exist.
     * @group Modify
     */
    pluck(key: string): T | undefined;

    /**
     * Creates a new tree by pruning the subtree rooted at the node with the given key from the original tree.
     * The pruned tree includes the node and its descendants as a new tree instance. Items are removed from the original tree.
     * @param {string} key The key of the node that serves as the root of the subtree to be pruned.
     * @returns {Tree<T>} A new Tree instance representing the pruned subtree.
     * @group Modify
     */
    prune(key: string): ITree<T>;

    /**
     * Removes the node with the given key from the tree and splices its children into its parent's children list.
     * @param {string} key The key of the node to be spliced.
     * @returns {T | undefined} The value of the node that was spliced, or undefined if the node does not exist.
     * @group Modify
     */
    splice(key: string): T | undefined;

    /**
     * Condenses the tree by merging nodes with single children using the provided merger function.
     * The merger function takes two adjacent nodes 'a' and 'b', and if applicable, returns a new merged node 'r'.
     * If the merger function returns false, no merge is performed between 'a' and 'b'.
     * @param {(a: TreeEntry<T>, b: TreeEntry<T>) => void | { key: string, value: T }} merger - The function to merge adjacent nodes with single children.
     * @group Modify
     */
    condense(merger: (a: TreeEntry<T>, b: TreeEntry<T>) => void | { key: string; value: T }): void;

    /**
     * Detaches a part of a tree at the given key, and makes that node the root of a new subtree within this tree.
     * @param {string | null} key The key of the node to be spliced.
     * @group Modify
     */
    detach(key: string | null): void;

    /**
     * splits out each subtree as a member of an array
     * @returns {ITree<T>[]} an array of subtrees.
     * @group Query
     */
    subtrees(): ITree<T>[];

    /**
     * Empties the whole forest
     * @group Modify
     */
    clear(): void;

    /**
     * Given a list of nodes, allocate them into the forest.
     *
     * @param {Iterable<F>} list
     * @param {(data: F) => IterableOr<{ key: string; value: T; parent: string | null }> | void} allocator
     * @group Modify
     */
    populate<F>(list: Iterable<F>, allocator: (data: F) => IterableOr<{ key: string; value: T; parent: string | null }> | void): void;

    /* Hierarchy */

    /**
     * Returns the key of the parent node of the node with the given key.
     * @param {string} key The key of the node for which to find the parent.
     * @returns {string | null | undefined} The key of the parent node as a string, or null if the node has no parent, or undefined if the node was not in the key
     * @group Hierarchy
     */

    parentKey(key: string): string | null | undefined;

    /**
     * Returns the value of the parent node of the node with the given key.
     * @param {string} key The key of the node for which to find the parent.
     * @returns {T | undefined} The value of the parent node, or undefined if the node has no parent or the key does not exist.
     * @group Hierarchy
     */
    parent(key: string): T | undefined;

    /**
     * Returns an array of keys representing the ancestor nodes of the node with the given key.
     * @param {string} key The key of the node for which to find the ancestors.
     * @returns {string[]} An array of keys representing the ancestor nodes.
     * @group Hierarchy
     */
    ancestorKeys(key: string): string[];

    /**
     * Returns an array of values representing the ancestor nodes of the node with the given key.
     * @param {string} key The key of the node for which to find the ancestors.
     * @returns {T[]} An array of values representing the ancestor nodes.
     * @group Hierarchy
     */
    ancestors(key: string): T[];

    /**
     * Returns an array of keys representing the child nodes of the node with the given key.
     * @param {string} key The key of the node for which to find the children.
     * @returns {string[]} An array of keys representing the child nodes.
     * @group Hierarchy
     */
    childrenKeys(key: string): string[];

    /**
     * Returns an array of values representing the child nodes of the node with the given key.
     * @param {string} key The key of the node for which to find the children.
     * @returns {T[]} An array of values representing the child nodes.
     * @group Hierarchy
     */
    children(key: string): T[];

    /**
     * Returns an array of keys representing the sibling nodes of the node with the given key.
     * @param {string} key The key of the node for which to find the siblings.
     * @returns {string[]} An array of keys representing the sibling nodes.
     * @group Hierarchy
     */
    siblingKeys(key: string): string[];

    /**
     * Returns an array of values representing the sibling nodes of the node with the given key.
     * @param {string} key The key of the node for which to find the siblings.
     * @returns {T[]} An array of values representing the sibling nodes.
     * @group Hierarchy
     */
    siblings(key: string): T[];

    /**
     * Returns an array of keys representing the descendant nodes of the node with the given key.
     * @param {string} key The key of the node for which to find the descendants.
     * @returns {string[]} An array of keys representing the descendant nodes.
     * @group Hierarchy
     */
    wideDescendentKeys(key: string): string[];

    /**
     * Returns an array of values representing the descendant nodes of the node with the given key.
     * @param {string} key The key of the node for which to find the descendants.
     * @returns {T[]} An array of values representing the descendant nodes.
     * @group Hierarchy
     */
    wideDescendents(key: string): T[];

    /**
     * Returns an array of keys representing the descendant nodes of the node with the given key in depth-first order.
     * @param {string} key The key of the node for which to find the descendants.
     * @returns {string[]} An array of keys representing the descendant nodes.
     * @group Hierarchy
     */
    deepDescendentKeys(key: string): string[];

    /**
     * Returns an array of values representing the descendant nodes of the node with the given key in depth-first order.
     * @param {string} key The key of the node for which to find the descendants.
     * @returns {T[]} An array of values representing the descendant nodes.
     * @group Hierarchy
     */
    deepDescendents(key: string): T[];

    /* Traversal */

    /**
     * Returns an array of keys representing the root nodes of the tree.
     * @returns {string[]} An array of keys representing the root nodes.
     * @group Traversal
     */
    rootKeys(): string[];

    /**
     * Returns an array of values representing the root nodes of the tree.
     * @returns {T[]} An array of values representing the root nodes.
     * @group Traversal
     */
    rootValues(): T[];

    /**
     * Returns an array of key-value pairs representing the root nodes of the tree.
     * @returns {[string, T][]} An array of key-value pairs representing the root nodes.
     * @group Traversal
     */
    rootTuples(): [string, T][];

    /**
     * Returns an object representing the root nodes of the tree, with keys as node keys and values as node values.
     * @returns {{ [key: string]: T }} An object representing the root nodes.
     * @group Traversal
     */
    rootCollection(): { [key: string]: T };

    /**
     * Returns an array of keys representing the leaf nodes of the tree.
     * @returns {string[]} An array of keys representing the leaf nodes.
     * @group Traversal
     */
    leafKeys(origin?: string | string[], ...moreOrigins: string[]): string[];

    /**
     * Returns an array of values representing the leaf nodes of the tree.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {T[]} An array of values representing the leaf nodes.
     * @group Traversal
     */
    leafValues(origin?: string | string[], ...moreOrigins: string[]): T[];

    /**
     * Returns an array of key-value pairs representing the leaf nodes of the tree.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {[string, T][]} An array of key-value pairs representing the leaf nodes.
     * @group Traversal
     */
    leafTuples(origin?: string | string[], ...moreOrigins: string[]): [string, T][];

    /**
     * Returns an object representing the leaf nodes of the tree, with keys as node keys and values as node values.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {{ [key: string]: T }} An object representing the leaf nodes.
     * @group Traversal
     */
    leafCollection(origin?: string | string[], ...moreOrigins: string[]): { [key: string]: T };

    /**
     * Returns an array of keys representing the nodes of the tree in a width-first traversal.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {string[]} An array of keys representing the nodes in width-first.
     * @group Traversal
     */
    wideKeys(origin?: string | string[], ...moreOrigins: string[]): string[];

    /**
     * Returns an array of values representing the nodes of the tree in a width-first traversal.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {T[]} An array of values representing the nodes in width-first.
     * @group Traversal
     */
    wideValues(origin?: string | string[], ...moreOrigins: string[]): T[];

    /**
     * Returns an array of key-value tuples representing the nodes of the tree in a width-first traversal.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {[string, T][]} An array of key-value tuples representing the nodes in width-first.
     * @group Traversal
     */
    wideTuples(origin?: string | string[], ...moreOrigins: string[]): [string, T][];

    /**
     * Returns an array of key-value pairs representing the nodes of the tree in a width-first traversal.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns { { key: string; value: T }[] } An array of objects representing the key-value pairs of the nodes in width-first.
     * Each object in the array has two properties: `key` (string) representing the key of the node and `value` (type `T`) representing the value associated with the node.
     * @group Traversal
     */
    widePairs(origin?: string | string[], ...moreOrigins: string[]): { key: string; value: T }[];

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
    reduceWide<R = void>(reducer: KeyedReducer<T, string, R>, start: R, origin?: string | string[], ...moreOrigins: string[]): R;

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
    mapWide<R = void>(mapper: KeyedMapper<T, string, R>, origin?: string | string[], ...moreOrigins: string[]): R[];

    /**
     * Returns an array of keys representing all nodes in the tree in a depth-first traversal.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {string[]} An array of keys representing all nodes in the tree in a depth-first traversal.
     * @group Traversal
     */
    deepKeys(origin?: string | string[], ...moreOrigins: string[]): string[];

    /**
     * Returns an array of values associated with all nodes in the tree in a depth-first traversal.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {T[]} An array of values associated with all nodes in the tree in a depth-first traversal.
     * @group Traversal
     */
    deepValues(origin?: string | string[], ...moreOrigins: string[]): T[];

    /**
     * Returns an array of key-value tuples representing all nodes in the tree in a depth-first traversal.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {[string, T][]} An array of key-value tuples representing all nodes in the tree in a depth-first traversal.
     * @group Traversal
     */
    deepTuples(origin?: string | string[], ...moreOrigins: string[]): [string, T][];

    /**
     * Returns an array of key-value pairs representing the nodes of the tree in a depth-first traversal.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns { { key: string; value: T }[] } An array of objects representing the key-value pairs of the nodes in depth-first.
     * Each object in the array has two properties: `key` (string) representing the key of the node and `value` (type `T`) representing the value associated with the node.
     * @group Traversal
     */
    deepPairs(origin?: string | string[], ...moreOrigins: string[]): { key: string; value: T }[];

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
    reduceDeep<R = void>(reducer: KeyedReducer<T, string, R>, start: R, origin?: string | string[], ...moreOrigins: string[]): R;

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
    mapDeep<R = void>(mapper: KeyedMapper<T, string, R>, origin?: string | string[], ...moreOrigins: string[]): R[];

    /**
     * Returns an array of keys representing the nodes of the tree in a width-first traversal starting from leaf nodes.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {string[]} An array of keys representing the nodes in width-first starting from leaf nodes.
     * @group Traversal
     */
    wideUpwardKeys(origin?: string | string[], ...moreOrigins: string[]): string[];

    /**
     * Returns an array of values representing the nodes of the tree in a width-first traversal starting from leaf nodes.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {T[]} An array of values representing the nodes in width-first starting from leaf nodes.
     * @group Traversal
     */
    wideUpwardValues(origin?: string | string[], ...moreOrigins: string[]): T[];

    /**
     * Returns an array of key-value pairs representing the nodes of the tree in a width-first traversal starting from leaf nodes.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {[string, T][]} An array of key-value pairs representing the nodes in width-first starting from leaf nodes.
     * @group Traversal
     */
    wideUpwardTuples(origin?: string | string[], ...moreOrigins: string[]): [string, T][];

    /**
     * Returns an array of key-value pairs representing the nodes of the tree in a width-first traversal starting from leaf nodes.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns { { key: string; value: T }[] } An array of objects representing the key-value pairs of the nodes in width-first.
     * Each object in the array has two properties: `key` (string) representing the key of the node and `value` (type `T`) representing the value associated with the node.
     * @group Traversal
     */
    wideUpwardPairs(origin?: string | string[], ...moreOrigins: string[]): { key: string; value: T }[];

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
    reduceUpwardsWide<R = void>(reducer: KeyedReducer<T, string, R>, start: R, origin?: string | string[], ...moreOrigins: string[]): R;

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
    mapUpwardsWide<R = void>(mapper: KeyedMapper<T, string, R>, origin?: string | string[], ...moreOrigins: string[]): R[];

    /**
     * Returns an array of keys representing all nodes in the tree in a depth-first traversal.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {string[]} An array of keys representing all nodes in the tree in a depth-first traversal.
     * @group Traversal
     */
    deepUpwardKeys(origin?: string | string[], ...moreOrigins: string[]): string[];

    /**
     * Returns an array of values associated with all nodes in the tree in a depth-first traversal.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {T[]} An array of values associated with all nodes in the tree in a depth-first traversal.
     * @group Traversal
     */
    deepUpwardValues(origin?: string | string[], ...moreOrigins: string[]): T[];

    /**
     * Returns an array of key-value tuples representing all nodes in the tree in a depth-first traversal.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns {[string, T][]} An array of key-value tuples representing all nodes in the tree in a depth-first traversal.
     * @group Traversal
     */
    deepUpwardTuples(origin?: string | string[], ...moreOrigins: string[]): [string, T][];

    /**
     * Returns an array of key-value pairs representing all nodes in the tree in a depth-first traversal.
     * @param {string | string[]} [origin=this.rootKeys()] where the traversal begins. If unspecified, will be all root nodes, thus traversal the whole forest.
     * @param {...string[]} [moreOrigins]
     * @returns { { key: string; value: T }[] } An array of key-value pairs representing all nodes in the tree in a depth-first traversal.
     * @group Traversal
     */
    deepUpwardPairs(origin?: string | string[], ...moreOrigins: string[]): { key: string; value: T }[];

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
    reduceUpwardsDeep<R = void>(reducer: KeyedReducer<T, string, R>, start: R, origin?: string | string[], ...moreOrigins: string[]): R;

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
    mapUpwardsDeep<R = void>(mapper: KeyedMapper<T, string, R>, origin?: string | string[], ...moreOrigins: string[]): R[];

    /**
     * Finds the keys representing the path from one node to another in the tree, if it exists. If no such path is viable, the array will be empty.
     * @param {string} from The key of the starting node.
     * @param {string} to The key of the ending node.
     * @returns {string[]} An array of keys representing the path from the starting node to the ending node, if it exists. If no such path is viable, the array will be empty.
     * @group Traversal
     */
    pathKeys(from: string, to: string): string[];

    /**
     * Finds the values associated with the nodes along the path from one node to another in the tree, if it exists.
     * @param {string} from The key of the starting node.
     * @param {string} to The key of the ending node.
     * @returns {T[]} An array of values associated with the nodes along the path from the starting node to the ending node, if it exists.
     * @group Traversal
     */
    pathValues(from: string, to: string): T[];

    /**
     * Finds the key-value tuples representing the nodes along the path from one node to another in the tree, if it exists.
     * @param {string} from The key of the starting node.
     * @param {string} to The key of the ending node.
     * @returns {[string, T][]} An array of key-value tuples representing the nodes along the path from the starting node to the ending node, if it exists.
     * @group Traversal
     */
    pathTuples(from: string, to: string): [string, T][];

    /**
     * Returns an array of key-value representing the nodes along the path from one node to another in the tree, if it exists.
     * @param {string} from The key of the starting node.
     * @param {string} to The key of the ending node.
     * @returns { { key: string; value: T }[] } An array of objects representing the key-value pairs of the nodes in depth-first.
     * Each object in the array has two properties: `key` (string) representing the key of the node and `value` (type `T`) representing the value associated with the node.
     * @group Traversal
     */
    pathPairs(from: string, to: string): { key: string; value: T }[];

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
    reducePath<R = void>(from: string, to: string, reducer: KeyedReducer<T, string, R>, start: R): R;

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
    mapPath<R = void>(from: string, to: string, mapper: KeyedMapper<T, string, R>): R[];
}
