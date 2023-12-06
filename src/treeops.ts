import { ITree } from "./types/itree";
import { Err } from "./errors";
import { Discriminator, TreeStore, IterableOr, Updater, KeyedMapper, KeyedReducer, TreeEntry } from "./types/helpers";

export namespace TreeOps {
    /* BASICS */

    export const has = <T>(prev: TreeStore<T>, key: string): boolean => {
        return key in prev;
    };

    export const contains = <T>(prev: TreeStore<T>, value: T): boolean => {
        return Object.values(prev).some((e) => e.value === value);
    };

    export const some = <T>(prev: TreeStore<T>, discriminator: Discriminator<T>): boolean => {
        return Object.values(prev).some((e) => discriminator(e.value));
    };

    export const keyOf = <T>(store: TreeStore<T>, value: T): string | undefined => {
        return Object.values(store).find((v) => v.value === value)?.key;
    };

    export const findKeyOf = <T>(store: TreeStore<T>, discriminator: Discriminator<T>) => {
        return Object.values(store).find((v) => discriminator(v.value))?.key;
    };

    export const isRoot = <T>(store: TreeStore<T>, key: string) => {
        return store[key]?.parent === null;
    };

    export const isLeaf = <T>(store: TreeStore<T>, key: string): boolean => {
        return key in store ? (store[key]?.children ?? []).length === 0 : false;
    };

    export const get = <T>(store: TreeStore<T>, key: string): T | undefined => {
        return store[key]?.value;
    };

    export const depth = <T>(store: TreeStore<T>, key: string): number => {
        return ancestorKeys(store, key).length;
    };

    export const size = <T>(store: TreeStore<T>) => {
        return Object.keys(store).length;
    };

    export const subtreeCount = <T>(store: TreeStore<T>) => {
        return rootKeys(store).length;
    };

    export const subtrees = <T>(store: TreeStore<T>, generator: () => ITree<T>): ITree<T>[] => {
        return rootKeys(store).reduce<ITree<T>[]>((acc, rootKey) => {
            const nTree = generator();
            nTree.populate(deepKeys(store, rootKey), (each) => {
                return {
                    key: each,
                    parent: store[each].parent,
                    value: store[each].value,
                };
            });
            acc.push(nTree);
            return acc;
        }, []);
    };

    /* MODIFY */

    export const add = <T>(store: TreeStore<T>, key: string, parent: string | null, value: T): TreeStore<T> => {
        if (key in store) {
            throw Err.DUPLICATE(key);
        }
        if (parent !== null && !(parent in store)) {
            throw Err.INVALID_PARENT(parent);
        }
        return ImmutableHelper.add(store, key, parent, value);
    };

    export const addRoot = <T>(store: TreeStore<T>, key: string, value: T): TreeStore<T> => {
        if (key in store) {
            throw Err.DUPLICATE(key);
        }
        return ImmutableHelper.add(store, key, null, value);
    };

    export const addLeaf = <T>(store: TreeStore<T>, key: string, parent: string, value: T): TreeStore<T> => {
        if (key in store) {
            throw Err.DUPLICATE(key);
        }
        if (parent !== null && !(parent in store)) {
            throw Err.INVALID_PARENT(parent);
        }
        return ImmutableHelper.add(store, key, parent, value);
    };

    export const update = <T>(store: TreeStore<T>, key: string, value: T): TreeStore<T> => {
        if (!(key in store)) {
            throw Err.NOT_FOUND(key);
        }
        return ImmutableHelper.update(store, key, { value });
    };

    export const updateWith = <T>(store: TreeStore<T>, key: string, updater: Updater<T>): TreeStore<T> => {
        if (!(key in store)) {
            throw Err.NOT_FOUND(key);
        }
        return ImmutableHelper.update(store, key, { value: updater(store[key].value) });
    };

    export const upsert = <T>(store: TreeStore<T>, key: string, parent: string | null, value: T): TreeStore<T> => {
        if (key in store) {
            return ImmutableHelper.update(store, key, { value });
        }
        if (parent !== null && !(parent in store)) {
            throw Err.INVALID_PARENT(parent);
        }
        return ImmutableHelper.add(store, key, parent, value);
    };

    export const upsertWith = <T>(store: TreeStore<T>, key: string, parent: string | null, updater: Updater<T | undefined, T>) => {
        if (key in store) {
            return ImmutableHelper.update(store, key, { value: updater(store[key].value) });
        }
        if (parent !== null && !(parent in store)) {
            throw Err.INVALID_PARENT(parent);
        }
        return ImmutableHelper.add(store, key, parent, updater(undefined));
    };

    export const move = <T>(store: TreeStore<T>, key: string, parent: string | null): TreeStore<T> => {
        if (!(key in store)) {
            throw Err.NOT_FOUND(key);
        }
        if (parent !== null && !(parent in store)) {
            //invalid parent
            throw Err.INVALID_PARENT(parent);
        }
        return ImmutableHelper.move(store, key, parent);
    };

    export const emplace = <T>(store: TreeStore<T>, key: string, parent: string | null, value: T): TreeStore<T> => {
        if (parent !== null && !(parent in store)) {
            // invalid parent
            throw Err.INVALID_PARENT(parent);
        }
        if (key in store) {
            return ImmutableHelper.update(ImmutableHelper.move(store, key, parent), key, { value });
        }
        return ImmutableHelper.add(store, key, parent, value);
    };

    export const emplaceWith = <T>(store: TreeStore<T>, key: string, parent: string | null, updater: Updater<T | undefined, T>): TreeStore<T> => {
        if (parent !== null && !(parent in store)) {
            // invalid parent
            throw Err.INVALID_PARENT(parent);
        }
        if (key in store) {
            return ImmutableHelper.update(ImmutableHelper.move(store, key, parent), key, { value: updater(store[key].value) });
        }
        return ImmutableHelper.add(store, key, parent, updater(undefined));
    };

    export const trim = <T>(store: TreeStore<T>, key: string): [T, TreeStore<T>] => {
        if (!(key in store)) {
            // no such key
            throw Err.NOT_FOUND(key);
        }
        if (store[key].children.length > 0) {
            throw Err.MUST_BE_LEAF(key);
        }
        const [removed, remaining] = ImmutableHelper.remove(store, key);
        return [removed.value, remaining];
    };

    export const graft = <T>(store: TreeStore<T>, sapling: ITree<T>, saplingRoot: string, graftPoint: string): TreeStore<T> => {
        if (!(graftPoint in store)) {
            // no such key
            throw Err.NOT_FOUND(graftPoint);
        }
        if (!sapling.has(saplingRoot)) {
            throw Err.NOT_FOUND(saplingRoot);
        }
        return sapling.wideKeys(saplingRoot).reduce<TreeStore<T>>((acc, childKey) => {
            const childParent = childKey === saplingRoot ? graftPoint : sapling.parentKey(childKey)!;
            const childValue = sapling.get(childKey)!;
            return ImmutableHelper.add(acc, childKey, childParent, childValue);
        }, store);
    };

    export const sprout = <T>(store: TreeStore<T>, key: string, generation: Iterable<[string, T]> | { [key: string]: T } | Iterable<{ key: string; value: T }>): TreeStore<T> => {
        if (!(key in store)) {
            // no such key
            throw Err.NOT_FOUND(key);
        }
        return (Symbol.iterator in generation ? [...generation] : Object.entries(generation)).reduce((acc, entry) => {
            const childKey = Array.isArray(entry) ? entry[0] : entry.key;
            const childParent = key;
            const childValue = Array.isArray(entry) ? entry[1] : entry.value;
            if (childKey in acc) {
                //key is already there
                return acc;
            }
            if (childParent !== null && !(childParent in acc)) {
                // invalid parent;
                return acc;
            }
            return ImmutableHelper.add(acc, childKey, childParent, childValue);
        }, store);
    };

    export const truncate = <T>(store: TreeStore<T>, key: string): [{ [key: string]: T }, TreeStore<T>] => {
        if (!(key in store)) {
            // no such key
            throw Err.NOT_FOUND(key);
        }
        return wideKeys(store, key).reduce<[{ [key: string]: T }, TreeStore<T>]>(
            ([res, acc], eachKey) => {
                const [removed, remaining] = ImmutableHelper.remove(acc, eachKey);
                res[eachKey] = removed.value;
                return [res, remaining];
            },
            [{}, store]
        );
    };

    export const pluck = <T>(store: TreeStore<T>, key: string): [T, TreeStore<T>] => {
        if (!(key in store)) {
            // no such key
            throw Err.NOT_FOUND(key);
        }
        const [removed, remaining] = ImmutableHelper.remove(store, key);
        return [
            removed.value,
            removed.children.reduce<TreeStore<T>>((acc, ck) => {
                return ImmutableHelper.update(acc, ck, { parent: null });
            }, remaining),
        ];
    };

    export const prune = <T>(store: TreeStore<T>, res: ITree<T>, key: string): [ITree<T>, TreeStore<T>] => {
        if (!(key in store)) {
            // no such key
            throw Err.NOT_FOUND(key);
        }
        const newStore = wideKeys(store, key).reduce<TreeStore<T>>((acc, eachKey) => {
            const [removed, remaining] = ImmutableHelper.remove(acc, eachKey);
            res.add(eachKey, eachKey === key ? null : removed.parent, removed.value);
            return remaining;
        }, store);
        return [res, newStore];
    };

    export const splice = <T>(store: TreeStore<T>, key: string): [T, TreeStore<T>] => {
        if (!(key in store)) {
            // no such key
            throw Err.NOT_FOUND(key);
        }
        const [removed, remaining] = ImmutableHelper.remove(store, key);
        return [
            removed.value,
            removed.children.reduce<TreeStore<T>>((acc, childKey) => {
                return ImmutableHelper.move(acc, childKey, store[key].parent);
            }, remaining),
        ];
    };

    export const condense = <T>(store: TreeStore<T>, condenser: (a: TreeEntry<T>, b: TreeEntry<T>) => void | { key: string; value: T }): TreeStore<T> => {
        return rootKeys(store).reduce<TreeStore<T>>((acc, eachKey) => {
            return doCondenseStep(condenser, acc, eachKey);
        }, store);
    };

    export const detach = <T>(store: TreeStore<T>, key: string | null): TreeStore<T> => {
        if (key === null) {
            return store;
        }
        if (!(key in store)) {
            // no such key
            throw Err.NOT_FOUND(key);
        }
        return ImmutableHelper.move(store, key, null);
    };

    export const clear = <T>(store: TreeStore<T>): TreeStore<T> => {
        return {};
    };

    export const populate = <F, T>(prev: TreeStore<T>, list: Iterable<F>, allocator: (data: F) => IterableOr<{ key: string; value: T; parent: string | null }> | void): TreeStore<T> => {
        const allocated: { [key: string]: { key: string; value: T; parent: string | null } } = {};
        // Convert the input data entries into nodes and store them in the 'allocated' object
        for (const entry of list) {
            const each = allocator(entry);
            if (each) {
                for (const n of Symbol.iterator in each ? each : [each]) {
                    allocated[n.key] = n;
                }
            }
        }

        return Object.keys(allocated).reduce<TreeStore<T>>((acc, eachKey) => {
            return doPopulateStep(allocated, acc, eachKey);
        }, prev);
    };

    /* HIERARCHY & TRAVERSAL */

    export const parentKey = <T>(store: TreeStore<T>, key: string): string | null => {
        if (!(key in store)) {
            // no such key
            throw Err.NOT_FOUND(key);
        }
        return store[key].parent;
    };

    export const parent = <T>(store: TreeStore<T>, key: string): T | undefined => {
        if (!(key in store)) {
            // no such key
            throw Err.NOT_FOUND(key);
        }
        const p = store[key].parent;
        if (p !== null) {
            return store[p].value;
        }
    };

    export const rootKeyOf = <T>(store: TreeStore<T>, key: string): string | undefined => {
        if (key in store) {
            let k = key;
            let p = store[k].parent;
            while (p !== null) {
                if (p === undefined) {
                    return;
                }
                k = p;
                p = store[k].parent;
            }
            return k;
        }
    };

    export const rootKeys = <T>(store: TreeStore<T>): string[] => {
        return Object.keys(store).filter((a) => store[a].parent === null);
    };

    export const rootValues = <T>(store: TreeStore<T>): T[] => {
        return rootKeys(store).map((k) => store[k].value);
    };

    export const rootTuples = <T>(store: TreeStore<T>): [string, T][] => {
        return rootKeys(store).map((k) => [k, store[k].value]);
    };

    export const rootCollection = <T>(store: TreeStore<T>): { [key: string]: T } => {
        return rootKeys(store).reduce<{ [key: string]: T }>((acc, k) => {
            acc[k] = store[k].value;
            return acc;
        }, {});
    };

    export const leafKeys = <T>(store: TreeStore<T>, origin?: string | string[], ...moreOrigins: string[]): string[] => {
        origin = origin ?? rootKeys(store);
        const from = [...(Array.isArray(origin) ? origin : [origin]), ...moreOrigins];

        //get all leaves
        const allLeaves = Object.keys(store).filter((a) => store[a].children.length === 0);

        //filter by if ancestors is among 'from' list
        return allLeaves.filter((leafKey) => {
            for (const ancestor of ancestorKeys(store, leafKey)) {
                if (from.includes(ancestor)) {
                    return true;
                }
            }
            return false;
        });
    };

    export const leafValues = <T>(store: TreeStore<T>, origin?: string | string[], ...moreOrigins: string[]): T[] => {
        return leafKeys(store, origin, ...moreOrigins).map((k) => store[k].value);
    };
    export const leafTuples = <T>(store: TreeStore<T>, origin?: string | string[], ...moreOrigins: string[]): [string, T][] => {
        return leafKeys(store, origin, ...moreOrigins).map((k) => [k, store[k].value]);
    };
    export const leafCollection = <T>(store: TreeStore<T>, origin?: string | string[], ...moreOrigins: string[]): { [key: string]: T } => {
        return leafKeys(store, origin, ...moreOrigins).reduce<{ [key: string]: T }>((acc, k) => {
            acc[k] = store[k].value;
            return acc;
        }, {});
    };

    export const ancestorKeys = <T>(store: TreeStore<T>, key: string): string[] => {
        const res: string[] = [];
        const t = store[key];
        if (t && t.parent) {
            res.push(t.parent);
            res.push(...ancestorKeys(store, t.parent));
        }
        return res;
    };

    export const ancestors = <T>(store: TreeStore<T>, key: string): T[] => {
        return ancestorKeys(store, key).map((k) => store[k].value);
    };

    export const childrenKeys = <T>(store: TreeStore<T>, key: string): string[] => {
        return [...(store[key]?.children ?? [])];
    };

    export const children = <T>(store: TreeStore<T>, key: string): T[] => {
        return childrenKeys(store, key).map((k) => store[k].value);
    };

    export const siblingKeys = <T>(store: TreeStore<T>, key: string): string[] => {
        const res: string[] = [];
        if (key in store) {
            const p = store[key].parent;
            return p === null ? rootKeys(store) : store[p].children.filter((a) => a !== key);
        }
        return res;
    };

    export const siblings = <T>(store: TreeStore<T>, key: string): T[] => {
        return siblingKeys(store, key).map((k) => store[k].value);
    };

    export const wideDescendentKeys = <T>(store: TreeStore<T>, key: string): string[] => {
        const res: string[] = [];
        const traverse = (keys: string[]) => {
            const next: string[] = [];
            keys.forEach((k) => {
                res.push(k);
                next.push(...childrenKeys(store, k));
            });
            if (next.length > 0) {
                traverse(next);
            }
        };
        traverse(childrenKeys(store, key));
        return res;
    };

    export const wideDescendents = <T>(store: TreeStore<T>, key: string): T[] => {
        return wideDescendentKeys(store, key).map((k) => store[k].value);
    };

    export const deepDescendentKeys = <T>(store: TreeStore<T>, key: string): string[] => {
        const res: string[] = [];
        const traverse = (k: string) => {
            res.push(k);
            childrenKeys(store, k).forEach(traverse);
        };
        childrenKeys(store, key).forEach(traverse);
        return res;
    };

    export const deepDescendents = <T>(store: TreeStore<T>, key: string): T[] => {
        return deepDescendentKeys(store, key).map((k) => store[k].value);
    };

    export const wideKeys = <T>(store: TreeStore<T>, origin?: string | string[], ...moreOrigins: string[]): string[] => {
        origin = origin ?? rootKeys(store);
        const from = [...(Array.isArray(origin) ? origin : [origin]), ...moreOrigins];
        const res = new Set<string>();
        const traverse = (keys: string[]) => {
            const next: string[] = [];
            keys.forEach((k) => {
                res.add(k);
                next.push(...childrenKeys(store, k));
            });
            if (next.length > 0) {
                traverse(next);
            }
        };
        traverse(from);
        return [...res];
    };

    export const wideValues = <T>(store: TreeStore<T>, origin?: string | string[], ...moreOrigins: string[]): T[] => {
        return wideKeys(store, origin, ...moreOrigins).map((k) => store[k].value);
    };

    export const wideTuples = <T>(store: TreeStore<T>, origin?: string | string[], ...moreOrigins: string[]): [string, T][] => {
        return wideKeys(store, origin, ...moreOrigins).map((k) => [k, store[k].value]);
    };

    export const widePairs = <T>(store: TreeStore<T>, origin?: string | string[], ...moreOrigins: string[]): { key: string; value: T }[] => {
        return wideKeys(store, origin, ...moreOrigins).map((k) => ({ key: k, value: store[k].value }));
    };

    export const reduceWide = <R, T>(store: TreeStore<T>, reducer: KeyedReducer<T, string, R>, start: R, origin?: string | string[], ...moreOrigins: string[]): R => {
        return wideKeys(store, origin, ...moreOrigins).reduce<R>((acc, key, i) => {
            return reducer(store[key].value, key, i, acc);
        }, start);
    };

    export const mapWide = <R, T>(store: TreeStore<T>, mapper: KeyedMapper<T, string, R>, origin?: string | string[], ...moreOrigins: string[]): R[] => {
        return wideKeys(store, origin, ...moreOrigins).map<R>((key, i) => {
            return mapper(store[key].value, key, i);
        });
    };

    export const deepKeys = <T>(store: TreeStore<T>, origin?: string | string[], ...moreOrigins: string[]): string[] => {
        origin = origin ?? rootKeys(store);
        const from = [...(Array.isArray(origin) ? origin : [origin]), ...moreOrigins];
        const res = new Set<string>();
        const traverse = (key: string) => {
            res.add(key);
            childrenKeys(store, key).forEach(traverse);
        };
        from.forEach(traverse);
        return [...res];
    };

    export const deepValues = <T>(store: TreeStore<T>, origin?: string | string[], ...moreOrigins: string[]): T[] => {
        return deepKeys(store, origin, ...moreOrigins).map((k) => store[k].value);
    };

    export const deepTuples = <T>(store: TreeStore<T>, origin?: string | string[], ...moreOrigins: string[]): [string, T][] => {
        return deepKeys(store, origin, ...moreOrigins).map((k) => [k, store[k].value]);
    };

    export const deepPairs = <T>(store: TreeStore<T>, origin?: string | string[], ...moreOrigins: string[]): { key: string; value: T }[] => {
        return deepKeys(store, origin, ...moreOrigins).map((k) => ({ key: k, value: store[k].value }));
    };

    export const reduceDeep = <R, T>(store: TreeStore<T>, reducer: KeyedReducer<T, string, R>, start: R, origin?: string | string[], ...moreOrigins: string[]): R => {
        return deepKeys(store, origin, ...moreOrigins).reduce<R>((acc, key, i) => {
            return reducer(store[key].value, key, i, acc);
        }, start);
    };

    export const mapDeep = <R, T>(store: TreeStore<T>, mapper: KeyedMapper<T, string, R>, origin?: string | string[], ...moreOrigins: string[]): R[] => {
        return deepKeys(store, origin, ...moreOrigins).map<R>((key, i) => {
            return mapper(store[key].value, key, i);
        });
    };

    export const wideUpwardKeys = <T>(store: TreeStore<T>, origin?: string | string[], ...moreOrigins: string[]): string[] => {
        origin = origin ?? rootKeys(store);
        const from = [...(Array.isArray(origin) ? origin : [origin]), ...moreOrigins];
        const visited = new Set<string>();
        const traverse = (keys: string[]) => {
            const next: string[] = [];
            keys.forEach((k) => {
                visited.add(k);
                if (!from.includes(k)) {
                    //stop at origin, please
                    const p = store[k].parent;
                    if (p !== null && p !== undefined) {
                        next.push(p);
                    }
                }
            });
            if (next.length > 0) {
                traverse(next);
            }
        };
        traverse(leafKeys(store, ...from));
        return [...visited];
    };

    export const wideUpwardValues = <T>(store: TreeStore<T>, origin?: string | string[], ...moreOrigins: string[]): T[] => {
        return wideUpwardKeys(store, origin, ...moreOrigins).map((k) => store[k].value);
    };

    export const wideUpwardTuples = <T>(store: TreeStore<T>, origin?: string | string[], ...moreOrigins: string[]): [string, T][] => {
        return wideUpwardKeys(store, origin, ...moreOrigins).map((k) => [k, store[k].value]);
    };

    export const wideUpwardPairs = <T>(store: TreeStore<T>, origin?: string | string[], ...moreOrigins: string[]): { key: string; value: T }[] => {
        return wideUpwardKeys(store, origin, ...moreOrigins).map((k) => ({ key: k, value: store[k].value }));
    };

    export const reduceUpwardsWide = <R, T>(store: TreeStore<T>, reducer: KeyedReducer<T, string, R>, start: R, origin?: string | string[], ...moreOrigins: string[]): R => {
        return wideUpwardKeys(store, origin, ...moreOrigins).reduce<R>((acc, key, i) => {
            return reducer(store[key].value, key, i, acc);
        }, start);
    };

    export const mapUpwardsWide = <R, T>(store: TreeStore<T>, mapper: KeyedMapper<T, string, R>, origin?: string | string[], ...moreOrigins: string[]): R[] => {
        return wideUpwardKeys(store, origin, ...moreOrigins).map<R>((key, i) => {
            return mapper(store[key].value, key, i);
        });
    };

    export const deepUpwardKeys = <T>(store: TreeStore<T>, origin?: string | string[], ...moreOrigins: string[]): string[] => {
        origin = origin ?? rootKeys(store);
        const from = [...(Array.isArray(origin) ? origin : [origin]), ...moreOrigins];
        const visited = new Set<string>();
        const traverse = (k: string) => {
            visited.add(k);
            if (!from.includes(k)) {
                //stop at origin
                const p = store[k].parent;
                if (p !== null && p !== undefined) {
                    traverse(p);
                }
            }
        };
        leafKeys(store, ...from).forEach(traverse);
        return [...visited];
    };

    export const deepUpwardValues = <T>(store: TreeStore<T>, origin?: string | string[], ...moreOrigins: string[]): T[] => {
        return deepUpwardKeys(store, origin, ...moreOrigins).map((k) => store[k].value);
    };

    export const deepUpwardTuples = <T>(store: TreeStore<T>, origin?: string | string[], ...moreOrigins: string[]): [string, T][] => {
        return deepUpwardKeys(store, origin, ...moreOrigins).map((k) => [k, store[k].value]);
    };

    export const deepUpwardPairs = <T>(store: TreeStore<T>, origin?: string | string[], ...moreOrigins: string[]): { key: string; value: T }[] => {
        return deepUpwardKeys(store, origin, ...moreOrigins).map((k) => ({ key: k, value: store[k].value }));
    };

    export const reduceUpwardsDeep = <R, T>(store: TreeStore<T>, reducer: KeyedReducer<T, string, R>, start: R, origin?: string | string[], ...moreOrigins: string[]): R => {
        return deepUpwardKeys(store, origin, ...moreOrigins).reduce<R>((acc, key, i) => {
            return reducer(store[key].value, key, i, acc);
        }, start);
    };

    export const mapUpwardsDeep = <R, T>(store: TreeStore<T>, mapper: KeyedMapper<T, string, R>, origin?: string | string[], ...moreOrigins: string[]): R[] => {
        return deepUpwardKeys(store, origin, ...moreOrigins).map<R>((key, i) => {
            return mapper(store[key].value, key, i);
        });
    };

    // TODO: should unfindable paths return undefined rather than an empty array?
    export const pathKeys = <T>(store: TreeStore<T>, from: string, to: string): string[] => {
        if (from === to) {
            return [from];
        }
        let fromHead = store[from];
        let toHead = store[to];
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
                    fromHead = store[fromHead.parent];
                }
                //stop searching upwards if you've found root
            }
            if (!toRoot) {
                //to-leg is still searching up the tree
                toSearchlight = pathFrom.indexOf(toHead.key);
                if (toHead.parent !== null) {
                    pathTo.push(toHead.parent);
                    toHead = store[toHead.parent];
                }
                //stop searching upwards if you've found root
            }
            toRoot = toHead.parent === null ? toHead.key : toRoot;
            fromRoot = fromHead.parent === null ? fromHead.key : fromRoot;
        }
        return [...pathFrom.slice(0, toSearchlight), ...pathTo.slice(0, fromSearchlight).reverse()];
    };

    export const pathValues = <T>(store: TreeStore<T>, from: string, to: string): T[] => {
        return pathKeys(store, from, to).map((k) => store[k].value);
    };

    export const pathTuples = <T>(store: TreeStore<T>, from: string, to: string): [string, T][] => {
        return pathKeys(store, from, to).map((k) => [k, store[k].value]);
    };

    export const pathPairs = <T>(store: TreeStore<T>, from: string, to: string): { key: string; value: T }[] => {
        return pathKeys(store, from, to).map((k) => ({ key: k, value: store[k].value }));
    };

    export const reducePath = <R, T>(store: TreeStore<T>, from: string, to: string, reducer: KeyedReducer<T, string, R>, start: R): R => {
        return pathKeys(store, from, to).reduce((acc, key, i) => {
            return reducer(store[key].value, key, i, acc);
        }, start);
    };

    export const mapPath = <R, T>(store: TreeStore<T>, from: string, to: string, mapper: KeyedMapper<T, string, R>): R[] => {
        return pathKeys(store, from, to).map((key, i) => {
            return mapper(store[key].value, key, i);
        });
    };
}

const doPopulateStep = <T>(allocated: { [key: string]: { key: string; value: T; parent: string | null } }, store: TreeStore<T>, k: string): TreeStore<T> => {
    if (!(k in allocated)) {
        throw Err.UNALLOCATED(k);
    }
    if (k in store) {
        // already there, skip and continue
        return store;
    }

    const { parent, value } = allocated[k];
    const doParentFirst = parent !== null && !(parent in store);
    return ImmutableHelper.add(doParentFirst ? doPopulateStep(allocated, store, parent) : store, k, parent, value);
};

const doCondenseStep = <T>(condenser: (a: TreeEntry<T>, b: TreeEntry<T>) => void | { key: string; value: T }, newStore: TreeStore<T>, aKey: string): TreeStore<T> => {
    const aEntry = newStore[aKey];
    if (aEntry.children.length !== 1) {
        // merging only works with 1 and only 1 child.
        return aEntry.children.reduce<TreeStore<T>>((acc, childKey) => {
            return doCondenseStep(condenser, acc, childKey);
        }, newStore);
    }
    const bKey = aEntry.children[0];
    const bEntry = newStore[bKey];
    const resultEntry = condenser(aEntry, bEntry);
    if (!resultEntry) {
        // merger said not to merge, continue down the tree.
        return doCondenseStep(condenser, newStore, bKey);
    }

    // remove the nodes that were involved in the merge
    const { [aKey]: aRem, [bKey]: bRem, ...remaining } = newStore;

    const postMerge = {
        ...remaining,
        // add the merged node
        [resultEntry.key]: {
            key: resultEntry.key,
            value: resultEntry.value,
            children: bRem.children,
            parent: aRem.parent,
        },
        // update children of the now-removed 'B' to point to the new node.
        ...bRem.children.reduce<TreeStore<T>>((acc, childKey) => {
            acc[childKey] = {
                ...acc[childKey],
                parent: resultEntry.key,
            };
            return acc;
        }, {}),
        // and update the parent of A (which has been removed) to exclude the key of A, and include the key of the new node.
        ...(aRem.parent === null
            ? {}
            : {
                  [aRem.parent]: {
                      ...remaining[aRem.parent],
                      children: [...remaining[aRem.parent].children.filter((t) => t !== aKey), resultEntry.key],
                  },
              }),
    };

    // continue on down the tree, starting at the now-merged node.
    return doCondenseStep(condenser, postMerge, resultEntry.key);
};

namespace ImmutableHelper {
    /**
     * Immutable tree store entry addition. Takes care of parent addition, too. Assumes validation checks already made.
     * @param prev the starting store
     * @param key the key being added
     * @param parent parent key (or null if new root)
     * @param value the value
     * @returns a new tree store object
     */

    export const add = <T>(prev: TreeStore<T>, key: string, parent: string | null, value: T): TreeStore<T> => {
        return {
            ...prev,
            [key]: {
                key,
                parent,
                children: [],
                value,
            },
            ...(parent === null
                ? {}
                : {
                      [parent]: {
                          ...prev[parent],
                          children: [...prev[parent].children, key],
                      },
                  }),
        };
    };

    /**
     * Immutable tree store entry transplant. Takes care of adjusting new and previous parents, too. Assumes validation checks already made.
     * @param prev the starting store
     * @param key the key of the node to be moved.
     * @param newParent the parent key that the node is moving to.
     * @returns a new tree store object
     */
    export const move = <T>(prev: TreeStore<T>, key: string, newParent: string | null): TreeStore<T> => {
        const oldParent = prev[key].parent;
        return {
            ...prev,
            [key]: {
                ...prev[key],
                parent: newParent,
            },
            ...(newParent === null
                ? {}
                : {
                      [newParent]: {
                          ...prev[newParent],
                          children: [...prev[newParent].children, key],
                      },
                  }),
            ...(oldParent === null || !(oldParent in prev)
                ? {}
                : {
                      [oldParent]: {
                          ...prev[oldParent],
                          children: prev[oldParent].children.filter((ck) => ck !== key),
                      },
                  }),
        };
    };

    /**
     * Immutable tree store updater. Assumes validation checks already made.
     * @param prev the starting store
     * @param key the key of the node being updated
     * @param partialEntry the partial entry of the node to be updated
     * @returns a new tree store
     */
    export const update = <T>(prev: TreeStore<T>, key: string, partialEntry: Partial<TreeEntry<T>>): TreeStore<T> => {
        return {
            ...prev,
            [key]: {
                ...prev[key],
                ...partialEntry,
            },
        };
    };

    /**
     * Immtable tree store remover. Updates parent, too. Assumes validation checks already made, but will skip updating parent if the parent is missing (presumably because it too was removed)
     * @param prev the starting store
     * @param key the key of the node being removed
     * @returns a new tree store
     */

    export const remove = <T>(prev: TreeStore<T>, key: string): [removed: TreeEntry<T>, newStore: TreeStore<T>] => {
        const { [key]: removed, ...remaining } = prev;
        return [
            removed,
            {
                ...remaining,
                ...(removed.parent === null || !(removed.parent in prev)
                    ? {}
                    : {
                          [removed.parent]: {
                              ...remaining[removed.parent],
                              children: remaining[removed.parent].children.filter((k) => k !== key),
                          },
                      }),
            },
        ];
    };
}
