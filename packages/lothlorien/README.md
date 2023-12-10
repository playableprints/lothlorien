`lothlorien` exports two trees, some helpers and a bunch of types.

# `Tree`

```javascript
import { Tree } from "@playableprints/lothlorien";

// Create a new tree
const tree = new Tree();

// Add a root node
tree.addRoot("/", { counter: 0 });

// Add some leaves
tree.addLeaf("/one", "/", { counter: 1 });
tree.addLeaf("/one/two", "/one", { counter: 2 });
tree.addLeaf("/three", "/", { counter: 3 });

// Print out the structure, in a depth-first way
const treeoutput = tree.deepPairs();

console.log(treeoutput);
/* Prints:

[
  { key: '/', value: { counter: 0 } },
  { key: '/one', value: { counter: 1 } },
  { key: '/one/two', value: { counter: 2 } },
  { key: '/three', value: { counter: 3 } }
]

*/
```

See the [basic example code](../../examples/basic.js) for a working example.

# `SortedTree`

# `treeutil`

# Types
