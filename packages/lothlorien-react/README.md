`lothlorien-react` exports components and hooks to utilize trees from `lothlorien` within react.

# Getting Started

```ts
import { Tree } from "@playableprints/lothlorien";
import { TreeView, TreeNodeComponentProps, useTree, DepthMarker } from "@playableprints/lothlorien-react";

type MyPayload = {
    name: string;
};

const MyNodeRenderer = ({ nodeKey, treeRef, childNodes, value }: TreeNodeComponentProps<Tree<MyPayload>>) => {
    return (
        <>
            <div>
                <DepthMarker tree={treeRef} nodeKey={nodeKey} />
                <span>{value.name}</span>
            </div>
            {childNodes}
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

Wrap the `<TreeView>` in a `<TreeFold>` and the node renderer can access it via the `useTreeFold` hook.

```ts
type Payload = {
    name: string;
};

const MyNodeRenderer: TreeNodeComponent<Tree<Payload>> = (props) => {
    const { isOpen, toggle } = useTreeFold(props.nodeKey);
    return (
        <>
            <div>
                <button onClick={toggle}>&bull;</button>
                {props.value.name}
            </div>
            {isOpen ? props.childNodes : null}
        </>
    );
};

const App = () => {
    const tree = useTree<Payload>();

    return (
        <TreeFold>
            <TreeView value={tree} renderer={MyNodeRenderer} />
        </TreeFold>
    );
};
```

## More Global-er State

the `<TreeFold>` does not need to be the immediate ancestor of `<TreeView>`. In situations where you wish to preserve a tree's state between switching of contexts, a `<TreeFold>` can exist anywhere in the `<TreeView>`'s ancestry (As with any other react context, it will use the closest one if there are multiple in it's ancestry)

```ts

type Payload = {
    name: string;
};

const MyNodeRenderer: TreeNodeComponent<Tree<Payload>> = (props) => {
    const { isOpen, toggle } = useTreeFold(props.nodeKey);
    return (
        <>
            <div>
                <button onClick={toggle}>&bull;</button>
                {props.value.name}
            </div>
            {isOpen ? props.childNodes : null}
        </>
    );
};


const App = () => {
    const tree = useTree<Payload>();

    return (
        <TreeFold>
            <Router>
                <Route>
                    <TreeView value={tree} renderer={MyNodeRenderer} />
                </Route>
                <Route>
                    {...}
                </Route>
        </TreeFold>
    );
};
```

## Prefixing

It is possible to store multiple tree fold-states in one TreeFold by utilizing a `prefix`. This is useful when using TreeFold in a more global way.

in the below example, by using the prefixes `first` and `second` the state of the two trees won't collide.

```ts
const MyNodeRenderer: TreeNodeComponent<Tree<Payload>> = (props) => {
    const { isOpen, toggle } = useTreeFold(props.nodeKey, "first");
    return (
        <>
            <div>
                <button onClick={toggle}>&bull;</button>
                {props.value.name}
            </div>
            {isOpen ? props.childNodes : null}
        </>
    );
};

const MyOtherNode: TreeNodeComponent<Tree<Payload>> = (props) => {
    const { isOpen, toggle } = useTreeFold(props.nodeKey, "second");
    return (
        <>
            <div>
                <button onClick={toggle}>&bull;</button>
                {props.value.name}
            </div>
            {isOpen ? props.childNodes : null}
        </>
    );
};

const App = () => {
    const firstTree = useTree<Payload>();
    const secondTree = useTree<Payload>();
    return (
        <TreeFold>
            <TreeView value={firstTree} renderer={FirstNodeRenderer} />
            <TreeView value={secondTree} renderer={SecondNodeRenderer} />
        </TreeFold>
    );
};
```

## Imperative Handle and Folder State Hygene

the `<TreeFold>` does come with an imperative handle hook, which will let you both keep current fold state, but keep the internal state clean when the shape of a tree changes.
calling `foldControls.current.sync` in this way will keep any existing fold state as is, initialize any new keys, and discard any that is no longer present as a result of the tree being repopulated.

```ts
const App = () => {
    const [source, setSource] = useState<string[]>([]);
    const tree = useTree<Payload>();
    const foldControls = useRef<TreeFoldControls>(null);

    // re-populate tree when source is changed
    useEffect(() => {
        tree.current.clear();
        tree.current.populate(source, () => {});

        // update fold controls will keep current fold state for keys that still exist, initialize new keys, and remove any now-unused keys.
        // the prefix let's you target a specific fold-state collection, but is optional if you're only handling one tree's state.
        foldControls.current?.sync(tree.current, "myPrefix");
    }, [source, foldControls, tree]);

    return (
        <TreeFold ref={foldControls}>
            <TreeView value={tree} renderer={MyNodeRenderer} />
        </TreeFold>
    );
};
```

You can also utilize the foldControls to toggle or set individual fold states from the outside using `foldControls.current.toggle` and `foldControls.current.set`
