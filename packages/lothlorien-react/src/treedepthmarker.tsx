/* eslint-disable @typescript-eslint/no-explicit-any */
import { Tree } from "@playableprints/lothlorien";
import { memo, ReactNode, HTMLAttributes, useMemo, Fragment } from "react";
import { useSnapshot } from "valtio";

// defaults are ascii art, becuase it's wonderful :3
const DEFAULT_PIPE = <span className={"pipe"}>{"│"}</span>;
const DEFAULT_TEE = <span className={"tee"}>{"├"}</span>;
const DEFAULT_ELBOW = <span className={"elbow"}>{"╰"}</span>;
const DEFAULT_SPACER = <span className={"spacer"}> </span>;

const genericMemo: <T>(component: T) => T = memo;

/**
 * @param props TreeDepthMarkerProps
 *   - `treeRef` (T): the tree used to determine depth on
 *   - `nodeKey`: the node key that the current tree-shape is used for
 *   - `spacer` (ReactNode?): The component used as a spacer in the tree
 *   - `tee` (ReactNode?): The component used as a Tee; the tree-shape part next to the node and the node has additional siblings below it.
 *   - `pipe` (ReactNode?): The component used as a Pipe; the tree-shape part when some ancestor of this node has siblings below it
 *   - `elbow` (ReactNode?): The component used as an Elbow: the tree-shape part when this node is the last descendent of it's parent node.
 *   - `rtl` (boolean?): reverse the direction of the tree-shape
 *   - `children` (ReactNode?): additional components to render after the tree-shape (or before, if rtl is true)
 * @group Components
 */
export const TreeDepthMarker = genericMemo(<T extends Tree<any>>(props: { treeRef: T; nodeKey: string; spacer?: ReactNode; pipe?: ReactNode; elbow?: ReactNode; tee?: ReactNode; rtl?: boolean } & HTMLAttributes<HTMLSpanElement>) => {
    const { treeRef, nodeKey, rtl = false, spacer = DEFAULT_SPACER, pipe = DEFAULT_PIPE, elbow = DEFAULT_ELBOW, tee = DEFAULT_TEE, children, ...rest } = props;
    const snapshot = useSnapshot(treeRef);

    const isLastList = useMemo(() => {
        const theKeys = rtl ? [nodeKey, ...snapshot.ancestorKeys(nodeKey)] : [...snapshot.ancestorKeys(nodeKey).reverse(), nodeKey];
        return theKeys.map((aKey, i, arr) => {
            const pKey = snapshot.parentKey(aKey);
            const siblings = pKey ? snapshot.childrenKeys(pKey) : snapshot.rootKeys();
            const isLastOfSiblings = siblings.indexOf(aKey) === siblings.length - 1;
            const isFinal = rtl ? i === 0 : i === arr.length - 1;
            return <Fragment key={i}>{isFinal ? (isLastOfSiblings ? elbow : tee) : isLastOfSiblings ? spacer : pipe}</Fragment>;
        });
    }, [snapshot, nodeKey, elbow, tee, spacer, pipe, rtl]);

    return (
        <span {...rest}>
            {rtl ? children : null}
            {isLastList}
            {!rtl ? children : null}
        </span>
    );
});
