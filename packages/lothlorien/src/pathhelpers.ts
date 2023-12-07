export function dirname(p: string): string {
    if (p === "") return ".";
    if (p === "/") return "/";

    const d = p.split("/");
    if (d.pop() === "") {
        // Pop twice, because the last item was a "/"
        d.pop();
    }
    return d.join("/");
}

/**
 *
 * @param path a string to deconstruct into members
 * @param delim the delimeter used for splitting
 * @returns an array where each value is the a "step" along the deconstructed path - parent is the preceding, name is the current step
 *
 * for example:
 *  ```
 * deconstructedPaths("/alpha/bravo/gamma/delta/", "/") returns [
 *      {parent: "/", name: "alpha/", }
 *      {parent: "/alpha/", name: "bravo/", }
 *      {parent: "/alpha/bravo/", name: "gamma/", }
 *      {parent: "/alpha/bravo/gamma/", name: "delta/"}
 * ]
 * ```
 * see ``useFileTree`` for some heavy usage
 */
export function deconstructPaths(path: string, delim: string) {
    return path.split(delim).reduce((acc, segment, i, arr) => {
        if (segment) {
            acc.push({
                parent: arr.slice(0, i).join(delim) + delim,
                name: segment + delim,
            });
        }
        return acc;
    }, [] as { parent: string; name: string }[]);
}

export function buildBranches(paths: string[], delim: string) {}

/**
 * Accepts only an absolute directory path, and returns the array of directories required to insert a directory there
 *
 * We assume p ends with a "/", otherwise we add one.
 * @param p
 */
export function getTree(p: string): string[] {
    if (p === "") return [];
    if (p === "/") return ["/"];

    if (!p.endsWith("/")) {
        p = p + "/";
    }

    const paths = p.split("/").reduce((acc, segment, i, arr) => {
        acc.push(arr.slice(0, i).join("/") + "/");
        return acc;
    }, [] as string[]);

    return [...new Set(paths)];
}
