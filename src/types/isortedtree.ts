import { KeyedDiscriminator, Comparator } from "./helpers";
import { ITree } from "./itree";

export interface ISortedTree<T> extends ITree<T> {
    next(key: string): T | undefined;
    nextWith(key: string, selector: KeyedDiscriminator<T>): T | undefined;
    nextKey(key: string): string | undefined;
    nextKeyWith(key: string, selector: KeyedDiscriminator<T>): string | undefined;

    prev(key: string): T | undefined;
    prevKey(key: string): string | undefined;
    prevWith(key: string, selector: KeyedDiscriminator<T>): T | undefined;
    prevKeyWith(key: string, selector: KeyedDiscriminator<T>): string | undefined;

    siblingIndexOf(key: string): number;
    findSiblingIndexOf(key: string, selector: KeyedDiscriminator<T>): number;

    // index of key within siblings

    keyAt(index: number): string | undefined;
    valueAt(index: number): T | undefined;

    flatPathKeys(from: string, to: string): string[];

    indexOf(key: string): number;
    findIndexOf(searcher: KeyedDiscriminator<T>): number;

    setComparator(comparator: Comparator<[string, T]>): void;
    sort(comparator?: Comparator<[string, T]>): void;
}
