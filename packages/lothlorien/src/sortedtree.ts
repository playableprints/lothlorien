import { Tree } from "./tree";
import { IterableOr, KeyedDiscriminator, Comparator, TreeEntry } from "./types";

const natsort = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: "base",
}).compare;

const DEFAULT_COMPARATOR = ([aKey]: [string, unknown], [bKey]: [string, unknown]) => natsort(aKey, bKey);

export class SortedTree<T> extends Tree<T> {
    protected _keys: string[];
    protected _comparator: Comparator<[string, T]>;

    constructor(defaultComparator?: Comparator<[string, T]>) {
        super();
        this._keys = [];
        this._comparator = defaultComparator ?? DEFAULT_COMPARATOR;
    }

    /**
     * gives the index of a given key amongst it's siblings.
     * @param {string} key
     * @returns {number}
     * @group Hierarchy
     */
    siblingIndexOf(key: string): number {
        const siblings = this.siblingKeys(key);
        return siblings.indexOf(key);
    }

    /**
     * gives the index of a given key amongst it's siblings using a predicate
     * @param {string} key
     * @param {KeyedDiscriminator<T>} selector
     * @returns {number}
     * @group Hierarchy
     */
    findSiblingIndexOf(key: string, selector: KeyedDiscriminator<T>): number {
        const siblings = this.siblingKeys(key);
        return siblings.findIndex((k) => {
            return selector(this._store[k].value, k);
        });
    }

    /**
     * returns the key of the next node relative to the given key in the flattened tree.
     * @param {string} key
     * @returns {string | undefined}
     * @group Traversal
     */
    nextKey(key: string): string | undefined {
        if (this.has(key)) {
            const i = this._keys.indexOf(key);
            if (i === this._keys.length - 1) {
                return;
            }
            return this._keys[i + 1];
        }
    }

    /**
     * returns the value of the next node relative to the given key in the flattened tree.
     * @param {string} key
     * @returns {T | undefined}
     * @group Traversal
     */
    next(key: string): T | undefined {
        const nk = this.nextKey(key);
        if (nk) {
            return this.get(nk);
        }
    }

    /**
     * returns the key of the next node that satisifes the selector relative to the given key in the flattened tree.
     * @param {string} key
     * @param {KeyedDiscriminator<T>} selector
     * @returns {string | undefined}
     * @group Traversal
     */
    nextKeyWith(key: string, selector: KeyedDiscriminator<T>): string | undefined {
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

    /**
     * returns the value of the next node that satisifes the selector relative to the given key in the flattened tree.
     * @param {string} key
     * @param {KeyedDiscriminator<T>} selector
     * @returns {T | undefined}
     * @group Traversal
     */
    nextWith(key: string, selector: KeyedDiscriminator<T>): T | undefined {
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

    /**
     * returns the key of the previous node relative to the given key in the flattened tree.
     * @param {string} key
     * @returns {string | undefined}
     * @group Traversal
     */
    prevKey(key: string): string | undefined {
        if (this.has(key)) {
            const i = this._keys.indexOf(key);
            if (i === 0) {
                return;
            }
            return this._keys[i - 1];
        }
    }

    /**
     * returns the value of the previous node relative to the given key in the flattened tree.
     * @param {string} key
     * @returns {T | undefined}
     * @group Traversal
     */
    prev(key: string): T | undefined {
        const pk = this.prevKey(key);
        if (pk) {
            return this.get(pk);
        }
    }

    /**
     * returns the value of the previous node that satisifes the selector relative to the given key in the flattened tree.
     * @param {string} key
     * @param {KeyedDiscriminator<T>} selector
     * @returns {T | undefined}
     * @group Traversal
     */
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

    /**
     * returns the value of the previous node that satisifes the selector relative to the given key in the flattened tree.
     * @param {string} key
     * @param {KeyedDiscriminator<T>} selector
     * @returns {T | undefined}
     * @group Traversal
     */
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

    /**
     * returns the key at a given index or undefined if index is out of bounds.
     * @param {number} index
     * @returns {string | undefined}
     * @group Query
     */
    keyAt(index: number): string | undefined {
        if (index < 0 || index > this._keys.length - 1) {
            return;
        }
        return this._keys[index];
    }

    /**
     * returns the value at a given index or undefined if index is out of bounds.
     * @param {number} index
     * @returns {T | undefined}
     * @group Query
     */
    valueAt(index: number): T | undefined {
        const key = this.keyAt(index);
        if (key) {
            return this.get(key);
        }
    }

    /**
     * set the default comparator of the SortedTree to a new comparator.
     * @param comparator the comparator to replace the default comprator with
     */
    setComparator(comparator: Comparator<[string, T]>): void {
        this._comparator = comparator;
    }

    /**
     * Sorts the tree in place.
     * @param {Comparator<[string, T]>} [comparator] override the default comparator with this comparator
     * @group Modify
     */
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

    /**
     * returns the index of a given key, or -1 if the key is not present
     * @param {string} key
     * @returns {number}
     * @group Query
     */
    indexOf(key: string): number {
        return this._keys.indexOf(key);
    }

    /**
     * returns the index of a given key using the searcher predicate, or -1 if not found
     * @param {KeyedDiscriminator<T>} searcher
     * @returns {number}
     * @group Query
     */
    findIndexOf(searcher: KeyedDiscriminator<T>): number {
        return this._keys.findIndex((key) => {
            return searcher(this._store[key].value, key);
        });
    }

    /**
     * Finds the keys representing the path from one node to another in the ordered flattened form of the tree.
     * @param {string} from the key of the starting node
     * @param {string} to the key of the ending node
     * @returns {string[]} An array of keys representing the path.
     * @group Traversal
     */
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

    /**
     * @group Traversal
     */
    override rootKeys(): string[] {
        return this._keys.filter((a) => this._store[a].parent === null);
    }

    /**
     * Returns an array of keys representing the leaf nodes of the tree.
     * @returns {string[]} An array of keys representing the leaf nodes.
     * @group Traversal
     */
    override leafKeys(origin: string | string[] = this.rootKeys(), ...moreOrigins: string[]): string[] {
        const from = [...(Array.isArray(origin) ? origin : [origin]), ...moreOrigins];

        //get all leaves
        const allLeaves = this._keys.filter((a) => this._store[a].children.length === 0);

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
     * @group Modify
     */
    override clear() {
        super.clear();
        this._keys = [];
    }

    /**
     * @group Modify
     */
    override populate<F>(list: Iterable<F>, allocator: (data: F) => void | IterableOr<{ key: string; value: T; parent: string | null }>): void {
        super.populate(list, allocator);
        this._keys = Object.keys(this._store);
        this.sort();
    }

    /**
     * @group Modify
     */

    // overriding this because I don't want to sort *everything* on every insertion when I can just sort a specific subset after insertion.
    override add(key: string, parent: string | null, value: T): void {
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

    /**
     * @group Modify
     */

    override move(key: string, parent: string | null): void {
        if (this.has(key) && (parent === null || this.has(parent))) {
            super.move(key, parent);
            this.sort();
        }
    }

    /**
     * @group Modify
     */
    override trim(key: string): T | undefined {
        const res = super.trim(key);
        if (res) {
            this._keys = this._keys.filter((k) => k !== key);
        }
        return res;
    }

    /**
     * @group Modify
     */
    override truncate(key: string): { [key: string]: T } | undefined {
        const res = super.truncate(key);
        if (res) {
            const remKeys = Object.keys(res);
            this._keys = this._keys.filter((k) => !remKeys.includes(k));
        }
        return res;
    }

    /**
     * @group Modify
     */
    override pluck(key: string): T | undefined {
        const res = super.pluck(key);
        if (res) {
            this._keys = Object.keys(this._store);
            this.sort();
        }
        return res;
    }

    /**
     * @group Modify
     */
    override prune(key: string): SortedTree<T> {
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

    /**
     * @group Modify
     */
    override splice(key: string): T | undefined {
        const res = super.splice(key);
        if (res) {
            this._keys = Object.keys(this._store);
            this.sort();
        }
        return res;
    }

    /**
     * @group Modify
     */
    override condense(merger: (a: TreeEntry<T>, b: TreeEntry<T>) => void | { key: string; value: T }): void {
        super.condense(merger);
        this.sort();
    }

    /**
     * @group Modify
     */
    override detach(key: string | null): void {
        super.detach(key);
        this.sort();
    }
}
