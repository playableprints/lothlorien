/* eslint-disable @typescript-eslint/no-explicit-any */

import { ReactNode, HTMLAttributes, useMemo, Fragment } from "react";
import { useMarkers } from "./util";

// defaults are ascii art, becuase it's wonderful :3
const DEFAULT_PIPE = <span className={"pipe"}>{"│"}</span>;
const DEFAULT_TEE = <span className={"tee"}>{"├"}</span>;
const DEFAULT_ELBOW = <span className={"elbow"}>{"╰"}</span>;
const DEFAULT_SPACER = <span className={"spacer"}> </span>;

/**
 * @prop nodeKey - the node key that the current tree-shape is used for
 * @prop spacer - The component used as a spacer in the tree
 * @prop tee - The component used as a Tee; the tree-shape part next to the node and the node has additional siblings below it.
 * @prop pipe - The component used as a Pipe; the tree-shape part when some ancestor of this node has siblings below it
 * @prop elbow - The component used as an Elbow: the tree-shape part when this node is the last descendent of it's parent node.
 * @prop children - additional components to render after the tree-shape
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
 *      <DepthMarker nodeKey={props.nodeKey} tee={MyTee} elbow={MyElbow} pipe={MyPipe} spacer={MySpacer} />
 *      <span>{props.value.name}</span>
 *  </div>)
 * }
 * ```
 */

export type DepthMarkerProps = { nodeKey: string; spacer?: ReactNode; pipe?: ReactNode; elbow?: ReactNode; tee?: ReactNode; skipFirst?: boolean };

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

export const DepthMarker = (props: DepthMarkerProps & HTMLAttributes<HTMLSpanElement>) => {
    const { nodeKey, spacer = DEFAULT_SPACER, pipe = DEFAULT_PIPE, elbow = DEFAULT_ELBOW, tee = DEFAULT_TEE, children, skipFirst = false, ...rest } = props;
    const markers = useMarkers(nodeKey);

    const renderedMarkers = useMemo(() => {
        return markers
            .slice(skipFirst ? 1 : 0)
            .split("")
            .map((marker, i) => {
                switch (marker) {
                    case "│":
                        return <Fragment key={i}>{pipe}</Fragment>;
                    case "╰":
                        return <Fragment key={i}>{elbow}</Fragment>;
                    case " ":
                        return <Fragment key={i}>{spacer}</Fragment>;
                    case "├":
                        return <Fragment key={i}>{tee}</Fragment>;
                    default:
                        return null;
                }
            });
    }, [markers, skipFirst, spacer, tee, pipe, elbow]);

    return (
        <span {...rest}>
            {renderedMarkers}
            {children}
        </span>
    );
};
