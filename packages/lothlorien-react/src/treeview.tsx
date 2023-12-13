/* eslint-disable @typescript-eslint/no-explicit-any */
import { Comparator, SortedTree, Tree } from "@playableprints/lothlorien";
import { memo, ReactNode, useRef, useMemo, MutableRefObject } from "react";
import { proxy, useSnapshot } from "valtio";

// React, why don't you have a genericable memo...
const genericMemo: <T>(component: T) => T = memo;

type PayloadOf<T> = T extends Tree<infer P> ? P : never;

/**
 * @prop nodeKey - the key of the node being rendered
 * @prop value - the value of this node of the tree
 * @prop treeRef - a reference to the tree object
 * @prop childNodes - include this in the return statement to render this node's children.
 * @interface
 * @group Component Props
 */
export type TreeNodeComponentProps<T extends Tree<any>> = {
    nodeKey: string;
    value: PayloadOf<T>;
    treeRef: T;
    childNodes: ReactNode;
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
export type TreeNodeComponent<T extends Tree<any>> = (props: TreeNodeComponentProps<T>) => JSX.Element;

/**
 * Creates and returns a stable {@link Tree} object
 * @group Hooks
 */

export const useTree = <P,>() => useRef<Tree<P>>(proxy(new Tree<P>()));

/**
 * Creates and returns a stable {@link SortedTree} object
 * @group Hooks
 */

export const useSortedTree = <P,>(sorter?: Comparator<[string, P]>) => useRef<SortedTree<P>>(proxy(new SortedTree<P>(sorter)));

/**
 * @prop value - a RefObject of the tree that will be rendered.
 * @prop renderer - the component that will be used to render the tree's nodes.
 * @interface
 * @group Component Props
 */

export type TreeViewProps<T extends Tree<any>> = { value: MutableRefObject<T>; renderer: TreeNodeComponent<T> };

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
export const TreeView = <T extends Tree<any>>(props: TreeViewProps<T>) => {
    const { value, renderer } = props;
    const snapshot = useSnapshot(value.current);
    return snapshot.rootKeys().map((key) => {
        return <NodeRenderWrapper<T> renderer={renderer} nodeKey={key} key={key} treeRef={value.current} />;
    });
};

// Passthrough that uses our renderer prop and sets up pre-memoized props for it.
const NodeRenderWrapper = genericMemo(<T extends Tree<any>>(props: { nodeKey: string; renderer: TreeNodeComponent<T>; treeRef: T }) => {
    const { nodeKey, renderer: Renderer, treeRef } = props;
    const snapshot = useSnapshot(treeRef);

    const { children, value } = useMemo(() => {
        return snapshot.entry(nodeKey)!;
    }, [snapshot, nodeKey]);

    // setup for recursion
    const childNodes = useMemo(() => {
        return children.map((cId) => {
            return <NodeRenderWrapper<T> key={cId} nodeKey={cId} renderer={Renderer} treeRef={treeRef} />;
        });
    }, [Renderer, children, treeRef]);

    // our custom renderer comes to fruition.
    return <Renderer nodeKey={nodeKey} value={value as PayloadOf<T>} treeRef={treeRef} childNodes={childNodes} />;
});
