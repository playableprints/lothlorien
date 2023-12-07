import { ITree } from "@playableprints/lothlorien";
import { memo, ReactNode, HTMLAttributes, useContext, MutableRefObject, useMemo } from "react";
import { useSnapshot } from "valtio";
import { TreeCTX } from "./treeview";

// defaults are ascii art, becuase 8-bit :3
const DEFAULT_PIPE = <span className={"pipe"}>{"│"}</span>;
const DEFAULT_TEE = <span className={"tee"}>{"├"}</span>;
const DEFAULT_ELBOW = <span className={"elbow"}>{"╰"}</span>;
const DEFAULT_SPACER = <span className={"spacer"}> </span>;

export const TreeDepthMarker = memo(
    ({
        nodeKey,
        spacer = DEFAULT_SPACER,
        pipe = DEFAULT_PIPE,
        elbow = DEFAULT_ELBOW,
        tee = DEFAULT_TEE,
        ...rest
    }: { nodeKey: string; spacer?: ReactNode; pipe?: ReactNode; elbow?: ReactNode; tee?: ReactNode } & HTMLAttributes<HTMLSpanElement>): ReactNode => {
        const proxy = useContext(TreeCTX) as MutableRefObject<ITree<unknown>>;
        if (proxy === null) {
            throw `<TreeDepthMarker> must be a child of a TreeView component`;
        }
        const snapshot = useSnapshot(proxy.current);

        const isLastList = useMemo(() => {
            const aKeys = snapshot.ancestorKeys(nodeKey).reverse();
            return [...aKeys, nodeKey].map((aKey, i, arr) => {
                const pKey = snapshot.parentKey(aKey);
                const siblings = pKey ? snapshot.childrenKeys(pKey) : snapshot.rootKeys();
                const sIdx = siblings.indexOf(aKey);
                const isLastOfSiblings = sIdx === siblings.length - 1;

                if (i === arr.length - 1) {
                    //last iteration
                    return isLastOfSiblings ? elbow : tee;
                }
                return isLastOfSiblings ? spacer : pipe;
            });
        }, [snapshot, nodeKey, elbow, tee, spacer, pipe]);

        return <span {...rest}>{isLastList}</span>;
    }
);
