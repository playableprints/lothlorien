import { IterableOr, Discriminator, Updater, KeyedReducer, TreeEntry, KeyedMapper, TreeStore } from "./types/helpers";
import { ITree } from "./types/itree";
import { TreeOps } from "./treeops";

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

    has(key: string): boolean {
        return TreeOps.has(this._store, key);
    }

    contains(value: T): boolean {
        return TreeOps.contains(this._store, value);
    }

    some(discriminator: Discriminator<T>): boolean {
        return TreeOps.some(this._store, discriminator);
    }

    keyOf(value: T): string | undefined {
        return TreeOps.keyOf(this._store, value);
    }

    findKeyOf(discriminator: Discriminator<T>): string | undefined {
        return TreeOps.findKeyOf(this._store, discriminator);
    }

    isRoot(key: string): boolean {
        return TreeOps.isRoot(this._store, key);
    }

    isLeaf(key: string): boolean {
        return TreeOps.isLeaf(this._store, key);
    }

    get(key: string): T | undefined {
        return TreeOps.get(this._store, key);
    }

    depth(key: string): number {
        return TreeOps.depth(this._store, key);
    }

    size(): number {
        return TreeOps.size(this._store);
    }

    subtreeCount(): number {
        return TreeOps.subtreeCount(this._store);
    }

    subtrees(): ITree<T>[] {
        return TreeOps.subtrees(this._store, () => new Tree<T>());
    }

    /* Add / Edit / Remove */

    add(key: string, parent: string | null, value: T): void {
        this._store = TreeOps.add(this._store, key, parent, value);
    }

    addRoot(key: string, value: T): void {
        this._store = TreeOps.addRoot(this._store, key, value);
    }

    addLeaf(key: string, parent: string, value: T): void {
        this._store = TreeOps.addLeaf(this._store, key, parent, value);
    }

    update(key: string, value: T): void {
        this._store = TreeOps.update(this._store, key, value);
    }

    updateWith(key: string, updater: Updater<T>): void {
        this._store = TreeOps.updateWith(this._store, key, updater);
    }

    upsert(key: string, parent: string | null, value: T): void {
        this._store = TreeOps.upsert(this._store, key, parent, value);
    }

    upsertWith(key: string, parent: string | null, updater: Updater<T | undefined, T>): void {
        this._store = TreeOps.upsertWith(this._store, key, parent, updater);
    }

    move(key: string, parent: string | null): void {
        this._store = TreeOps.move(this._store, key, parent);
    }

    emplace(key: string, parent: string | null, value: T): void {
        this._store = TreeOps.emplace(this._store, key, parent, value);
    }

    emplaceWith(key: string, parent: string | null, updater: Updater<T | undefined, T>): void {
        this._store = TreeOps.emplaceWith(this._store, key, parent, updater);
    }

    trim(key: string): T | undefined {
        const [res, newStore] = TreeOps.trim(this._store, key);
        this._store = newStore;
        return res;
    }

    graft(sapling: ITree<T>, saplingRoot: string, graftPoint: string): void {
        this._store = TreeOps.graft(this._store, sapling, saplingRoot, graftPoint);
    }

    sprout(key: string, generation: Iterable<[string, T]> | { [key: string]: T } | Iterable<{ key: string; value: T }>): void {
        this._store = TreeOps.sprout(this._store, key, generation);
    }

    truncate(key: string): { [key: string]: T } {
        const [res, newStore] = TreeOps.truncate(this._store, key);
        this._store = newStore;
        return res;
    }

    pluck(key: string): T | undefined {
        const [res, newStore] = TreeOps.pluck(this._store, key);
        this._store = newStore;
        return res;
    }

    prune(key: string): ITree<T> {
        const [res, newStore] = TreeOps.prune(this._store, new Tree<T>(), key);
        this._store = newStore;
        return res;
    }

    splice(key: string): T | undefined {
        const [res, newStore] = TreeOps.splice(this._store, key);
        this._store = newStore;
        return res;
    }

    condense(condenser: (a: TreeEntry<T>, b: TreeEntry<T>) => { key: string; value: T } | void): void {
        this._store = TreeOps.condense(this._store, condenser);
    }

    detach(key: string | null): void {
        this._store = TreeOps.detach(this._store, key);
    }

    // the most assinine thing I've written....
    clear() {
        this._store = TreeOps.clear(this._store);
    }

    populate<F>(list: Iterable<F>, allocator: (data: F) => IterableOr<{ key: string; value: T; parent: string | null }> | void) {
        this._store = TreeOps.populate<F, T>(this._store, list, allocator);
    }

    /* Hierarchy */

    rootKeyOf(key: string): string | undefined {
        return TreeOps.rootKeyOf(this._store, key);
    }

    parentKey(key: string): string | null | undefined {
        return TreeOps.parentKey(this._store, key);
    }

    parent(key: string): T | undefined {
        return TreeOps.parent(this._store, key);
    }

    ancestorKeys(key: string): string[] {
        return TreeOps.ancestorKeys(this._store, key);
    }

    ancestors(key: string): T[] {
        return TreeOps.ancestorKeys(this._store, key).map((k) => this._store[k].value);
    }

    childrenKeys(key: string): string[] {
        return TreeOps.childrenKeys(this._store, key);
    }

    children(key: string): T[] {
        return TreeOps.childrenKeys(this._store, key).map((k) => this._store[k].value);
    }

    siblingKeys(key: string): string[] {
        return TreeOps.siblingKeys(this._store, key);
    }

    siblings(key: string): T[] {
        return TreeOps.siblingKeys(this._store, key).map((k) => this._store[k].value);
    }

    wideDescendentKeys(key: string): string[] {
        return TreeOps.wideDescendentKeys(this._store, key);
    }

    wideDescendents(key: string): T[] {
        return TreeOps.wideDescendentKeys(this._store, key).map((k) => this._store[k].value);
    }

    deepDescendentKeys(key: string): string[] {
        return TreeOps.deepDescendentKeys(this._store, key);
    }

    deepDescendents(key: string): T[] {
        return TreeOps.deepDescendentKeys(this._store, key).map((k) => this._store[k].value);
    }

    /* Traversal */

    rootKeys(): string[] {
        return TreeOps.rootKeys(this._store);
    }

    rootValues(): T[] {
        return TreeOps.rootValues(this._store);
    }

    rootTuples(): [string, T][] {
        return TreeOps.rootTuples(this._store);
    }

    rootCollection(): { [key: string]: T } {
        return TreeOps.rootCollection(this._store);
    }

    leafKeys(origin?: string | string[], ...moreOrigins: string[]): string[] {
        return TreeOps.leafKeys(this._store, origin, ...moreOrigins);
    }

    leafValues(origin?: string | string[], ...moreOrigins: string[]): T[] {
        return TreeOps.leafValues(this._store, origin, ...moreOrigins);
    }

    leafTuples(origin?: string | string[], ...moreOrigins: string[]): [string, T][] {
        return TreeOps.leafTuples(this._store, origin, ...moreOrigins);
    }

    leafCollection(origin?: string | string[], ...moreOrigins: string[]): { [key: string]: T } {
        return TreeOps.leafCollection(this._store, origin, ...moreOrigins);
    }

    wideKeys(origin?: string | string[], ...moreOrigins: string[]): string[] {
        return TreeOps.wideKeys(this._store, origin, ...moreOrigins);
    }

    wideValues(origin?: string | string[], ...moreOrigins: string[]): T[] {
        return TreeOps.wideValues(this._store, origin, ...moreOrigins);
    }

    wideTuples(origin?: string | string[], ...moreOrigins: string[]): [string, T][] {
        return TreeOps.wideTuples(this._store, origin, ...moreOrigins);
    }

    widePairs(origin?: string | string[], ...moreOrigins: string[]): { key: string; value: T }[] {
        return TreeOps.widePairs(this._store, origin, ...moreOrigins);
    }

    reduceWide<R = void>(reducer: KeyedReducer<T, string, R>, start: R, origin?: string | string[], ...moreOrigins: string[]): R {
        return TreeOps.reduceWide(this._store, reducer, start, origin, ...moreOrigins);
    }

    mapWide<R>(mapper: KeyedMapper<T, string, R>, origin?: string | string[], ...moreOrigins: string[]): R[] {
        return TreeOps.mapWide<R, T>(this._store, mapper, origin, ...moreOrigins);
    }

    deepKeys(origin?: string | string[], ...moreOrigins: string[]): string[] {
        return TreeOps.deepKeys(this._store, origin, ...moreOrigins);
    }

    deepValues(origin?: string | string[], ...moreOrigins: string[]): T[] {
        return TreeOps.deepValues(this._store, origin, ...moreOrigins);
    }

    deepTuples(origin?: string | string[], ...moreOrigins: string[]): [string, T][] {
        return TreeOps.deepTuples(this._store, origin, ...moreOrigins);
    }

    deepPairs(origin?: string | string[], ...moreOrigins: string[]): { key: string; value: T }[] {
        return TreeOps.deepPairs(this._store, origin, ...moreOrigins);
    }

    reduceDeep<R = void>(reducer: KeyedReducer<T, string, R>, start: R, origin?: string | string[], ...moreOrigins: string[]): R {
        return TreeOps.reduceDeep(this._store, reducer, start, origin, ...moreOrigins);
    }

    mapDeep<R>(mapper: KeyedMapper<T, string, R>, origin?: string | string[], ...moreOrigins: string[]): R[] {
        return TreeOps.mapDeep(this._store, mapper, origin, ...moreOrigins);
    }

    wideUpwardKeys(origin?: string | string[], ...moreOrigins: string[]): string[] {
        return TreeOps.wideUpwardKeys(this._store, origin, ...moreOrigins);
    }

    wideUpwardValues(origin?: string | string[], ...moreOrigins: string[]): T[] {
        return TreeOps.wideUpwardValues(this._store, origin, ...moreOrigins);
    }

    wideUpwardTuples(origin?: string | string[], ...moreOrigins: string[]): [string, T][] {
        return TreeOps.wideUpwardTuples(this._store, origin, ...moreOrigins);
    }

    wideUpwardPairs(origin?: string | string[], ...moreOrigins: string[]): { key: string; value: T }[] {
        return TreeOps.wideUpwardPairs(this._store, origin, ...moreOrigins);
    }

    reduceUpwardsWide<R = void>(reducer: KeyedReducer<T, string, R>, start: R, origin?: string | string[], ...moreOrigins: string[]): R {
        return TreeOps.reduceUpwardsWide(this._store, reducer, start, origin, ...moreOrigins);
    }

    mapUpwardsWide<R>(mapper: KeyedMapper<T, string, R>, origin?: string | string[], ...moreOrigins: string[]): R[] {
        return TreeOps.mapUpwardsWide(this._store, mapper, origin, ...moreOrigins);
    }

    deepUpwardKeys(origin?: string | string[], ...moreOrigins: string[]): string[] {
        return TreeOps.deepUpwardKeys(this._store, origin, ...moreOrigins);
    }

    deepUpwardValues(origin?: string | string[], ...moreOrigins: string[]): T[] {
        return TreeOps.deepUpwardValues(this._store, origin, ...moreOrigins);
    }

    deepUpwardTuples(origin?: string | string[], ...moreOrigins: string[]): [string, T][] {
        return TreeOps.deepUpwardTuples(this._store, origin, ...moreOrigins);
    }

    deepUpwardPairs(origin?: string | string[], ...moreOrigins: string[]): { key: string; value: T }[] {
        return TreeOps.deepUpwardPairs(this._store, origin, ...moreOrigins);
    }

    reduceUpwardsDeep<R = void>(reducer: KeyedReducer<T, string, R>, start: R, origin?: string | string[], ...moreOrigins: string[]): R {
        return TreeOps.reduceUpwardsDeep(this._store, reducer, start, origin, ...moreOrigins);
    }

    mapUpwardsDeep<R>(mapper: KeyedMapper<T, string, R>, origin?: string | string[], ...moreOrigins: string[]): R[] {
        return TreeOps.mapUpwardsDeep(this._store, mapper, origin, ...moreOrigins);
    }

    /* Paths */

    pathKeys(from: string, to: string): string[] {
        return TreeOps.pathKeys(this._store, from, to);
    }

    pathValues(from: string, to: string): T[] {
        return TreeOps.pathValues(this._store, from, to);
    }

    pathTuples(from: string, to: string): [string, T][] {
        return TreeOps.pathTuples(this._store, from, to);
    }

    pathPairs(from: string, to: string): { key: string; value: T }[] {
        return TreeOps.pathPairs(this._store, from, to);
    }

    reducePath<R = void>(from: string, to: string, reducer: KeyedReducer<T, string, R>, start: R): R {
        return TreeOps.reducePath(this._store, from, to, reducer, start);
    }

    mapPath<R = void>(from: string, to: string, mapper: KeyedMapper<T, string, R>): R[] {
        return TreeOps.mapPath(this._store, from, to, mapper);
    }
}
