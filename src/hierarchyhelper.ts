import { TreeStore } from "./types/helpers";

export namespace HierarchyHelper {
    export const rootKeys = <T>(store: TreeStore<T>): string[] => {
        return Object.keys(store).filter((a) => store[a].parent === null);
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

    export const ancestorKeys = <T>(store: TreeStore<T>, key: string): string[] => {
        const res: string[] = [];
        const t = store[key];
        if (t && t.parent) {
            res.push(t.parent);
            res.push(...ancestorKeys(store, t.parent));
        }
        return res;
    };

    export const childrenKeys = <T>(store: TreeStore<T>, key: string): string[] => {
        return [...(store[key]?.children ?? [])];
    };

    export const siblingKeys = <T>(store: TreeStore<T>, key: string): string[] => {
        const res: string[] = [];
        if (key in store) {
            const p = store[key].parent;
            return p === null ? rootKeys(store) : store[p].children.filter((a) => a !== key);
        }
        return res;
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

    export const deepDescendentKeys = <T>(store: TreeStore<T>, key: string): string[] => {
        const res: string[] = [];
        const traverse = (k: string) => {
            res.push(k);
            childrenKeys(store, k).forEach(traverse);
        };
        childrenKeys(store, key).forEach(traverse);
        return res;
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
}
