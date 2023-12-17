/* eslint-disable @typescript-eslint/no-explicit-any */
import { Tree } from "@playableprints/lothlorien";
import { memo, ReactNode, HTMLAttributes, Fragment, useState, useEffect, MutableRefObject } from "react";
import { useSnapshot } from "valtio";

// defaults are ascii art, becuase it's wonderful :3
const DEFAULT_PIPE = <span className={"pipe"}>{"│"}</span>;
const DEFAULT_TEE = <span className={"tee"}>{"├"}</span>;
const DEFAULT_ELBOW = <span className={"elbow"}>{"╰"}</span>;
const DEFAULT_SPACER = <span className={"spacer"}> </span>;

const genericMemo: <T>(component: T) => T = memo;

/**
 * @prop treeRef - the tree used to determine depth on
 * @prop nodeKey - the node key that the current tree-shape is used for
 * @prop spacer - The component used as a spacer in the tree
 * @prop tee - The component used as a Tee; the tree-shape part next to the node and the node has additional siblings below it.
 * @prop pipe - The component used as a Pipe; the tree-shape part when some ancestor of this node has siblings below it
 * @prop elbow - The component used as an Elbow: the tree-shape part when this node is the last descendent of it's parent node.
 * @prop rtl - reverse the direction of the tree-shape
 * @prop children - additional components to render after the tree-shape (or before, if rtl is true)
 * @prop skipFirst - skips the first item - use this if you don't want a stray pipe or elbow on your root.
 * @interface
 * @group Component Props
 *
 * @example
 * ```ts
 * const MyElbow = <svg preserveAspectRatio="none" viewBox="0 0 1 1" style={{width: "1em", height: "100%"}}><path d={"M 0.5,0 L 0.5,0.5 L 1.0,0.5"} vectorEffect={"non-scaling-stroke"} stroke={"currentColor"} strokeWidth={"1px"} /></svg>
 * const MyTee = <svg preserveAspectRatio="none" viewBox="0 0 1 1" style={{width: "1em", height: "100%"}}><path d={"M 0.5,0 L 0.5,1.0 M 0.5,0.5 L 1.0,0.5"} vectorEffect={"non-scaling-stroke"} stroke={"currentColor"} strokeWidth={"1px"} /></svg>
 * const MyPipe = <svg preserveAspectRatio="none" viewBox="0 0 1 1" style={{width: "1em", height: "100%"}}><path d={"M 0.5,0 L 0.5,1.0"} vectorEffect={"non-scaling-stroke"} stroke={"currentColor"} strokeWidth={"1px"} /></svg>
 * const MySpacer = <svg preserveAspectRatio="none" viewBox="0 0 1 1" style={{width: "1em", height: "100%"}}><path d={""} vectorEffect={"non-scaling-stroke"} stroke={"currentColor"} strokeWidth={"1px"} /></svg>
 *
 * const MyNodeRenderer: TreeNodeComponent<any> = (props) => {
 *  return (<div>
 *      <DepthMarker treeRef={props.treeRef} nodeKey={props.nodeKey} tee={MyTee} elbow={MyElbow} pipe={MyPipe} spacer={MySpacer} />
 *      <span>{props.value.name}</span>
 *  </div>)
 * }
 * ```
 */

export type DepthMarkerProps<T> = { treeRef: MutableRefObject<T>; nodeKey: string; spacer?: ReactNode; pipe?: ReactNode; elbow?: ReactNode; tee?: ReactNode; rtl?: boolean; skipFirst?: boolean };

/**
 * Renders the depth marker for a given tree node
 * for example:
 * ```
 * ╰/root
 *  ├/root/alpha
 *  │╰/root/alpha/1
 *  │ ╰/root/alpha/1/a
 *  ╰/root/beta
 *   ╰/root/beta/1
 * ```
 * setting the "pipe", "elbow", "spacer", and "tee" props alters how the hierarchical shapes are rendered. By default they use the ascii box-drawing characters.
 * - pipe: ``│``
 * - spacer: `` ``
 * - tee: ``├``
 * - elbow: ``╰``
 *
 * @group Components
 */
export const DepthMarker = genericMemo(<T extends Tree<any>>(props: DepthMarkerProps<T> & HTMLAttributes<HTMLSpanElement>) => {
    const { treeRef, nodeKey, rtl = false, spacer = DEFAULT_SPACER, pipe = DEFAULT_PIPE, elbow = DEFAULT_ELBOW, tee = DEFAULT_TEE, children, skipFirst = false, ...rest } = props;
    const snapshot = useSnapshot(treeRef.current);
    const [theKeys, setTheKeys] = useState<Shapes[]>(makeShapeList(nodeKey, snapshot, rtl, skipFirst));

    useEffect(() => {
        setTheKeys((prev) => {
            const res = makeShapeList(nodeKey, snapshot, rtl, skipFirst);
            return areArraysEqual(prev, res) ? prev : res;
        });
    }, [snapshot, rtl, nodeKey, skipFirst]);

    return (
        <span {...rest}>
            {rtl ? children : null}
            <DepthMarkerRenderer shapes={theKeys} tee={tee} spacer={spacer} pipe={pipe} elbow={elbow} />
            {!rtl ? children : null}
        </span>
    );
});

type Shapes = "│" | " " | "├" | "╰";

// TODO: types are complaining about snapshot...
const makeShapeList = (nodeKey: string, snapshot: any, rtl: boolean, skipFirst: boolean) => {
    return (rtl ? [nodeKey, ...snapshot.ancestorKeys(nodeKey)] : [...snapshot.ancestorKeys(nodeKey).reverse(), nodeKey]).slice(skipFirst ? 1 : 0).map((aKey, i, arr) => {
        const pKey = snapshot.parentKey(aKey);
        const siblings = pKey ? snapshot.childrenKeys(pKey) : snapshot.rootKeys();
        const isLastOfSiblings = siblings.indexOf(aKey) === siblings.length - 1;
        const isFinal = rtl ? i === 0 : i === arr.length - 1;
        return isFinal ? (isLastOfSiblings ? "╰" : "├") : isLastOfSiblings ? " " : "│";
    });
};

const DepthMarkerRenderer = genericMemo(({ shapes, tee, spacer, pipe, elbow }: { shapes: Shapes[]; spacer?: ReactNode; pipe?: ReactNode; elbow?: ReactNode; tee?: ReactNode }) => {
    return (
        <>
            {shapes.map((each, i) => {
                switch (each) {
                    case " ":
                        return <Fragment key={i}>{spacer}</Fragment>;
                    case "│":
                        return <Fragment key={i}>{pipe}</Fragment>;
                    case "├":
                        return <Fragment key={i}>{tee}</Fragment>;
                    case "╰":
                        return <Fragment key={i}>{elbow}</Fragment>;
                }
            })}
        </>
    );
});

const areArraysEqual = <T,>(a: T[], b: T[]) => {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;

    //clone and sort?

    for (let i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
};
