/* eslint-disable @typescript-eslint/no-explicit-any */
import { Tree } from "@playableprints/lothlorien";
import { MutableRefObject, RefObject, useMemo } from "react";
import { useSnapshot } from "valtio";
import { MetaProvider, NodeWrapper, OnFoldHandler, TreeFoldControls, TreeNodeComponent, UnderFold, genericMemo } from "./util";

/**
 * @template T - the type of tree that the component prop will be rendering
 * @prop value - a RefObject of the tree that will be rendered.
 * @prop renderer - the component that will be used to render the tree's nodes.
 * @prop startClosed - used to indicate what the default fold state is for nodes.
 * @prop onFold - a callback that is fired when one or more nodes is fired
 * @prop foldControls - pass the return value of useFoldControls into this prop to allow external control of a tree's fold state
 * @interface
 * @group Component Props
 */

export type TreeViewProps<T extends Tree<any>> = {
    value: MutableRefObject<T>;
    foldControls?: RefObject<TreeFoldControls>;
    startClosed?: boolean;
    renderer: TreeNodeComponent<T>;
    onFold?: OnFoldHandler;
};

/**
 * Renders a given tree with each node being rendered by the included renderer component prop.
 * TreeView is memoized using React.memo
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

export const TreeView = genericMemo(<T extends Tree<any>>(props: TreeViewProps<T>) => {
    const snapshot = useSnapshot(props.value.current);

    const keys = useMemo(() => {
        return snapshot.deepKeys();
    }, [snapshot]);

    return (
        <MetaProvider tree={snapshot as T} controls={props.foldControls} startClosed={props.startClosed ?? false} onFold={props.onFold}>
            {keys.map((k) => {
                return (
                    <UnderFold nodeKey={k} key={k}>
                        <NodeWrapper nodeKey={k} renderer={props.renderer} treeRef={props.value} />
                    </UnderFold>
                );
            })}
        </MetaProvider>
    );
});
