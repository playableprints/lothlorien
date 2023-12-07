import { Comparator, ISortedTree, ITree, SortedTree, Tree } from "@playableprints/lothlorien";
import { memo, ReactNode, useRef, useContext, useMemo, MutableRefObject, createContext } from "react";
import { proxy, useSnapshot } from "valtio";

// React, why don't you have a genericable memo...
const genericMemo: <T>(component: T) => T = memo;

export const TreeCTX = createContext<MutableRefObject<ITree<unknown>> | null>(null);

export const TreeView = <P, T extends ITree<P>>({ value, renderer }: { value: MutableRefObject<T>; renderer: TreeNodeComponent<P, T> }) => {
    const snapshot = useSnapshot(value.current!);
    return (
        <TreeCTX.Provider value={value}>
            {snapshot.rootKeys().map((key) => {
                return <NodeRenderWrapper<P, T> renderer={renderer} nodeKey={key} key={key} />;
            })}
        </TreeCTX.Provider>
    );
};

export type TreeNodeComponent<P, T extends ITree<P>> = (props: { nodeKey: string; value: P; treeRef: T; childNodes: ReactNode }) => JSX.Element;

export const useTree = <P,>() => useRef<ITree<P>>(proxy(new Tree<P>()));
export const useSortedTree = <P,>(sorter?: Comparator<[string, P]>) => useRef<ISortedTree<P>>(proxy(new SortedTree<P>(sorter)));

// Passthrough that uses our renderer prop and sets up pre-memoized props for it.
const NodeRenderWrapper = genericMemo(<P, T extends ITree<P>>({ nodeKey, renderer: Renderer }: { nodeKey: string; renderer: TreeNodeComponent<P, T> }) => {
    const proxy = useContext(TreeCTX) as MutableRefObject<T>;

    if (proxy === null) {
        throw `<NodeRenderWrapper> should never be able to be used outside of a Treview component, how did you even get here?`;
    }
    const snapshot = useSnapshot(proxy.current);

    const { children, value } = useMemo(() => {
        return snapshot.entry(nodeKey)!;
    }, [snapshot, nodeKey]);

    // setup for recursion
    const childNodes = useMemo(() => {
        return children.map((cId) => {
            return <NodeRenderWrapper key={cId} nodeKey={cId} renderer={Renderer} />;
        });
    }, [Renderer, children]);

    // our custom renderer comes to fruition here.
    return <Renderer nodeKey={nodeKey} value={value} treeRef={proxy.current} childNodes={childNodes} />;
});
