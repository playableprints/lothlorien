import { ITree } from "@playableprints/lothlorien";
import { memo, ReactNode, HTMLAttributes, useMemo, Fragment } from "react";
import { useSnapshot } from "valtio";

// defaults are ascii art, becuase it's wonderful :3
const DEFAULT_PIPE = <span className={"pipe"}>{"│"}</span>;
const DEFAULT_TEE = <span className={"tee"}>{"├"}</span>;
const DEFAULT_ELBOW = <span className={"elbow"}>{"╰"}</span>;
const DEFAULT_SPACER = <span className={"spacer"}> </span>;

export const TreeDepthMarker = memo(
    ({
        treeRef,
        nodeKey,
        rtf = false,
        spacer = DEFAULT_SPACER,
        pipe = DEFAULT_PIPE,
        elbow = DEFAULT_ELBOW,
        tee = DEFAULT_TEE,
        children,
        ...rest
    }: { treeRef: ITree<unknown>; nodeKey: string; spacer?: ReactNode; pipe?: ReactNode; elbow?: ReactNode; tee?: ReactNode; rtf?: boolean } & HTMLAttributes<HTMLSpanElement>): ReactNode => {
        const snapshot = useSnapshot(treeRef);

        const isLastList = useMemo(() => {
            const theKeys = rtf ? [nodeKey, ...snapshot.ancestorKeys(nodeKey)] : [...snapshot.ancestorKeys(nodeKey).reverse(), nodeKey];
            return theKeys.map((aKey, i, arr) => {
                const pKey = snapshot.parentKey(aKey);
                const siblings = pKey ? snapshot.childrenKeys(pKey) : snapshot.rootKeys();
                const isLastOfSiblings = siblings.indexOf(aKey) === siblings.length - 1;
                const isFinal = rtf ? i === 0 : i === arr.length - 1;
                return <Fragment key={i}>{isFinal ? (isLastOfSiblings ? elbow : tee) : isLastOfSiblings ? spacer : pipe}</Fragment>;
            });
        }, [snapshot, nodeKey, elbow, tee, spacer, pipe, rtf]);

        return (
            <span {...rest}>
                {rtf ? children : null}
                {isLastList}
                {!rtf ? children : null}
            </span>
        );
    }
);
