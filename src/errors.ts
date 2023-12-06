export const Err = {
    UNALLOCATED: (key: string) => `key '${key}' was missing from allocation`,
    DUPLICATE: (key: string) => `key '${key}' already exists in tree`,
    INVALID_PARENT: (parent: string) => `parent key '${parent}' does not exist in tree`,
    NOT_FOUND: (key: string) => `key '${key}' does not exist in tree`,
    MUST_BE_LEAF: (key: string) => `key '${key}' must be a leaf`,
};
