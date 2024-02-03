`lothlorien-react` exports components and hooks to utilize trees from `lothlorien` within react.

# Getting Started

```tsx
import { Tree } from "@playableprints/lothlorien";
import { TreeView, TreeNodeComponentProps, useTree, DepthMarker } from "@playableprints/lothlorien-react";

type MyPayload = {
    name: string;
};

const MyNodeRenderer = ({ nodeKey, childKeys, value }: TreeNodeComponentProps<Tree<MyPayload>>) => {
    const isLeaf = childKeys.length === 0;

    return (
        <>
            <div>
                <DepthMarker nodeKey={nodeKey} />
                <span>{value.name}</span>
            </div>
        </>
    );
};

const App = () => {
    const myTree = useTree<MyPayload>();
    return <TreeView value={myTree} renderer={MyNodeRenderer} />;
};
```

# Tree Folding State

When you want to have nodes be collapsable or foldable, you can make use of your own mechanism, but one is included in `lothlorien-react`

## Basic Use

from within your TreeNodeComponent, implement the `useFoldState` hook. That will let you control and check the current fold state of the node.

```tsx
type Payload = {
    name: string;
};

const MyNodeRenderer: TreeNodeComponent<Tree<Payload>> = (props) => {
    const { isOpen, toggle } = useFoldState(props.nodeKey);
    return (
        <>
            <div>
                <button onClick={toggle}>{isOpen ? "▼" : "▶"}</button>
                {props.value.name}
            </div>
        </>
    );
};
```

you can also utilize the `useFoldControls` to control the fold state of the tree from the outside, usually by specifying the key.

```tsx
const App = () => {
    const tree = useTree<Payload>();
    const controls = useFoldControls();

    return (
        <div>
            <button onClick={() => controls.current.unfoldTo("/some/nested/node")}>Unfold</button>
            <TreeView value={tree} renderer={MyNodeRenderer} foldControls={controls} />
        </div>
    );
};
```

# from v0.1.0 to v0.2.0

## TreeNodeRenderer

TreeNodeRenderers are no longer responsible for rendering their own children. You don't need to (nor can you) render `childNodes` anymore. `childKeys` is now included as a prop to TreeNodeRenderer so that you can identify if the node is a leaf (by way of `childKeys.length`, for example).

## FoldState

The new fold state is outlined above, but tl;dr: you don't need a wrapping component anymore, the tree manages it's own fold state now. There is also now a new prop `onFold` that let's you perform actions when a given node folds or unfolds.

## LazyTreeView

A variant of the already-extant `<TreeView/>`, the Lazy Tree View will render placeholders for off-screen nodes and replace them with the rendered node when it comes on screen.
