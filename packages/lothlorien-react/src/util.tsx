/* eslint-disable @typescript-eslint/no-explicit-any */
import { Comparator, SortedTree, Tree } from "@playableprints/lothlorien";
import { createContext, ReactNode, RefObject, useRef, useEffect, useMemo, useImperativeHandle, useContext, useSyncExternalStore, useCallback, ComponentType, useState, MutableRefObject, memo } from "react";
import { proxy, useSnapshot } from "valtio";

export const genericMemo: <T>(component: T) => T = memo;

/**
 * @argument changed {[key: string]: boolean} - a key-value mapping of node fold states that have changed and the state they have changed to.
 * @returns
 *
 * @group Callbacks
 */

export type OnFoldHandler = (changed: { [key: string]: boolean }) => void;

/**
 * @template T - the type of tree that the component prop will be rendering
 * @prop nodeKey - the key of the node being rendered
 * @prop value - the value of this node of the tree
 * @prop childKeys - a list of child nodes. Useful to know if this is a leaf node or not.
 * @prop parentKey - the key of this node's parent, or null if it is a root
 * @prop treeRef - a reference to the tree object. Note that this should not be relied upon for reactive updates directly, but rather to access it's methods.
 * @interface
 * @group Component Props
 */
export type TreeNodeComponentProps<T extends Tree<any>> = {
    value: PayloadOf<T>;
    nodeKey: string;
    childKeys: readonly string[];
    parentKey: string | null;
    treeRef: MutableRefObject<T>;
};

/**
 * A component helper type to define what a TreeView takes as a node renderer
 *
 * @example
 * ```ts
 *  type MyPayload = {
 *      name: string
 *  };
 *
 * const MyNodeRenderer: TreeNodeComponent<SortedTree<MyPayload>> = ({ nodeKey, value, childKeys }) => {
 *     return (<>
 *          <div>{value.name}</div>
 *      </>)
 * }
 *
 * const App = () => {
 *      const myTree = useSortedTree<MyPayload>();
 *      return <TreeView value={myTree} renderer={MyNodeRenderer} />
 * }
 * ```
 *
 * @interface
 * @group Component Templates
 */
export type TreeNodeComponent<T extends Tree<any>> = ComponentType<TreeNodeComponentProps<T>>;

/**
 * Creates and returns a stable {@link Tree} proxy object ref
 * @group Hooks
 */

export const useTree = <P,>() => useRef<Tree<P>>(proxy(new Tree<P>()));

/**
 * Creates and returns a stable {@link SortedTree} proxy object reference
 * @group Hooks
 */

export const useSortedTree = <P,>(sorter?: Comparator<[string, P]>) => useRef<SortedTree<P>>(proxy(new SortedTree<P>(sorter)));

export type PayloadOf<T> = T extends Tree<infer P> ? P : never;

/**
 * the interface from useFoldControls, which allows you to modify the fold-state of a tree externally.
 * @interface
 *
 * @group Imperative Handles
 */

export type TreeFoldControls = {
    /**
     *
     * @param {string | Iterable<string>} key - key (or keys) of the node to set.
     * @param {boolean} newState - the open/close state to use
     * @returns
     */
    set: (key: string | Iterable<string>, value: boolean) => void;

    /**
     * warning: since this is an imperative handle and cannot be used as reative state.
     * @param {string | Iterable<string>} key - the key of the node that you wish to get the fold state for
     * @returns {boolean} the node's current fold state
     */
    get: (key: string) => boolean;

    /**
     * @param {string | Iterable<string>} key - will unfold all nodes from root to the target key.
     * @returns
     */
    unfoldTo: (key: string | Iterable<string>) => void;

    /**
     * @param {string | Iterable<string>} key - will unfold all of the given nodes' children
     * @returns
     */
    expandChildren: (key: string | Iterable<string>) => void;
    /**
     * @param {string | Iterable<string>} key - will fold all of the given nodes' children
     * @returns
     */
    collapseChildren: (key: string | Iterable<string>) => void;
    /**
     *
     * @param {string | Iterable<string>} key - the key (or keys) of the node to toggle the fold state for
     * @returns
     */
    toggle: (key: string | Iterable<string>) => void;
    /**
     * resets the fold state of the entire tree to the default.
     * @returns
     */
    reset: () => void;
};

type MetaCTX = {
    markers: {
        sub: (cb: () => void) => () => void;
        get: (nodeKey: string) => string;
    };
    fold: {
        sub: (cb: () => void) => () => void;
        query: (nodeKey: string) => boolean;
    } & TreeFoldControls;
};

const CTX = createContext<MetaCTX | null>(null);

type MetaProviderProps = { children?: ReactNode; tree: Tree<any>; startClosed?: boolean; controls?: RefObject<TreeFoldControls>; onFold?: (changed: { [key: string]: boolean }) => void };

export const MetaProvider = ({ children, tree, startClosed = false, controls, onFold }: MetaProviderProps) => {
    const defaultFoldRef = useRef<boolean>(!startClosed);
    useEffect(() => {
        defaultFoldRef.current = !startClosed;
    }, [startClosed]);

    const onFoldRef = useRef<typeof onFold>(onFold);
    useEffect(() => {
        onFoldRef.current = onFold;
    }, [onFold]);

    const treeRef = useRef<Tree<any>>(tree);
    useEffect(() => {
        treeRef.current = tree;
        markerValueRef.current = rebuildMarkers(tree);
        markerSubs.current.forEach((cb) => cb());
        foldSubs.current.forEach((cb) => cb());
    }, [tree]);

    const foldValueRef = useRef<{ [key: string]: boolean }>({});
    const markerValueRef = useRef<{ [key: string]: string }>(rebuildMarkers(tree));

    const foldSubs = useRef<Set<() => void>>(new Set<() => void>());
    const markerSubs = useRef<Set<() => void>>(new Set<() => void>());

    const ctxValue = useMemo<MetaCTX>(() => {
        return {
            markers: {
                sub: (cb: () => void) => {
                    markerSubs.current.add(cb);
                    return () => {
                        markerSubs.current.delete(cb);
                    };
                },
                get: (nK: string) => {
                    return markerValueRef.current[nK] ?? "";
                },
            },
            fold: {
                sub: (cb: () => void) => {
                    foldSubs.current.add(cb);
                    return () => {
                        foldSubs.current.delete(cb);
                    };
                },
                query: (nK: string) => {
                    //am I visible?
                    const p = treeRef.current.parentKey(nK);
                    if (p === undefined) {
                        return false;
                    }
                    if (p === null) {
                        return true;
                    }
                    return !treeRef.current
                        .ancestorKeys(nK)
                        .reverse()
                        .some((each) => !(foldValueRef.current[each] ?? defaultFoldRef.current));
                },
                get: (nK: string) => {
                    return foldValueRef.current[nK] ?? defaultFoldRef.current;
                },
                toggle: (nK: string | Iterable<string>) => {
                    const toSet = (typeof nK === "string" ? [nK] : [...nK]).reduce<{ [key: string]: boolean }>((acc, each) => {
                        acc[each] = !(foldValueRef.current[each] ?? defaultFoldRef.current);
                        return acc;
                    }, {});
                    foldValueRef.current = { ...foldValueRef.current, ...toSet };
                    foldSubs.current.forEach((cb) => cb());
                    onFoldRef.current?.(toSet);
                },
                set: (nK: string | Iterable<string>, value: boolean) => {
                    const toSet = (typeof nK === "string" ? [nK] : [...nK]).reduce<{ [key: string]: boolean }>((acc, each) => {
                        acc[each] = value;
                        return acc;
                    }, {});
                    foldValueRef.current = { ...foldValueRef.current, ...toSet };
                    foldSubs.current.forEach((cb) => cb());
                    onFoldRef.current?.(toSet);
                },
                collapseChildren: (nK: string | Iterable<string>) => {
                    const toSet = (typeof nK === "string" ? [nK] : [...nK]).reduce<{ [key: string]: boolean }>((acc, theKey) => {
                        treeRef.current.childrenKeys(theKey).forEach((aK) => {
                            acc[aK] = false;
                        });
                        return acc;
                    }, {});
                    foldValueRef.current = { ...foldValueRef.current, ...toSet };
                    onFoldRef.current?.(toSet);
                    foldSubs.current.forEach((cb) => cb());
                },
                expandChildren: (nK: string | Iterable<string>) => {
                    const toSet = (typeof nK === "string" ? [nK] : [...nK]).reduce<{ [key: string]: boolean }>((acc, theKey) => {
                        treeRef.current.childrenKeys(theKey).forEach((aK) => {
                            acc[aK] = true;
                        });
                        return acc;
                    }, {});
                    foldValueRef.current = { ...foldValueRef.current, ...toSet };
                    onFoldRef.current?.(toSet);
                    foldSubs.current.forEach((cb) => cb());
                },
                unfoldTo: (nK: string | Iterable<string>) => {
                    const toSet = (typeof nK === "string" ? [nK] : [...nK]).reduce<{ [key: string]: boolean }>((acc, theKey) => {
                        treeRef.current.ancestorKeys(theKey).forEach((aK) => {
                            acc[aK] = false;
                        });
                        return acc;
                    }, {});
                    foldValueRef.current = { ...foldValueRef.current, ...toSet };
                    onFoldRef.current?.(toSet);
                    foldSubs.current.forEach((cb) => cb());
                },
                reset: () => {
                    const toSet = Object.entries(foldValueRef.current).reduce<{ [key: string]: boolean }>((acc, [k, v]) => {
                        if (v) {
                            acc[k] = false;
                        }
                        return acc;
                    }, {});
                    // we don't actually need to use toSet...
                    foldValueRef.current = {};
                    foldSubs.current.forEach((cb) => cb());
                    onFoldRef.current?.(toSet);
                },
            },
        };
    }, []);

    useImperativeHandle(
        controls,
        () => {
            const { get, set, reset, toggle, unfoldTo, expandChildren, collapseChildren } = ctxValue.fold;
            return {
                get,
                set,
                reset,
                toggle,
                unfoldTo,
                expandChildren,
                collapseChildren,
            };
        },
        [ctxValue]
    );

    return <CTX.Provider value={ctxValue}>{children}</CTX.Provider>;
};

const rebuildMarkers = (tree: Tree<unknown>): { [key: string]: string } => {
    const roots = tree.rootKeys();
    return tree.reduceWide<{ [key: string]: string }>((value, key, i, acc) => {
        const p = tree.parentKey(key)!;
        if (p === null) {
            acc[key] = roots[roots.length - 1] === key ? "└" : "├";
            return acc;
        }
        const siblings = tree.childrenKeys(p);
        const pMarkers = acc[p];
        acc[key] = `${pMarkers.slice(0, -1)}${pMarkers.endsWith("├") ? "│" : " "}${siblings[siblings.length - 1] === key ? "└" : "├"}`;
        return acc;
    }, {});
};

/* Hooks */

/**
 * The various markers used by useMarker and DepthMarker
 *
 * @group Types
 */

export type Marker = "├" | "│" | " " | "└";

/**
 *
 * @param nodeKey the node key that you want to get the controls for.
 * @returns { isOpen: boolean, toggle: () => void }
 *
 * @group Hooks
 */

export const useFoldState = (nodeKey: string) => {
    const ctx = useContext(CTX)?.fold;
    if (!ctx) {
        throw "useFoldState can only be used within a TreeNodeRenderer";
    }
    const { get, toggle, sub } = ctx;

    const isOpen = useSyncExternalStore(sub, () => get(nodeKey));

    const doToggle = useCallback(() => {
        toggle(nodeKey);
    }, [toggle, nodeKey]);

    return { isOpen, toggle: doToggle };
};

export const useVisibility = (nodeKey: string) => {
    const ctx = useContext(CTX)?.fold;
    if (!ctx) {
        throw "useVisibility can only be used within a TreeNodeRenderer";
    }
    const { query, sub } = ctx;
    return useSyncExternalStore(sub, () => query(nodeKey));
    //return useContext(CTX).visibility.get(nodeKey);
};

/**
 * Returns an array of Depth Markers ("├" | "│" | " " | "└") that indicates the depth of the current node.
 * @param nodeKey the nodeKey to get the current marker set from
 * @returns { Marker[] } an array of markers that represents the depth of this node.
 *
 * @group Hooks
 */

export const useMarkers = (nodeKey: string) => {
    const ctx = useContext(CTX)?.markers;
    if (!ctx) {
        throw "DepthMarker can only be used within a TreeNodeRenderer";
    }
    const { get, sub } = ctx;
    const str = useSyncExternalStore(sub, () => get(nodeKey));

    return useMemo(() => {
        return str.split("") as Marker[];
    }, [str]);
};

/**
 * Imperative Handle for TreeFold
 * used to manipulate the fold-state from without the TreeFold container.
 *
 * @example
 *
 * ```ts
 * const App = () => {
 *      const myTree = useTree();
 *      const myControls = useFoldControls();
 *
 *      const openSomeStuff = useCallback(() => {
 *          myControls.current?.set("someKey", true);
 *      }, [])
 *
 *      return <TreeView value={myTree} renderer={MyNodeRenderer} foldControls={controls} />
 * }
 * ```
 *
 * @interface
 * @group Hooks
 */

export const useFoldControls = () => {
    return useRef<TreeFoldControls>({
        get: () => true,
        toggle: () => {},
        collapseChildren: () => {},
        expandChildren: () => {},
        unfoldTo: () => {},
        set: () => {},
        reset: () => {},
    });
};

export const OnScreen = ({
    children,
    height,
    id,
    placeholder: Placeholder = "div",
}: {
    children?: ReactNode;
    height: number;
    visibleOffset?: number;
    id?: string;
    placeholder?: ComponentType<{ style?: React.CSSProperties; "data-key"?: string }> | "div";
}) => {
    const [isVisible, setIsVisible] = useState<boolean>(false);
    const placeholderHeight = useRef<number>(height);
    const intersectionRef = useRef<HTMLDivElement>(null);

    const observerRef = useRef<IntersectionObserver>(
        new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setIsVisible(true);
                }
            },
            { rootMargin: `${Math.max(window.innerHeight, window.innerWidth)}px`, threshold: [0, 1] }
        )
    );

    useEffect(() => {
        const o = observerRef.current;
        const n = intersectionRef.current;
        if (o && n) {
            o.observe(n);
            return () => {
                o.unobserve(n);
            };
        }
    }, []);

    return isVisible ? children : <Placeholder ref={intersectionRef} data-key={id} style={{ height: placeholderHeight.current }} />;
};

export const UnderFold = memo(({ children, nodeKey }: { children?: ReactNode; nodeKey: string }) => {
    const shouldIRender = useVisibility(nodeKey);
    return shouldIRender ? children : null;
});

export const NodeWrapper = <T extends Tree<any>>({ nodeKey, treeRef, renderer: Renderer }: { nodeKey: string; treeRef: MutableRefObject<T>; renderer: TreeNodeComponent<T> }) => {
    const { parent, value, children } = useSnapshot(treeRef.current.entry(nodeKey)!);
    return <Renderer value={value} childKeys={children} nodeKey={nodeKey} treeRef={treeRef} parentKey={parent} />;
};

export const RecursiveNodeWrapper = <T extends Tree<any>>({ nodeKey, renderer: Renderer, treeRef }: { nodeKey: string; treeRef: MutableRefObject<T>; renderer: TreeNodeComponent<T> }) => {
    const { parent, value, children } = useSnapshot(treeRef.current.entry(nodeKey)!);

    const { isOpen } = useFoldState(nodeKey);

    return (
        <>
            <Renderer treeRef={treeRef} nodeKey={nodeKey} value={value} parentKey={parent} childKeys={children} />
            {!isOpen
                ? null
                : children.map((cId) => {
                      return <RecursiveNodeWrapper<T> treeRef={treeRef} renderer={Renderer} nodeKey={cId} key={cId} />;
                  })}
        </>
    );
};
