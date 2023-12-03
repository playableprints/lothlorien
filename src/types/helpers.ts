/**
 * A function that takes a value of type T and returns a boolean result.
 * Used for discriminating or filtering values of type T in various operations.
 *
 * @template T - The type of the value being discriminated.
 * @param {T} value - The value to be checked.
 * @returns {boolean} - True if the value satisfies the condition, otherwise false.
 */
export type Discriminator<T> = (value: T) => boolean;

/**
 * A function that takes a value of type T and a key and returns a boolean result.
 * Used for discriminating or filtering values of type T and key in various operations.
 *
 * @template T - The type of the value being discriminated.
 * @param {T} value - The value to be checked.
 * @param {string} key - The key to be checked.
 * @returns {boolean} - True if the value satisfies the condition, otherwise false.
 */
export type KeyedDiscriminator<T> = (value: T, key: string) => boolean;

/**
 * A function that takes a previous value of type T and returns an updated value of the same type.
 * Used for updating values in certain data structures or scenarios.
 *
 * @template T - The type of the value being updated.
 * @param {T} previous - The previous value to be updated.
 * @param {R} return - The type to be returned. Defaults to T.
 * @returns {R} - The updated value.
 */
export type Updater<T, R = T> = (previous: T) => R;

/**
 * A function that takes a previous value of type T (or undefined if not present) and returns an upserted value of the same type.
 * Used for inserting or updating values in certain data structures or scenarios.
 *
 * @template T - The type of the value being upserted.
 * @param {T | undefined} previous - The previous value to be upserted or undefined if not present.
 * @returns {T} - The upserted value.
 */
export type Upserter<T> = (previous: T | undefined) => T;

/**
 * A function that reduces or accumulates values of type N by applying a custom logic and returning the accumulated result.
 *
 * @template R - The type of the accumulated result.
 * @template N - The type of the values being processed in the reduction.
 * @template K - The type of the keys used during the reduction (default: string).
 * @param {N} value - The value being processed in the reduction.
 * @param {K} key - The key associated with the value being processed in the reduction.
 * @param {number} i - The index of the current value in the reduction (optional).
 * @param {R} accumulation - The current accumulated result.
 * @returns {R} - The updated accumulated result after processing the current value.
 */
export type KeyedReducer<N, K = string, R = void> = (value: N, key: K, i: number, accumulation: R) => R;

/**
 * A function that reduces or accumulates values of type N by applying a custom logic and returning the accumulated result.
 *
 * @template R - The type of the accumulated result.
 * @template N - The type of the values being processed in the reduction.
 * @param {N} value - The value being processed in the reduction.
 * @param {number} i - The index of the current value in the reduction (optional).
 * @param {R} accumulation - The current accumulated result.
 * @returns {R} - The updated accumulated result after processing the current value.
 */
export type Reducer<R, N> = (value: N, i: number, accumulation: R) => R;

/**
 * A function that maps a function along a set of entries.
 *
 * @template R - The type of the result.
 * @template N - The type of the values being processed in the mapping.
 * @template K - The type of the keys used during the mapping (default: string).
 * @param {N} value - The value being processed in the mapping.
 * @param {K} key - The key associated with the value being processed in the mapping.
 * @param {number} i - The index of the current value in the mapoing (optional).
 * @returns {R} - The final map being applied.
 */
export type KeyedMapper<N, K = string, R = void> = (value: N, key: K, i: number) => R;

/**
 * Represents a type that can either be a single value of type T or an iterable containing values of type T.
 *
 * @template T - The type of elements in the iterable.
 */
export type IterableOr<T> = T | Iterable<T>;

export type Comparator<T> = (a: T, b: T) => number;

export type TreeEntry<T> = {
    key: string;
    parent: string | null;
    children: string[];
    value: T;
};
