/* eslint-disable @typescript-eslint/no-explicit-any */
import { Tree } from "@playableprints/lothlorien";
import { MutableRefObject, RefObject, ComponentType } from "react";
import { MetaProvider, NodeWrapper, OnFoldHandler, OnScreen, TreeFoldControls, TreeNodeComponent, UnderFold } from "./util";
import { useSnapshot } from "valtio";

/**
 *
 * @template T - the type of tree that the component prop will be rendering
 * @prop value - a RefObject of the tree that will be rendered.
 * @prop renderer - the component that will be used to render the tree's nodes.
 * @prop startClosed - used to indicate what the default fold state is for nodes.
 * @prop onFold - a callback that is fired when one or more nodes is fired
 * @prop foldControls - pass the return value of useFoldControls into this prop to allow external control of a tree's fold state
 * @prop placeholder - the element that will be rendered as a placeholder when the node is off-screen. defaults to a simple div.
 * @prop placeholderHeight - the height of a placeholder, in pixels. this should be approximately the same height as your on-screen nodes.
 *
 * @interface
 * @group Component Props
 */

export type LazyTreeViewProps<T extends Tree<any>> = {
    value: MutableRefObject<T>;
    foldControls?: RefObject<TreeFoldControls>;
    startClosed?: boolean;
    renderer: TreeNodeComponent<T>;
    placeholder?: ComponentType<{ style?: React.CSSProperties; "data-key"?: string }>;
    placeholderHeight: number;
    onFold?: OnFoldHandler;
};

/**
 * Renders a given tree with each node being rendered by the included renderer component prop.
 * Off-screen nodes will be rendered as placeholders and swapped out for actual nodes when they appear on screen.
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
 *      return <LazyTreeView value={myTree} renderer={MyNodeRenderer} placeholderHeight={32} />
 * }
 * ```
 *
 */

export const LazyTreeView = <T extends Tree<any>>(props: LazyTreeViewProps<T>) => {
    const snapshot = useSnapshot(props.value.current);
    return (
        <MetaProvider tree={snapshot as T} controls={props.foldControls} startClosed={props.startClosed ?? false} onFold={props.onFold}>
            {snapshot.deepKeys().map((k) => {
                return (
                    <UnderFold nodeKey={k} key={k}>
                        <OnScreen placeholder={props.placeholder} height={props.placeholderHeight}>
                            <NodeWrapper nodeKey={k} renderer={props.renderer} treeRef={props.value} />
                        </OnScreen>
                    </UnderFold>
                );
            })}
        </MetaProvider>
    );
};
