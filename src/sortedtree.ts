import { Tree } from "./tree";
import { IterableOr, KeyedDiscriminator, Comparator, TreeEntry } from "./types/helpers";
import { ISortedTree } from "./types/isortedtree";
import { ITree } from "./types/itree";

const natsort = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: "base",
}).compare;

const DEFAULT_COMPARATOR = ([aKey]: [string, unknown], [bKey]: [string, unknown]) => natsort(aKey, bKey);

export class SortedTree<T> extends Tree<T> implements ISortedTree<T> {
    protected _keys: string[];
    protected _comparator: Comparator<[string, T]>;

    constructor(defaultComparator?: Comparator<[string, T]>) {
        super();
        this._keys = [];
        this._comparator = defaultComparator ?? DEFAULT_COMPARATOR;

        this.next = this.next.bind(this);
        this.nextWith = this.nextWith.bind(this);
        this.nextKey = this.nextKey.bind(this);
        this.nextKeyWith = this.nextKeyWith.bind(this);
        this.prev = this.prev.bind(this);
        this.prevWith = this.prevWith.bind(this);
        this.prevKey = this.prevKey.bind(this);
        this.prevKeyWith = this.prevKeyWith.bind(this);
        this.keyAt = this.keyAt.bind(this);
        this.valueAt = this.valueAt.bind(this);
        this.setComparator = this.setComparator.bind(this);
        this.sort = this.sort.bind(this);
        this.indexOf = this.indexOf.bind(this);
        this.findIndexOf = this.findIndexOf.bind(this);

        this.siblingIndexOf = this.siblingIndexOf.bind(this);
        this.findSiblingIndexOf = this.findSiblingIndexOf.bind(this);

        this.flatPathKeys = this.flatPathKeys.bind(this);
    }

    siblingIndexOf(key: string): number {
        const siblings = this.siblingKeys(key);
        return siblings.indexOf(key);
    }

    findSiblingIndexOf(key: string, selector: KeyedDiscriminator<T>): number {
        const siblings = this.siblingKeys(key);
        return siblings.findIndex((k) => {
            return selector(this._store[k].value, k);
        });
    }

    nextKey(key: string): string | undefined {
        if (this.has(key)) {
            const i = this._keys.indexOf(key);
            if (i === this._keys.length - 1) {
                return;
            }
            return this._keys[i + 1];
        }
    }

    next(key: string): T | undefined {
        const nk = this.nextKey(key);
        if (nk) {
            return this.get(nk);
        }
    }

    nextKeyWith(key: string, selector: (value: T, key: string) => boolean): string | undefined {
        if (this.has(key)) {
            for (let i = this._keys.indexOf(key); i < this._keys.length; i++) {
                const theK = this._keys[i];
                const theV = this._store[theK].value;
                if (selector(theV, theK)) {
                    return theK;
                }
            }
        }
    }

    nextWith(key: string, selector: (value: T, key: string) => boolean): T | undefined {
        if (this.has(key)) {
            for (let i = this._keys.indexOf(key); i < this._keys.length; i++) {
                const theK = this._keys[i];
                const theV = this._store[theK].value;
                if (selector(theV, theK)) {
                    return theV;
                }
            }
        }
    }

    prevKey(key: string): string | undefined {
        if (this.has(key)) {
            const i = this._keys.indexOf(key);
            if (i === 0) {
                return;
            }
            return this._keys[i - 1];
        }
    }

    prev(key: string): T | undefined {
        const pk = this.prevKey(key);
        if (pk) {
            return this.get(pk);
        }
    }

    prevKeyWith(key: string, selector: (value: T, key: string) => boolean): string | undefined {
        if (this.has(key)) {
            for (let i = this._keys.indexOf(key); i > 0; i--) {
                const theK = this._keys[i];
                const theV = this._store[theK].value;
                if (selector(theV, theK)) {
                    return theK;
                }
            }
        }
    }

    prevWith(key: string, selector: (value: T, key: string) => boolean): T | undefined {
        if (this.has(key)) {
            for (let i = this._keys.indexOf(key); i > 0; i--) {
                const theK = this._keys[i];
                const theV = this._store[theK].value;
                if (selector(theV, theK)) {
                    return theV;
                }
            }
        }
    }

    keyAt(index: number): string | undefined {
        if (index < 0 || index > this._keys.length - 1) {
            return;
        }
        return this._keys[index];
    }

    valueAt(index: number): T | undefined {
        const key = this.keyAt(index);
        if (key) {
            return this.get(key);
        }
    }

    setComparator(comparator: Comparator<[string, T]>): void {
        this._comparator = comparator;
    }

    sort(comparator?: Comparator<[string, T]>): void {
        const theComprator = comparator ?? this._comparator;
        const sortedKeys: string[] = [];
        const doSort = (key: string) => {
            const e = this._store[key];
            sortedKeys.push(key);
            e.children
                .sort((aKey, bKey) => {
                    const aValue = this._store[aKey].value;
                    const bValue = this._store[bKey].value;
                    return theComprator([aKey, aValue], [bKey, bValue]);
                })
                .forEach(doSort);
        };

        this.rootKeys()
            .sort((aKey, bKey) => {
                const aValue = this._store[aKey].value;
                const bValue = this._store[bKey].value;
                return theComprator([aKey, aValue], [bKey, bValue]);
            })
            .forEach(doSort);
        this._keys = sortedKeys;
    }

    indexOf(key: string): number {
        return this._keys.indexOf(key);
    }

    findIndexOf(searcher: KeyedDiscriminator<T>): number {
        return this._keys.findIndex((key) => {
            return searcher(this._store[key].value, key);
        });
    }

    flatPathKeys(from: string, to: string): string[] {
        const fIdx = this._keys.indexOf(from);
        const tIdx = this._keys.indexOf(to);
        if (fIdx !== -1 && tIdx !== -1) {
            const res = this._keys.slice(Math.min(fIdx, tIdx), Math.max(fIdx, tIdx) + 1);
            if (tIdx < fIdx) {
                res.reverse();
            }
            return res;
        }
        return [];
    }

    // OVERRIDE SUPERCLASS METHODS

    clear() {
        super.clear();
        this._keys = [];
    }

    populate<F>(list: Iterable<F>, allocator: (data: F) => void | IterableOr<{ key: string; value: T; parent: string | null }>): void {
        super.populate(list, allocator);
        this.sort();
    }

    // overriding this because I don't want to sort *everything* on every insertion when I can just sort a specific subset after insertion.
    add(key: string, parent: string | null, value: T): void {
        super.add(key, parent, value);
        if (parent === null) {
            this._keys.push(key);
            // gather index ranges of where roots are in the _keys array and where all their contents begin and end.
            const oldRootIndices = this.rootKeys().reduce<{ [key: string]: { from: number; to: number } }>((acc, key, i, ary) => {
                acc[key] = {
                    from: this.indexOf(key),
                    to: i === ary.length - 1 ? ary.length - 1 : this.indexOf(ary[i + 1]),
                };
                return acc;
            }, {});

            const newKeys = this.rootKeys()
                // make sure keys are sorted correctly first.
                .sort((aKey, bKey) => {
                    const aValue = this._store[aKey].value;
                    const bValue = this._store[bKey].value;
                    return this._comparator([aKey, aValue], [bKey, bValue]);
                })
                // allocate chunks from keys in correct order
                .reduce<string[]>((acc, rootKey) => {
                    const { from, to } = oldRootIndices[rootKey];
                    acc.push(rootKey, ...this._keys.slice(from, to));
                    return acc;
                }, []);

            this._keys = newKeys;
        } else {
            // don't use the traditional sort method, because things like 'populate' call 'add' a lot
            // better to sort as locally as possible on each insertion and chunk in the sorted children
            const idx = this._keys.indexOf(parent);
            this._store[parent].children.sort((aKey, bKey) => {
                const aValue = this._store[aKey].value;
                const bValue = this._store[bKey].value;
                return this._comparator([aKey, aValue], [bKey, bValue]);
            });
            this._keys.splice(idx + 1, this._store[parent].children.length - 1, ...this._store[parent].children);
        }
    }

    trim(key: string): T | undefined {
        const res = super.trim(key);
        if (res) {
            this._keys = this._keys.filter((k) => k !== key);
        }
        return res;
    }

    truncate(key: string): { [key: string]: T } | undefined {
        const res = super.truncate(key);
        if (res) {
            const remKeys = Object.keys(res);
            this._keys = this._keys.filter((k) => !remKeys.includes(k));
        }
        return res;
    }

    pluck(key: string): T | undefined {
        const res = super.pluck(key);
        if (res) {
            this.sort();
        }
        return res;
    }

    prune(key: string): ISortedTree<T> {
        const res = new SortedTree<T>();
        const migrate = (k: string) => {
            const { parent, children, value } = this._store[k];
            res.add(k, k === key ? null : parent, value);
            children.forEach(migrate);
            delete this._store[k];
            this._keys = this._keys.filter((k2) => k2 !== k);
        };
        const pKey = this.parentKey(key);
        if (pKey !== undefined && pKey !== null) {
            this._store[pKey].children = this._store[pKey].children.filter((k) => k !== key);
        }
        migrate(key);
        res.sort();
        return res;
    }

    splice(key: string): T | undefined {
        const res = super.splice(key);
        if (res) {
            this.sort();
        }
        return res;
    }

    condense(merger: (a: TreeEntry<T>, b: TreeEntry<T>) => false | TreeEntry<T>): void {
        super.condense(merger);
        this.sort();
    }

    detach(key: string | null): void {
        super.detach(key);
        this.sort();
    }
}
