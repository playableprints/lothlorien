/* eslint-disable @typescript-eslint/no-explicit-any */
import { Comparator, SortedTree, Tree } from "@playableprints/lothlorien";
import { memo, ReactNode, useRef, useMemo, MutableRefObject } from "react";
import { proxy, useSnapshot } from "valtio";

// React, why don't you have a genericable memo...
const genericMemo: <T>(component: T) => T = memo;

type PayloadOf<T> = T extends Tree<infer P> ? P : never;

export type TreeNodeComponent<T extends Tree<any>> = (props: { nodeKey: string; value: PayloadOf<T>; treeRef: T; childNodes: ReactNode }) => JSX.Element;
export const useTree = <P,>() => useRef<Tree<P>>(proxy(new Tree<P>()));
export const useSortedTree = <P,>(sorter?: Comparator<[string, P]>) => useRef<SortedTree<P>>(proxy(new SortedTree<P>(sorter)));

export const TreeView = <T extends Tree<any>>({ value, renderer }: { value: MutableRefObject<T>; renderer: TreeNodeComponent<T> }) => {
    const snapshot = useSnapshot(value.current);
    return snapshot.rootKeys().map((key) => {
        return <NodeRenderWrapper<T> renderer={renderer} nodeKey={key} key={key} treeRef={value.current} />;
    });
};

// Passthrough that uses our renderer prop and sets up pre-memoized props for it.
const NodeRenderWrapper = genericMemo(<T extends Tree<any>>({ nodeKey, renderer: Renderer, treeRef }: { nodeKey: string; renderer: TreeNodeComponent<T>; treeRef: T }) => {
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
