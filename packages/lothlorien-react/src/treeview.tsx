/* eslint-disable @typescript-eslint/no-explicit-any */
import { Comparator, SortedTree, Tree } from "@playableprints/lothlorien";
import { memo, ReactNode, useRef, useMemo, MutableRefObject } from "react";
import { proxy, useSnapshot } from "valtio";

// React, why don't you have a genericable memo...
const genericMemo: <T>(component: T) => T = memo;

type PayloadOf<T> = T extends Tree<infer P> ? P : never;

/**
 * @template T - the type of tree that the component prop will be rendering
 * @template E - extra props passed down from the <TreeView>
 * @prop nodeKey - the key of the node being rendered
 * @prop value - the value of this node of the tree
 * @prop treeRef - a reference to the tree object
 * @prop childNodes - include this in the return statement to render this node's children.
 * @interface
 * @group Component Props
 */
export type TreeNodeComponentProps<T extends Tree<any>, E extends object = never> = {
    nodeKey: string;
    value: PayloadOf<T>;
    treeRef: MutableRefObject<T>;
    childNodes: ReactNode[];
} & ([E] extends [never] ? unknown : E);

/**
 * A component helper type to define what a TreeView takes as a node renderer
 *
 * @example
 * ```ts
 *  type MyPayload = {
 *      name: string
 *  };
 *
 * const MyNodeRenderer: TreeNodeComponent<SortedTree<MyPayload>> = ({ nodeKey, value, treeRef, childNodes }) => {
 *     return (<>
 *          <div>{value.name}</div>
 *          {childNodes}
 *      </>)
 * }
 *
 * const App = () => {
 *      const myTree = useSortedTree<MyPayload>();
 *      return <TreeView value={myTree} renderer={MyNodeRenderer} />
 * }
 * ```
 *
 */
export type TreeNodeComponent<T extends Tree<any>, E extends object = never> = (props: TreeNodeComponentProps<T, E>) => JSX.Element;

/**
 * Creates and returns a stable {@link Tree} proxy object ref
 * @group Hooks
 */

export const useTree = <P,>() => useRef<Tree<P>>(proxy(new Tree<P>()));

/**
 * Takes a {@link Tree} proxy object and returns a snapshot of it.
 * @group Hooks
 */

export const useTreeSnapshot = <P,>(f: Tree<P>) => useSnapshot(f);

/**
 * Creates and returns a stable {@link Tree} proxy object, for use outside of react components or within callbacks.
 */

export const createTreeProxy = <P,>() => proxy(new Tree<P>());

/**
 * Creates and returns a stable {@link SortedTree} proxy object reference
 * @group Hooks
 */

export const useSortedTree = <P,>(sorter?: Comparator<[string, P]>) => useRef<SortedTree<P>>(proxy(new SortedTree<P>(sorter)));

/**
 * Takes a {@link SortedTree} proxy object and returns a snapshot of it.
 * @group Hooks
 */

export const useSortedTreeSnapshot = <P,>(f: SortedTree<P>) => useSnapshot(f);

/**
 * Creates and returns a stable {@link SortedTree} proxy object, for use outside of react components or within callbacks.
 */

export const createSortedTreeProxy = <P,>(sorter?: Comparator<[string, P]>) => proxy(new SortedTree<P>(sorter));

/**
 * @template T - the type of tree that the component prop will be rendering
 * @template E - the type of the extra props that will be passed down to each node.
 * @prop value - a RefObject of the tree that will be rendered.
 * @prop renderer - the component that will be used to render the tree's nodes.
 * @prop nodeProps - the extra props that will be passed down to each node renderer.
 * @interface
 * @group Component Props
 */

export type TreeViewProps<T extends Tree<any>, E extends object = never> = { value: MutableRefObject<T>; renderer: TreeNodeComponent<T, E> } & ([E] extends [never] ? { nodeProps?: E } : { nodeProps: E });

/**
 * Renders a given tree with each node being rendered by the included renderer component prop.
 *
 * @group Components
 *
 * @example
 * ```ts
 *  type MyPayload = {
 *      name: string
 *  };
 *
 * const MyNodeRenderer = (props: TreeNodeComponentProps<Tree<MyPayload>>) => {
 *     return <div>{props.value.name}</div>
 * }
 *
 * const App = () => {
 *      const myTree = useTree<MyPayload>();
 *      return <TreeView value={myTree} renderer={MyNodeRenderer} />
 * }
 * ```
 *
 */

export const TreeView = <T extends Tree<any>, E extends object = never>({ value, renderer, nodeProps }: TreeViewProps<T, E>) => {
    const snapshot = useSnapshot(value.current);
    const npRef = useRef<E>(proxy(nodeProps));
    const nP = useSnapshot(npRef.current);
    return snapshot.rootKeys().map((key) => {
        return <NodeRenderWrapper<T, E> nodeProps={nP as E} renderer={renderer} nodeKey={key} key={key} treeRef={value} />;
    });
};

// Passthrough that uses our renderer prop and sets up pre-memoized props for it.
const NodeRenderWrapper = genericMemo(<T extends Tree<any>, E extends object = never>(props: { nodeKey: string; renderer: TreeNodeComponent<T, E>; treeRef: MutableRefObject<T>; nodeProps: E }) => {
    const { nodeKey, renderer: Renderer, treeRef, nodeProps } = props;
    const snapshot = useSnapshot(treeRef.current);

    const { children, value } = useMemo(() => {
        return snapshot.entry(nodeKey)!;
    }, [snapshot, nodeKey]);

    // setup for recursion
    const childNodes = useMemo(() => {
        return children.map((cId) => {
            return <NodeRenderWrapper<T, E> nodeProps={nodeProps} treeRef={treeRef} renderer={Renderer} key={cId} nodeKey={cId} />;
        });
    }, [Renderer, children, treeRef, nodeProps]);

    // our custom renderer comes to fruition.
    return <Renderer {...nodeProps} treeRef={treeRef} nodeKey={props.nodeKey} value={value} childNodes={childNodes} />;
});
