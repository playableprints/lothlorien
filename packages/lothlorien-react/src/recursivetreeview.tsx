/* eslint-disable @typescript-eslint/no-explicit-any */
import { Tree } from "@playableprints/lothlorien";
import { MutableRefObject, RefObject, useMemo } from "react";
import { useSnapshot } from "valtio";
import { MetaProvider, RecursiveNodeWrapper, OnFoldHandler, TreeFoldControls, TreeNodeComponent } from "./util";

/**
 * @template T - the type of tree that the component prop will be rendering
 * @prop value - a RefObject of the tree that will be rendered.
 * @prop renderer - the component that will be used to render the tree's nodes.
 * @interface
 * @group Component Props
 */

export type RecursiveTreeViewProps<T extends Tree<any>> = {
    value: MutableRefObject<T>;
    renderer: TreeNodeComponent<T>;
    foldControls?: RefObject<TreeFoldControls>;
    startClosed?: boolean;
    onFold?: OnFoldHandler;
};

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

export const RecursiveTreeView = <T extends Tree<any>>(props: RecursiveTreeViewProps<T>) => {
    const snapshot = useSnapshot(props.value.current);
    const keys = useMemo(() => {
        return snapshot.rootKeys();
    }, [snapshot]);

    return (
        <MetaProvider tree={snapshot as T} controls={props.foldControls} startClosed={props.startClosed ?? false} onFold={props.onFold}>
            {keys.map((key) => {
                return <RecursiveNodeWrapper<T> renderer={props.renderer} nodeKey={key} key={key} treeRef={props.value} />;
            })}
        </MetaProvider>
    );
};
