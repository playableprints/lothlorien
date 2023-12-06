import { useRef, useState, useCallback, useMemo } from "react";
import { Discriminator, IterableOr, KeyedMapper, KeyedReducer, TreeEntry, TreeStore, Updater } from "./types/helpers";
import { TreeOps } from "./treeops";
import { Tree } from "./tree";
import { ITree } from "./types/itree";

export const useTree = <T>(): ITree<T> => {
    const store = useRef<TreeStore<T>>({});
    // dummy state to force refresh on the component where the tree has been modified.
    const [, setState] = useState<number>(0);

    const setStore = useCallback((cb: (prev: TreeStore<T>) => TreeStore<T>) => {
        store.current = cb(store.current);
        setState((p) => p + 1);
    }, []);

    /* Basics */

    const has = useCallback((key: string) => {
        return TreeOps.has(store.current, key);
    }, []);

    const contains = useCallback((value: T) => {
        return TreeOps.contains(store.current, value);
    }, []);

    const some = useCallback((discriminator: Discriminator<T>): boolean => {
        return TreeOps.some(store.current, discriminator);
    }, []);

    const keyOf = useCallback((value: T): string | undefined => {
        return TreeOps.keyOf(store.current, value);
    }, []);

    const findKeyOf = useCallback((discriminator: Discriminator<T>) => {
        return TreeOps.findKeyOf(store.current, discriminator);
    }, []);

    const isRoot = useCallback((key: string) => {
        return TreeOps.isRoot(store.current, key);
    }, []);

    const isLeaf = useCallback((key: string): boolean => {
        return TreeOps.isLeaf(store.current, key);
    }, []);

    const get = useCallback((key: string): T | undefined => {
        return TreeOps.get(store.current, key);
    }, []);

    const depth = useCallback((key: string): number => {
        return TreeOps.depth(store.current, key);
    }, []);

    const size = useCallback(() => {
        return TreeOps.size(store.current);
    }, []);

    const subtreeCount = useCallback(() => {
        return TreeOps.subtreeCount(store.current);
    }, []);

    const subtrees = useCallback(() => {
        return TreeOps.subtrees(store.current, () => new Tree<T>());
    }, []);

    /* Modify */

    const add = useCallback(
        (key: string, parent: string | null, value: T): void => {
            setStore((prev) => TreeOps.add(prev, key, parent, value));
        },
        [setStore]
    );

    const addRoot = useCallback(
        (key: string, value: T) => {
            setStore((prev) => TreeOps.addRoot(prev, key, value));
        },
        [setStore]
    );

    const addLeaf = useCallback(
        (key: string, parent: string, value: T): void => {
            setStore((prev) => TreeOps.addLeaf(prev, key, parent, value));
        },
        [setStore]
    );

    const update = useCallback(
        (key: string, value: T): void => {
            setStore((prev) => TreeOps.update(prev, key, value));
        },
        [setStore]
    );

    const updateWith = useCallback(
        (key: string, updater: Updater<T>): void => {
            setStore((prev) => TreeOps.updateWith(prev, key, updater));
        },
        [setStore]
    );

    const upsert = useCallback(
        (key: string, parent: string | null, value: T): void => {
            setStore((prev) => TreeOps.upsert(prev, key, parent, value));
        },
        [setStore]
    );

    const upsertWith = useCallback(
        (key: string, parent: string | null, updater: Updater<T | undefined, T>): void => {
            setStore((prev) => TreeOps.upsertWith(prev, key, parent, updater));
        },
        [setStore]
    );

    const move = useCallback(
        (key: string, parent: string | null): void => {
            setStore((prev) => TreeOps.move(prev, key, parent));
        },
        [setStore]
    );

    const emplace = useCallback(
        (key: string, parent: string | null, value: T): void => {
            setStore((prev) => TreeOps.emplace(prev, key, parent, value));
        },
        [setStore]
    );

    const emplaceWith = useCallback(
        (key: string, parent: string | null, updater: Updater<T | undefined, T>): void => {
            setStore((prev) => TreeOps.emplaceWith(prev, key, parent, updater));
        },
        [setStore]
    );

    const trim = useCallback(
        (key: string): T | undefined => {
            let res: T | undefined;
            setStore((prev) => {
                const [tmp, newStore] = TreeOps.trim(prev, key);
                res = tmp;
                return newStore;
            });
            return res;
        },
        [setStore]
    );

    const graft = useCallback(
        (sapling: ITree<T>, saplingRoot: string, graftPoint: string) => {
            setStore((prev) => TreeOps.graft(prev, sapling, saplingRoot, graftPoint));
        },
        [setStore]
    );

    const sprout = useCallback(
        (key: string, generation: Iterable<[string, T]> | { [key: string]: T } | Iterable<{ key: string; value: T }>) => {
            setStore((prev) => TreeOps.sprout(prev, key, generation));
        },
        [setStore]
    );

    const truncate = useCallback(
        (key: string): { [key: string]: T } => {
            let res: { [key: string]: T } = {};
            setStore((prev) => {
                const [tmp, newStore] = TreeOps.truncate(prev, key);
                res = tmp;
                return newStore;
            });
            return res;
        },
        [setStore]
    );

    const pluck = useCallback((key: string): T | undefined => {
        let res: T | undefined = undefined;
        setStore((prev) => {
            const [tmp, newStore] = TreeOps.pluck(prev, key);
            res = tmp;
            return newStore;
        });
        return res;
    }, []);

    const prune = useCallback((key: string): ITree<T> => {
        const res = new Tree<T>();
        setStore((prev) => {
            const [, newStore] = TreeOps.prune(prev, res, key);
            return newStore;
        });
        return res;
    }, []);

    const splice = useCallback(
        (key: string): T | undefined => {
            let res: T | undefined;
            setStore((prev) => {
                const [tmp, newStore] = TreeOps.splice(prev, key);
                res = tmp;
                return newStore;
            });
            return res;
        },
        [setStore]
    );

    const condense = useCallback(
        (condenser: (a: TreeEntry<T>, b: TreeEntry<T>) => void | { key: string; value: T }): void => {
            setStore((prev) => TreeOps.condense(prev, condenser));
        },
        [setStore]
    );

    const detach = useCallback(
        (key: string | null) => {
            setStore((prev) => TreeOps.detach(prev, key));
        },
        [setStore]
    );

    const clear = useCallback(() => {
        setStore((prev) => TreeOps.clear(prev));
    }, [setStore]);

    const populate = useCallback(
        <F>(list: Iterable<F>, allocator: (data: F) => IterableOr<{ key: string; value: T; parent: string | null }> | void) => {
            setStore((prev) => TreeOps.populate<F, T>(prev, list, allocator));
        },
        [setStore]
    );

    /* Hierarchy */
    const parentKey = useCallback((key: string): string | null | undefined => {
        return TreeOps.parentKey(store.current, key);
    }, []);

    const parent = useCallback((key: string): T | undefined => {
        return TreeOps.parent(store.current, key);
    }, []);

    const ancestorKeys = useCallback((key: string): string[] => {
        return TreeOps.ancestorKeys(store.current, key);
    }, []);

    const ancestors = useCallback((key: string): T[] => {
        return TreeOps.ancestors(store.current, key);
    }, []);

    const childrenKeys = useCallback((key: string): string[] => {
        return TreeOps.childrenKeys(store.current, key);
    }, []);

    const children = useCallback((key: string): T[] => {
        return TreeOps.children(store.current, key);
    }, []);

    const siblingKeys = useCallback((key: string): string[] => {
        return TreeOps.siblingKeys(store.current, key);
    }, []);

    const siblings = useCallback((key: string): T[] => {
        return TreeOps.siblings(store.current, key);
    }, []);

    const wideDescendentKeys = useCallback((key: string): string[] => {
        return TreeOps.wideDescendentKeys(store.current, key);
    }, []);

    const wideDescendents = useCallback((key: string): T[] => {
        return TreeOps.wideDescendents(store.current, key);
    }, []);

    const deepDescendentKeys = useCallback((key: string): string[] => {
        return TreeOps.deepDescendentKeys(store.current, key);
    }, []);

    const deepDescendents = useCallback((key: string): T[] => {
        return TreeOps.deepDescendents(store.current, key);
    }, []);

    const rootKeys = useCallback((): string[] => {
        return TreeOps.rootKeys(store.current);
    }, []);

    const rootValues = useCallback((): T[] => {
        return TreeOps.rootValues(store.current);
    }, []);

    const rootTuples = useCallback((): [string, T][] => {
        return TreeOps.rootTuples(store.current);
    }, []);

    const rootCollection = useCallback((): { [key: string]: T } => {
        return TreeOps.rootCollection(store.current);
    }, []);

    const rootKeyOf = useCallback((key: string): string | undefined => {
        return TreeOps.rootKeyOf(store.current, key);
    }, []);

    const leafKeys = useCallback((origin?: string | string[], ...moreOrigins: string[]): string[] => {
        return TreeOps.leafKeys(store.current, origin, ...moreOrigins);
    }, []);

    const leafValues = useCallback((origin?: string | string[], ...moreOrigins: string[]): T[] => {
        return TreeOps.leafValues(store.current, origin, ...moreOrigins);
    }, []);

    const leafTuples = useCallback((origin?: string | string[], ...moreOrigins: string[]): [string, T][] => {
        return TreeOps.leafTuples(store.current, origin, ...moreOrigins);
    }, []);

    const leafCollection = useCallback((origin?: string | string[], ...moreOrigins: string[]): { [key: string]: T } => {
        return TreeOps.leafCollection(store.current, origin, ...moreOrigins);
    }, []);

    /* Traversal */

    const wideKeys = useCallback((origin?: string | string[], ...moreOrigins: string[]): string[] => {
        return TreeOps.wideKeys(store.current, origin, ...moreOrigins);
    }, []);

    const wideValues = useCallback((origin?: string | string[], ...moreOrigins: string[]): T[] => {
        return TreeOps.wideValues(store.current, origin, ...moreOrigins);
    }, []);

    const wideTuples = useCallback((origin?: string | string[], ...moreOrigins: string[]): [string, T][] => {
        return TreeOps.wideTuples(store.current, origin, ...moreOrigins);
    }, []);

    const widePairs = useCallback((origin?: string | string[], ...moreOrigins: string[]): { key: string; value: T }[] => {
        return TreeOps.widePairs(store.current, origin, ...moreOrigins);
    }, []);

    const reduceWide = useCallback(<R>(reducer: KeyedReducer<T, string, R>, start: R, origin?: string | string[], ...moreOrigins: string[]): R => {
        return TreeOps.reduceWide(store.current, reducer, start, origin, ...moreOrigins);
    }, []);

    const mapWide = useCallback(<R>(mapper: KeyedMapper<T, string, R>, origin?: string | string[], ...moreOrigins: string[]): R[] => {
        return TreeOps.mapWide<R, T>(store.current, mapper, origin, ...moreOrigins);
    }, []);

    const deepKeys = useCallback((origin?: string | string[], ...moreOrigins: string[]): string[] => {
        return TreeOps.deepKeys(store.current, origin, ...moreOrigins);
    }, []);

    const deepValues = useCallback((origin?: string | string[], ...moreOrigins: string[]): T[] => {
        return TreeOps.deepValues(store.current, origin, ...moreOrigins);
    }, []);

    const deepTuples = useCallback((origin?: string | string[], ...moreOrigins: string[]): [string, T][] => {
        return TreeOps.deepTuples(store.current, origin, ...moreOrigins);
    }, []);

    const deepPairs = useCallback((origin?: string | string[], ...moreOrigins: string[]): { key: string; value: T }[] => {
        return TreeOps.deepPairs(store.current, origin, ...moreOrigins);
    }, []);

    const reduceDeep = useCallback(<R>(reducer: KeyedReducer<T, string, R>, start: R, origin?: string | string[], ...moreOrigins: string[]): R => {
        return TreeOps.reduceDeep(store.current, reducer, start, origin, ...moreOrigins);
    }, []);

    const mapDeep = useCallback(<R>(mapper: KeyedMapper<T, string, R>, origin?: string | string[], ...moreOrigins: string[]): R[] => {
        return TreeOps.mapDeep(store.current, mapper, origin, ...moreOrigins);
    }, []);

    const wideUpwardKeys = useCallback((origin?: string | string[], ...moreOrigins: string[]): string[] => {
        return TreeOps.wideUpwardKeys(store.current, origin, ...moreOrigins);
    }, []);

    const wideUpwardValues = useCallback((origin?: string | string[], ...moreOrigins: string[]): T[] => {
        return TreeOps.wideUpwardValues(store.current, origin, ...moreOrigins);
    }, []);

    const wideUpwardTuples = useCallback((origin?: string | string[], ...moreOrigins: string[]): [string, T][] => {
        return TreeOps.wideUpwardTuples(store.current, origin, ...moreOrigins);
    }, []);

    const wideUpwardPairs = useCallback((origin?: string | string[], ...moreOrigins: string[]): { key: string; value: T }[] => {
        return TreeOps.wideUpwardPairs(store.current, origin, ...moreOrigins);
    }, []);

    const reduceUpwardsWide = useCallback(<R>(reducer: KeyedReducer<T, string, R>, start: R, origin?: string | string[], ...moreOrigins: string[]): R => {
        return TreeOps.reduceUpwardsWide(store.current, reducer, start, origin, ...moreOrigins);
    }, []);

    const mapUpwardsWide = useCallback(<R>(mapper: KeyedMapper<T, string, R>, origin?: string | string[], ...moreOrigins: string[]): R[] => {
        return TreeOps.mapUpwardsWide(store.current, mapper, origin, ...moreOrigins);
    }, []);

    const deepUpwardKeys = useCallback((origin?: string | string[], ...moreOrigins: string[]): string[] => {
        return TreeOps.deepUpwardKeys(store.current, origin, ...moreOrigins);
    }, []);

    const deepUpwardValues = useCallback((origin?: string | string[], ...moreOrigins: string[]): T[] => {
        return TreeOps.deepUpwardValues(store.current, origin, ...moreOrigins);
    }, []);

    const deepUpwardTuples = useCallback((origin?: string | string[], ...moreOrigins: string[]): [string, T][] => {
        return TreeOps.deepUpwardTuples(store.current, origin, ...moreOrigins);
    }, []);

    const deepUpwardPairs = useCallback((origin?: string | string[], ...moreOrigins: string[]): { key: string; value: T }[] => {
        return TreeOps.deepUpwardPairs(store.current, origin, ...moreOrigins);
    }, []);

    const reduceUpwardsDeep = useCallback(<R>(reducer: KeyedReducer<T, string, R>, start: R, origin?: string | string[], ...moreOrigins: string[]): R => {
        return TreeOps.reduceUpwardsDeep(store.current, reducer, start, origin, ...moreOrigins);
    }, []);

    const mapUpwardsDeep = useCallback(<R>(mapper: KeyedMapper<T, string, R>, origin?: string | string[], ...moreOrigins: string[]): R[] => {
        return TreeOps.mapUpwardsDeep(store.current, mapper, origin, ...moreOrigins);
    }, []);

    const pathKeys = useCallback((from: string, to: string): string[] => {
        return TreeOps.pathKeys(store.current, from, to);
    }, []);

    const pathValues = useCallback((from: string, to: string): T[] => {
        return TreeOps.pathValues(store.current, from, to);
    }, []);

    const pathTuples = useCallback((from: string, to: string): [string, T][] => {
        return TreeOps.pathTuples(store.current, from, to);
    }, []);

    const pathPairs = useCallback((from: string, to: string): { key: string; value: T }[] => {
        return TreeOps.pathPairs(store.current, from, to);
    }, []);

    const reducePath = useCallback(<R>(from: string, to: string, reducer: KeyedReducer<T, string, R>, start: R): R => {
        return TreeOps.reducePath(store.current, from, to, reducer, start);
    }, []);

    const mapPath = useCallback(<R>(from: string, to: string, mapper: KeyedMapper<T, string, R>): R[] => {
        return TreeOps.mapPath(store.current, from, to, mapper);
    }, []);

    // yeah, I'm gonna memo the whole thing, don't need this causing a re-render all the time.
    return useMemo(
        () => ({
            has,
            contains,
            some,
            keyOf,
            findKeyOf,
            isRoot,
            isLeaf,
            get,
            depth,
            size,
            subtreeCount,
            add,
            addLeaf,
            addRoot,
            move,
            update,
            updateWith,
            upsert,
            upsertWith,
            emplace,
            emplaceWith,
            graft,
            sprout,
            truncate,
            pluck,
            prune,
            splice,
            trim,
            condense,
            clear,
            populate,
            detach,
            subtrees,
            rootKeyOf,
            parentKey,
            parent,
            ancestorKeys,
            ancestors,
            childrenKeys,
            children,
            siblingKeys,
            siblings,
            wideDescendentKeys,
            wideDescendents,
            deepDescendentKeys,
            deepDescendents,
            rootKeys,
            rootValues,
            rootTuples,
            rootCollection,
            leafKeys,
            leafValues,
            leafTuples,
            leafCollection,
            wideKeys,
            wideValues,
            wideTuples,
            widePairs,
            reduceWide,
            mapWide,
            deepKeys,
            deepValues,
            deepTuples,
            deepPairs,
            reduceDeep,
            mapDeep,
            pathKeys,
            pathValues,
            pathTuples,
            pathPairs,
            reducePath,
            mapPath,
            wideUpwardKeys,
            wideUpwardValues,
            wideUpwardTuples,
            wideUpwardPairs,
            reduceUpwardsWide,
            mapUpwardsWide,
            deepUpwardKeys,
            deepUpwardValues,
            deepUpwardTuples,
            deepUpwardPairs,
            reduceUpwardsDeep,
            mapUpwardsDeep,
        }),
        [
            add,
            addLeaf,
            addRoot,
            ancestorKeys,
            ancestors,
            children,
            childrenKeys,
            clear,
            condense,
            contains,
            deepDescendentKeys,
            deepDescendents,
            deepKeys,
            deepPairs,
            deepTuples,
            deepUpwardKeys,
            deepUpwardPairs,
            deepUpwardTuples,
            deepUpwardValues,
            deepValues,
            depth,
            detach,
            emplace,
            emplaceWith,
            findKeyOf,
            get,
            graft,
            has,
            isLeaf,
            isRoot,
            keyOf,
            leafCollection,
            leafKeys,
            leafTuples,
            leafValues,
            mapDeep,
            mapPath,
            mapUpwardsDeep,
            mapUpwardsWide,
            mapWide,
            move,
            parent,
            parentKey,
            pathKeys,
            pathPairs,
            pathTuples,
            pathValues,
            pluck,
            populate,
            prune,
            reduceDeep,
            reducePath,
            reduceUpwardsDeep,
            reduceUpwardsWide,
            reduceWide,
            rootCollection,
            rootKeyOf,
            rootKeys,
            rootTuples,
            rootValues,
            siblingKeys,
            siblings,
            size,
            some,
            splice,
            sprout,
            subtreeCount,
            subtrees,
            trim,
            truncate,
            update,
            updateWith,
            upsert,
            upsertWith,
            wideDescendentKeys,
            wideDescendents,
            wideKeys,
            widePairs,
            wideTuples,
            wideUpwardKeys,
            wideUpwardPairs,
            wideUpwardTuples,
            wideUpwardValues,
            wideValues,
        ]
    );
};
