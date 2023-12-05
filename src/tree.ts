import { Err } from "./errors";
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

    has(key: string): boolean {
        return key in this._store;
    }

    contains(value: T): boolean {
        return Object.values(this._store).some((e) => e.value === value);
    }

    some(discriminator: Discriminator<T>): boolean {
        return Object.values(this._store).some((e) => discriminator(e.value));
    }

    keyOf(value: T): string | undefined {
        return Object.values(this._store).find((v) => {
            return v.value === value;
        })?.key;
    }

    findKeyOf(discriminator: Discriminator<T>): string | undefined {
        return Object.values(this._store).find((v) => {
            return discriminator(v.value);
        })?.key;
    }

    isRoot(key: string): boolean {
        return this._store[key]?.parent === null;
    }

    isLeaf(key: string): boolean {
        return this.has(key) ? (this._store[key]?.children ?? []).length === 0 : false;
    }

    get(key: string): T | undefined {
        return this._store[key]?.value;
    }

    depth(key: string): number {
        return this.ancestorKeys(key).length;
    }

    size(): number {
        return Object.keys(this._store).length;
    }

    subtreeCount(): number {
        return this.rootKeys().length;
    }

    /* Add / Edit / Remove */

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

    update(key: string, value: T | Updater<T>): void {
        if (this.has(key)) {
            const res = this._store[key].value;
            this._store[key].value = typeof value === "function" ? (value as Updater<T>)(res) : value;
        }
    }

    updateWith(key: string, updater: Updater<T>): void {
        if (this.has(key)) {
            const res = this._store[key].value;
            this._store[key].value = updater(res);
        }
    }

    upsert(key: string, parent: string | null, value: T): void {
        if (this.has(key)) {
            this._store[key].value = value;
        } else {
            this.add(key, parent, value);
        }
    }

    upsertWith(key: string, parent: string | null, updater: Updater<T | undefined, T>): void {
        if (this.has(key)) {
            const prev = this._store[key].value;
            this._store[key].value = updater(prev);
        } else {
            this.add(key, parent, updater(undefined));
        }
    }

    emplace(key: string, parent: string | null, value: T): void {
        if (this.has(key)) {
            this.move(key, parent);
            this._store[key].value = value;
        } else {
            this.add(key, parent, value);
        }
    }

    emplaceWith(key: string, parent: string | null, updater: Updater<T | undefined, T>): void {
        if (this.has(key)) {
            this.move(key, parent);
            const prev = this._store[key].value;
            this._store[key].value = updater(prev);
        } else {
            this.add(key, parent, updater(undefined));
        }
    }

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

    graft(sapling: ITree<T>, saplingRoot: string, graftPoint: string): void {
        if (sapling.has(saplingRoot) && this.has(graftPoint)) {
            const r = sapling.get(saplingRoot);
            this.add(saplingRoot, graftPoint, r!);
            sapling.childrenKeys(saplingRoot).forEach((cid) => {
                this.graft(sapling, cid, saplingRoot);
            });
        }
    }

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

    clear() {
        this._store = {};
    }

    populate<F>(list: Iterable<F>, allocator: (data: F) => IterableOr<{ key: string; value: T; parent: string | null }> | void) {
        const hold: {
            [key: string]: { key: string; value: T; parent: string | null };
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
            if (!hold[k]) {
                console.error(
                    `Parent node "${k}" not found.
Make sure to add all parent nodes. Check the order of the input list.`
                );
                throw Err.INCOMPLETE;
            }

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

    parentKey(key: string): string | null | undefined {
        if (this.has(key)) {
            return this._store[key].parent;
        }
    }

    parent(key: string): T | undefined {
        if (this.has(key)) {
            const pid = this.parentKey(key)!;
            if (pid !== null) {
                return this.get(pid);
            }
        }
    }

    ancestorKeys(key: string): string[] {
        const t = this._store[key];
        const res = [] as string[];
        if (t && t.parent) {
            res.push(t.parent);
            res.push(...this.ancestorKeys(t.parent));
        }
        return res;
    }

    ancestors(key: string): T[] {
        return this.ancestorKeys(key).map((k) => this._store[k].value);
    }

    childrenKeys(key: string): string[] {
        return [...(this._store[key]?.children ?? [])];
    }

    children(key: string): T[] {
        return (this._store[key]?.children ?? []).map((k) => this._store[k].value);
    }

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

    siblings(key: string): T[] {
        if (this.has(key)) {
            return this.siblingKeys(key).map((k) => this._store[k].value);
        }
        return [];
    }

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

    wideDescendents(key: string): T[] {
        return this.wideDescendentKeys(key).map((k) => this._store[k].value);
    }

    deepDescendentKeys(key: string): string[] {
        const res: string[] = [];
        const traverse = (k: string) => {
            res.push(k);
            this.childrenKeys(k).forEach(traverse);
        };
        this.childrenKeys(key).forEach(traverse);
        return res;
    }

    deepDescendents(key: string): T[] {
        return this.deepDescendentKeys(key).map((k) => this._store[k].value);
    }

    /* Traversal */

    rootKeys(): string[] {
        return Object.keys(this._store).filter((a) => this._store[a].parent === null);
    }

    rootValues(): T[] {
        return this.rootKeys().map((k) => this._store[k].value);
    }

    rootTuples(): [string, T][] {
        return this.rootKeys().map((k) => [k, this._store[k].value]);
    }

    rootCollection(): { [key: string]: T } {
        return this.rootKeys().reduce<{ [key: string]: T }>((acc, k) => {
            acc[k] = this._store[k].value;
            return acc;
        }, {});
    }

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

    leafValues(origin?: string | string[], ...moreOrigins: string[]): T[] {
        return this.leafKeys(origin, ...moreOrigins).map((k) => this._store[k].value);
    }

    leafTuples(origin?: string | string[], ...moreOrigins: string[]): [string, T][] {
        return this.leafKeys(origin, ...moreOrigins).map((k) => [k, this._store[k].value]);
    }

    leafCollection(origin?: string | string[], ...moreOrigins: string[]): { [key: string]: T } {
        return this.leafKeys(origin, ...moreOrigins).reduce<{ [key: string]: T }>((acc, k) => {
            acc[k] = this._store[k].value;
            return acc;
        }, {});
    }

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

    wideValues(origin?: string | string[], ...moreOrigins: string[]): T[] {
        return this.wideKeys(origin, ...moreOrigins).map((k) => this._store[k].value);
    }

    wideTuples(origin?: string | string[], ...moreOrigins: string[]): [string, T][] {
        return this.wideKeys(origin, ...moreOrigins).map((k) => [k, this._store[k].value]);
    }

    widePairs(origin?: string | string[], ...moreOrigins: string[]): { key: string; value: T }[] {
        return this.wideKeys(origin, ...moreOrigins).map((key) => ({
            key,
            value: this._store[key].value,
        }));
    }

    reduceWide<R = void>(reducer: KeyedReducer<T, string, R>, start: R, origin?: string | string[], ...moreOrigins: string[]): R {
        return this.wideKeys(origin, ...moreOrigins).reduce((acc, key, i) => {
            return reducer(this._store[key].value, key, i, acc);
        }, start);
    }

    mapWide<R>(mapper: KeyedMapper<T, string, R>, origin?: string | string[], ...moreOrigins: string[]): R[] {
        return this.wideKeys(origin, ...moreOrigins).map<R>((key, i) => {
            return mapper(this._store[key].value, key, i);
        });
    }

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

    deepValues(origin?: string | string[], ...moreOrigins: string[]): T[] {
        return this.deepKeys(origin, ...moreOrigins).map((k) => this._store[k].value);
    }

    deepTuples(origin?: string | string[], ...moreOrigins: string[]): [string, T][] {
        return this.deepKeys(origin, ...moreOrigins).map((k) => [k, this._store[k].value]);
    }

    deepPairs(origin?: string | string[], ...moreOrigins: string[]): { key: string; value: T }[] {
        return this.deepKeys(origin, ...moreOrigins).map((key) => ({
            key,
            value: this._store[key].value,
        }));
    }

    reduceDeep<R = void>(reducer: KeyedReducer<T, string, R>, start: R, origin?: string | string[], ...moreOrigins: string[]): R {
        return this.deepKeys(origin, ...moreOrigins).reduce((acc, key, i) => {
            return reducer(this._store[key].value, key, i, acc);
        }, start);
    }

    mapDeep<R>(mapper: KeyedMapper<T, string, R>, origin?: string | string[], ...moreOrigins: string[]): R[] {
        return this.deepKeys(origin, ...moreOrigins).map<R>((key, i) => {
            return mapper(this._store[key].value, key, i);
        });
    }

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

    wideUpwardValues(origin?: string | string[], ...moreOrigins: string[]): T[] {
        return this.wideUpwardKeys(origin, ...moreOrigins).map((k) => this._store[k].value);
    }

    wideUpwardTuples(origin?: string | string[], ...moreOrigins: string[]): [string, T][] {
        return this.wideUpwardKeys(origin, ...moreOrigins).map((k) => [k, this._store[k].value]);
    }

    wideUpwardPairs(origin?: string | string[], ...moreOrigins: string[]): { key: string; value: T }[] {
        return this.wideUpwardKeys(origin, ...moreOrigins).map((key) => ({
            key,
            value: this._store[key].value,
        }));
    }

    reduceUpwardsWide<R = void>(reducer: KeyedReducer<T, string, R>, start: R, origin?: string | string[], ...moreOrigins: string[]): R {
        return this.wideUpwardKeys(origin, ...moreOrigins).reduce((acc, key, i) => {
            return reducer(this._store[key].value, key, i, acc);
        }, start);
    }

    mapUpwardsWide<R>(mapper: KeyedMapper<T, string, R>, origin?: string | string[], ...moreOrigins: string[]): R[] {
        return this.wideUpwardKeys(origin, ...moreOrigins).map<R>((key, i) => {
            return mapper(this._store[key].value, key, i);
        });
    }

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

    deepUpwardValues(origin?: string | string[], ...moreOrigins: string[]): T[] {
        return this.deepUpwardKeys(origin, ...moreOrigins).map((k) => this._store[k].value);
    }

    deepUpwardTuples(origin?: string | string[], ...moreOrigins: string[]): [string, T][] {
        return this.deepUpwardKeys(origin, ...moreOrigins).map((k) => [k, this._store[k].value]);
    }

    deepUpwardPairs(origin?: string | string[], ...moreOrigins: string[]): { key: string; value: T }[] {
        return this.deepUpwardKeys(origin, ...moreOrigins).map((key) => ({
            key,
            value: this._store[key].value,
        }));
    }

    reduceUpwardsDeep<R = void>(reducer: KeyedReducer<T, string, R>, start: R, origin?: string | string[], ...moreOrigins: string[]): R {
        return this.deepUpwardKeys(origin, ...moreOrigins).reduce((acc, key, i) => {
            return reducer(this._store[key].value, key, i, acc);
        }, start);
    }

    mapUpwardsDeep<R>(mapper: KeyedMapper<T, string, R>, origin?: string | string[], ...moreOrigins: string[]): R[] {
        return this.deepUpwardKeys(origin, ...moreOrigins).map<R>((key, i) => {
            return mapper(this._store[key].value, key, i);
        });
    }

    /* Paths */

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

    pathValues(from: string, to: string): T[] {
        return this.pathKeys(from, to).map((each) => this._store[each].value);
    }

    pathTuples(from: string, to: string): [string, T][] {
        return this.pathKeys(from, to).map((each) => [each, this._store[each].value]);
    }

    pathPairs(from: string, to: string): { key: string; value: T }[] {
        return this.pathKeys(from, to).map((key) => ({
            key,
            value: this._store[key].value,
        }));
    }

    reducePath<R = void>(from: string, to: string, reducer: KeyedReducer<T, string, R>, start: R): R {
        return this.pathKeys(from, to).reduce((acc, key, i) => {
            return reducer(this._store[key].value, key, i, acc);
        }, start);
    }

    mapPath<R = void>(from: string, to: string, mapper: KeyedMapper<T, string, R>): R[] {
        return this.pathKeys(from, to).map((key, i) => {
            return mapper(this._store[key].value, key, i);
        });
    }
}
