/* eslint-disable @typescript-eslint/no-explicit-any */
import { Tree } from "@playableprints/lothlorien";
import { ForwardedRef, ReactNode, RefAttributes, createContext, forwardRef, useCallback, useContext, useEffect, useImperativeHandle, useMemo, useRef, useSyncExternalStore } from "react";

type TreeFoldStore = {
    get: () => { [key: string]: { [key: string]: boolean } };
    set: (key: string, newState: boolean, prefix?: string) => void;
    toggle: (key: string, prefix?: string) => void;
    listen: (cb: () => void) => () => void;
    initial: () => boolean;
};

const TreeToggleCTX = createContext<TreeFoldStore | null>(null);

/**
 * Imperative Handle for TreeFold
 * used to manipulate the fold-state from without the TreeFold container.
 *
 * @example
 *
 * ```ts
 * const App = () => {
 *      const myTree = useTree();
 *      const myControls = useRef<TreeFoldControls>(null);
 *
 *      const openSomeStuff = useCallback(() => {
 *          myControls.current?.set("someKey", true);
 *      }, [])
 *
 *      return <TreeFold ref={myControls}>
 *          <TreeView value={myTree} renderer={MyNodeRenderer} />
 *      </TreeFold>
 * }
 * ```
 *
 * @interface
 * @group Imperative Handles
 */

export interface TreeFoldControls {
    /**
     *
     * @param {string | Iterable<string>} key - key (or keys) of the node to set.
     * @param {boolean} newState - the open/close state to use
     * @param {string} [prefix] - used to differentiate between multiple tree states, if relevant
     * @returns
     */
    set: (key: string | Iterable<string>, newState: boolean, prefix?: string) => void;
    /**
     *
     * @param {string | Iterable<string>} key - the key (or keys) of the node to toggle
     * @param {string} [prefix] - used to differentiate between multiple tree states, if needed.
     * @returns
     */
    toggle: (key: string | Iterable<string>, prefix?: string) => void;
    /**
     * re-syncs the internal state to coincide with the existing keys on a tree.
     * initializes new keys in internal state, removed unused keys from internal state.
     * @param {T} tree - the tree used to sync the internal state with
     * @param prefix
     * @returns
     */
    sync: <T extends Tree<any>>(tree: T, prefix?: string) => void;
    /**
     * clears the fold state.
     * @param {string} [prefix] - used to differentiate between multiple tree states, if relevant
     * @returns
     */
    clear: (prefix?: string) => void;
    /**
     * will set the internal state to the provided state. Useful for recovering from some persistence mechanism.
     * @param { {[key: string]: boolean }} newState - the state to adopt
     * @param {string} [prefix] - used to differentiate between multiple tree states, if relevant
     * @returns
     */
    load: (newState: { [key: string]: boolean }, prefix?: string) => void;
    /**
     * will return the current internal fold state. Useful for persistence.
     * @param {string} [prefix] - used to differentiate between multiple tree states, if relevant
     * @returns
     */
    save: (prefix?: string) => { [key: string]: boolean };
}

/**
 * @prop {ReactNode} [children]
 * @prop {boolean} [startOpen] - if set, any tree node will start in a closed fold state unless a state for that node has been set already
 * @prop {(key: string, state: boolean, prefix: string) => void} [onChange] fired whenever an toggle-state changes.
 *
 * @interface
 * @group Component Props
 */
export type TreeFoldProps = {
    children?: ReactNode;
    startOpen?: boolean;
    onChange?: (key: string, state: boolean, prefix: string) => void;
};

/**
 * Context Provider for the fold-state of a tree.
 *
 * @example
 * ```ts
 * const App = () => {
 *      const tree = useTree<Payload>();
 *      return (
 *          <TreeFold>
 *              <TreeView value={tree} renderer={MyNodeRenderer} />
 *          </TreeFold>
 *      );
 * };
 * ```
 *
 * @group Components
 */

export const TreeFold = forwardRef(({ children, startOpen = false, onChange }: TreeFoldProps, fRef: ForwardedRef<TreeFoldControls>) => {
    const state = useRef<{ [key: string]: { [key: string]: boolean } }>({});
    const listeners = useRef<Set<() => void>>(new Set<() => void>());

    const onChangeRef = useRef(onChange);
    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    const sync = useCallback(<T extends Tree<any>>(tree: T, prefix: string = "") => {
        state.current = {
            ...state.current,
            [prefix]: tree.wideKeys().reduce<{ [key: string]: boolean }>((acc, k) => {
                acc[k] = state.current[prefix][k];
                return acc;
            }, {}),
        };
    }, []);

    const get = useCallback(() => {
        return state.current;
    }, []);

    const set = useCallback((key: string | Iterable<string>, newState: boolean, prefix: string = "") => {
        state.current[prefix] = state.current[prefix] ?? {};
        state.current[prefix] = (typeof key === "string" ? [key] : [...key]).reduce((acc, each) => {
            acc[each] = newState;
            onChangeRef.current?.(each, newState, prefix);
            return acc;
        }, state.current[prefix]);
        listeners.current.forEach((cb) => cb());
    }, []);

    const toggle = useCallback(
        (key: string | Iterable<string>, prefix: string = "") => {
            state.current[prefix] = state.current[prefix] ?? {};
            state.current[prefix] = (typeof key === "string" ? [key] : [...key]).reduce((acc, each) => {
                acc[each] = !(state.current[prefix][each] ?? startOpen);
                onChangeRef.current?.(each, acc[each], prefix);
                return acc;
            }, state.current[prefix]);
            listeners.current.forEach((cb) => cb());
        },
        [startOpen]
    );

    const listen = useCallback((cb: () => void) => {
        listeners.current.add(cb);
        return () => listeners.current.delete(cb);
    }, []);

    const initial = useCallback(() => {
        return startOpen;
    }, [startOpen]);

    const clear = useCallback((prefix: string = "") => {
        state.current[prefix] = {};
        listeners.current.forEach((cb) => cb());
    }, []);

    const load = useCallback((payload: { [key: string]: boolean }, prefix: string = "") => {
        state.current[prefix] = Object.entries(payload).reduce<{ [key: string]: boolean }>((acc, [key, s]) => {
            acc[key] = s;
            return acc;
        }, {});
        listeners.current.forEach((cb) => cb());
    }, []);

    const save = useCallback((prefix: string = "") => {
        return Object.entries(state.current[prefix]).reduce<{ [key: string]: boolean }>((acc, [k, s]) => {
            acc[k] = s;
            return acc;
        }, {});
    }, []);

    const value = useMemo(() => {
        return { set, toggle, listen, get, initial };
    }, [set, toggle, listen, get, initial]);

    useImperativeHandle(
        fRef,
        () => {
            return {
                set,
                toggle,
                sync,
                clear,
                load,
                save,
            };
        },
        [set, toggle, sync, clear, load, save]
    );

    return <TreeToggleCTX.Provider value={value}>{children}</TreeToggleCTX.Provider>;
}) as (props: TreeFoldProps & RefAttributes<TreeFoldControls>) => ReactNode;

/**
 *
 * @param {string} key - the key of the node to control
 * @param {string} [prefix] - the global prefix of the tree-fold state, optional.
 * @returns
 *
 * @example
 * ```ts
 * const MyNodeRenderer: TreeNodeComponent<Tree<Payload>> = (props) => {
 *      const { isOpen, toggle } = useTreeFold(props.nodeKey);
 *      return (
 *          <>
 *              <div>
 *                  <button onClick={toggle}>&bull;</button>
 *                  {props.value.name}
 *              </div>
 *              {isOpen ? props.childNodes : null}
 *          </>
 *      );
 * };
 * ```
 *
 * @group Hooks
 */

export const useTreeFold = (key: string, prefix: string = "") => {
    const store = useContext(TreeToggleCTX);
    if (store === null) {
        throw "useTreeFold() must be used within a component that is a descendent of <TreeFold>";
    }

    const isOpen = useSyncExternalStore(store.listen, () => {
        return store.get()?.[prefix]?.[key] ?? store.initial();
    });

    const toggle = useCallback(() => {
        store.toggle(key, prefix);
    }, [key, store, prefix]);

    const set = useCallback(
        (val: boolean) => {
            store.set(key, val, prefix);
        },
        [key, store, prefix]
    );

    return { isOpen, toggle, set };
};
