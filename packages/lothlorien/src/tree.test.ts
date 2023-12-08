import { Err } from "./errors";
import { Tree } from "./tree";

const makeTreeAlpha = () => {
    const theTree = new Tree<string>();
    theTree.add("alpha", null, "alphaRoot");
    theTree.add("alpha/1", "alpha", "alphaRoot/a1");
    theTree.add("alpha/1/1", "alpha/1", "alphaRoot/a1/b1");
    theTree.add("alpha/1/1/1", "alpha/1/1", "alphaRoot/a1/b1/c1");
    theTree.add("alpha/1/2", "alpha/1", "alphaRoot/a1/b2");
    theTree.add("alpha/1/3", "alpha/1", "alphaRoot/a1/b3");
    theTree.add("alpha/1/3/1", "alpha/1/3", "alphaRoot/a1/b3/c1");
    theTree.add("alpha/2", "alpha", "alphaRoot/c2");
    theTree.add("alpha/2/1", "alpha/2", "alphaRoot/a2/b1");
    theTree.add("alpha/2/2", "alpha/2", "alphaRoot/a2/b2");

    return theTree;
};

const makeTreeBeta = () => {
    const theTree = new Tree<string>();
    theTree.add("beta", null, "betaRoot");
    theTree.add("beta/1", "beta", "betaRoot/a1");
    theTree.add("beta/2", "beta", "betaRoot/a2");
    theTree.add("beta/1/1", "beta/1", "betaRoot/a1/b1");
    return theTree;
};

const sigmaContent = () => {
    return [
        // Root
        { key: "alpha", parent: null, value: "alphaRoot" },
        // Spaces
        { key: "alpha/one 1", parent: "alpha", value: "alphaRoot/a1 one" },
        {
            key: "alpha/one 1/one 1",
            parent: "alpha/one 1",
            value: "alphaRoot/a1 one/b1 one",
        },
        // Special characters
        {
            key: "alpha/Special Characters , + _ - ! £ $ % ^ & ( ) ¬ ~ @ [ ] ` { } #",
            parent: "alpha",
            value: "alphaRoot/specials",
        },
        {
            key: "alpha/Special Characters , + _ - ! £ $ % ^ & ( ) ¬ ~ @ [ ] ` { } #/one 1",
            parent: "alpha/Special Characters , + _ - ! £ $ % ^ & ( ) ¬ ~ @ [ ] ` { } #",
            value: "alphaRoot/specials/one 1",
        },
    ];
};

const makeTree = (content: { key: string; parent: string | null; value: string }[]): Tree<string> => {
    const theTree = new Tree<string>();
    content.forEach((c) => {
        theTree.add(c.key, c.parent, c.value);
    });
    return theTree;
};

const makeTreeMulti = () => {
    const theTree = new Tree<string>();

    // primary disconnected subtree
    theTree.add("alpha", null, "alphaRoot");
    theTree.add("alpha/1", "alpha", "alphaRoot/a1");
    theTree.add("alpha/1/1", "alpha/1", "alphaRoot/a1/b1");
    theTree.add("alpha/1/1/1", "alpha/1/1", "alphaRoot/a1/b1/c1");
    theTree.add("alpha/1/2", "alpha/1", "alphaRoot/a1/b2");
    theTree.add("alpha/1/3", "alpha/1", "alphaRoot/a1/b3");
    theTree.add("alpha/1/3/1", "alpha/1/3", "alphaRoot/a1/b3/c1");
    theTree.add("alpha/2", "alpha", "alphaRoot/c2");
    theTree.add("alpha/2/1", "alpha/2", "alphaRoot/a2/b1");
    theTree.add("alpha/2/2", "alpha/2", "alphaRoot/a2/b2");

    // second disconnected subtree
    theTree.add("beta", null, "betaRoot");
    theTree.add("beta/1", "beta", "betaRoot/a1");
    theTree.add("beta/2", "beta", "betaRoot/a2");
    theTree.add("beta/1/1", "beta/1", "betaRoot/a1/b1");

    return theTree;
};

test("initialization", () => {
    const theTree = new Tree<string>();
    theTree.add("/", null, "root");
    expect(theTree.get("/")).toBe("root");
});

test.skip("all class methods are bound", () => {
    const dumbTree = new Tree();

    const staticMethods = Object.getOwnPropertyNames(Tree.prototype)
        .filter((v) => v !== "constructor" && typeof Tree.prototype[v as keyof typeof Tree.prototype] === "function")
        .sort();

    const methods = Object.keys(dumbTree)
        .filter((v) => v !== "_store" && typeof dumbTree[v as keyof typeof Tree.prototype] === "function")
        .sort();

    expect(staticMethods).toStrictEqual(methods);
});

describe("status operations", () => {
    test("has - tree has key", () => {
        const theTree = makeTreeAlpha();
        expect(theTree.has("alpha")).toBe(true);
        expect(theTree.has("alpha/1")).toBe(true);
        expect(theTree.has("noSuchKey")).toBe(false);
    });

    test("contains - tree contains value", () => {
        const theTree = makeTreeAlpha();
        expect(theTree.contains("alphaRoot")).toBe(true);
        expect(theTree.contains("alphaRoot/a1")).toBe(true);
        expect(theTree.contains("noSuchValue")).toBe(false);
    });

    test("some - tree has some value", () => {
        const theTree = makeTreeAlpha();
        expect(theTree.some((v) => v === "alphaRoot")).toBe(true);
        expect(theTree.some((v) => v === "noSuchValue")).toBe(false);
    });

    test("keyOf", () => {
        const theTree = makeTreeAlpha();
        expect(theTree.keyOf("alphaRoot")).toBe("alpha");
        expect(theTree.keyOf("alphaRoot/a1")).toBe("alpha/1");
        expect(theTree.keyOf("noSuchValue")).toBe(undefined);
    });

    test("findKeyOf", () => {
        const theTree = makeTreeAlpha();
        expect(theTree.findKeyOf((v) => v === "alphaRoot")).toBe("alpha");
        expect(theTree.findKeyOf((v) => v === "alphaRoot/a1")).toBe("alpha/1");
        expect(theTree.findKeyOf((v) => v === "noSuchValue")).toBe(undefined);
    });

    test("isRoot", () => {
        const theTree = makeTreeAlpha();
        expect(theTree.isRoot("alpha")).toBe(true);
        expect(theTree.isRoot("alpha/1")).toBe(false);
        expect(theTree.isRoot("noSuchKey")).toBe(false);
    });

    test("isLeaf", () => {
        const theTree = makeTreeAlpha();
        expect(theTree.isLeaf("alpha")).toBe(false);
        expect(theTree.isLeaf("alpha/1/1/1")).toBe(true);
        expect(theTree.isLeaf("noSuchKey")).toBe(false);
    });

    test("depth", () => {
        const theTree = makeTreeAlpha();
        expect(theTree.depth("alpha")).toBe(0);
        expect(theTree.depth("alpha/1")).toBe(1);
        expect(theTree.depth("noSuchKey")).toBe(0);
    });

    test("size", () => {
        const theTree = makeTreeAlpha();
        expect(theTree.size()).toBe(10);
    });

    test("subtreeCount", () => {
        const theTree = makeTreeMulti();
        expect(theTree.subtreeCount()).toBe(2);
    });
});

describe("basic CRUD operations", () => {
    describe("get", () => {
        const theTree = makeTreeAlpha();
        test("on root", () => {
            expect(theTree.get("alpha")).toBe("alphaRoot");
        });
        test("on elsewhere", () => {
            expect(theTree.get("alpha/1")).toBe("alphaRoot/a1");
        });
        test("on noSuchKey", () => {
            expect(theTree.get("noSuchKey")).toBe(undefined);
        });
    });

    describe("add", () => {
        test("with valid parent", () => {
            const tree = makeTreeAlpha();
            const startSize = tree.size();
            tree.add("alpha/1/9", "alpha/1", "alphaRoot/a1/z1");
            expect(tree.size()).toBe(startSize + 1);
        });

        test("with invalid parent", () => {
            const tree = makeTreeAlpha();
            const startSize = tree.size();
            tree.add("alpha/1/2", "noSuchKey", "alphaRoot/a1/z1");
            expect(tree.size()).toBe(startSize);
        });

        test("with null parent as new root", () => {
            const tree = makeTreeAlpha();
            const startSize = tree.size();
            tree.add("~", null, "secondRootValue");
            expect(tree.size()).toBe(startSize + 1);
            expect(tree.rootKeys().length).toBe(2);
        });
    });

    test("addRoot", () => {
        const tree = makeTreeAlpha();
        const startSize = tree.size();
        tree.addRoot("~", "secondRootValue");
        expect(tree.size()).toBe(startSize + 1);
        expect(tree.rootKeys().length).toBe(2);
    });

    test("addLeaf", () => {
        const tree = makeTreeAlpha();
        const startSize = tree.size();
        tree.addLeaf("alpha/1/9", "alpha/1", "alphaRoot/a1/z1");
        expect(tree.size()).toBe(startSize + 1);
    });

    test("update", () => {
        const tree = makeTreeAlpha();
        tree.update("alpha", "newAlphaRoot");
        expect(tree.get("alpha")).toBe("newAlphaRoot");
    });

    test("updateWith (setter function)", () => {
        const tree = makeTreeAlpha();
        tree.updateWith("alpha", (prev) => `${prev}Again`);
        expect(tree.get("alpha")).toBe("alphaRootAgain");
    });

    describe("trim (remove only if leaf)", () => {
        test("on leaf", () => {
            const tree = makeTreeAlpha();
            const startSize = tree.size();
            const v = tree.trim("alpha/1/1/1");
            expect(tree.size()).toBe(startSize - 1);
            expect(v).toBe("alphaRoot/a1/b1/c1");
        });
        test("on trunk", () => {
            const tree = makeTreeAlpha();
            const startSize = tree.size();
            tree.trim("alpha");
            expect(tree.size()).toBe(startSize);
        });
        test("on noSuchKey", () => {
            const tree = makeTreeAlpha();
            const startSize = tree.size();
            const v = tree.trim("noSuchKey");
            expect(tree.size()).toBe(startSize);
            expect(v).toBe(undefined);
        });
    });

    test("clear", () => {
        const tree = makeTreeAlpha();
        tree.clear();
        expect(tree.size()).toBe(0);
    });
});

describe("advanced CRUD operations", () => {
    describe("graft (join two trees at inflection point)", () => {
        test("onto leaf", () => {
            const t1 = makeTreeAlpha();
            const t2 = makeTreeBeta();

            t1.graft(t2, "beta", "alpha/1/3/1");

            expect(t1.deepKeys()).toStrictEqual(["alpha", "alpha/1", "alpha/1/1", "alpha/1/1/1", "alpha/1/2", "alpha/1/3", "alpha/1/3/1", "beta", "beta/1", "beta/1/1", "beta/2", "alpha/2", "alpha/2/1", "alpha/2/2"]);
            expect(t1.wideKeys()).toStrictEqual(["alpha", "alpha/1", "alpha/2", "alpha/1/1", "alpha/1/2", "alpha/1/3", "alpha/2/1", "alpha/2/2", "alpha/1/1/1", "alpha/1/3/1", "beta", "beta/1", "beta/2", "beta/1/1"]);
        });

        test("onto trunk", () => {
            const t1 = makeTreeAlpha();
            const t2 = makeTreeBeta();

            t1.graft(t2, "beta", "alpha/2");

            expect(t1.deepKeys()).toStrictEqual(["alpha", "alpha/1", "alpha/1/1", "alpha/1/1/1", "alpha/1/2", "alpha/1/3", "alpha/1/3/1", "alpha/2", "alpha/2/1", "alpha/2/2", "beta", "beta/1", "beta/1/1", "beta/2"]);
            expect(t1.wideKeys()).toStrictEqual(["alpha", "alpha/1", "alpha/2", "alpha/1/1", "alpha/1/2", "alpha/1/3", "alpha/2/1", "alpha/2/2", "beta", "alpha/1/1/1", "alpha/1/3/1", "beta/1", "beta/2", "beta/1/1"]);
        });
    });

    describe("sprout (multi-add)", () => {
        test("onto leaf; using tuples", () => {
            const tree = makeTreeBeta();
            tree.sprout("beta/2", [
                ["beta/2/1", "foo"],
                ["beta/2/2", "bar"],
                ["beta/2/3", "bar"],
            ]);
            expect(tree.deepKeys()).toStrictEqual(["beta", "beta/1", "beta/1/1", "beta/2", "beta/2/1", "beta/2/2", "beta/2/3"]);
            expect(tree.wideKeys()).toStrictEqual(["beta", "beta/1", "beta/2", "beta/1/1", "beta/2/1", "beta/2/2", "beta/2/3"]);
        });

        test("onto leaf; using obj", () => {
            const tree = makeTreeBeta();
            tree.sprout("beta/2", {
                "beta/2/1": "foo",
                "beta/2/2": "bar",
                "beta/2/3": "bar",
            });
            expect(tree.deepKeys()).toStrictEqual(["beta", "beta/1", "beta/1/1", "beta/2", "beta/2/1", "beta/2/2", "beta/2/3"]);
            expect(tree.wideKeys()).toStrictEqual(["beta", "beta/1", "beta/2", "beta/1/1", "beta/2/1", "beta/2/2", "beta/2/3"]);
        });

        test("onto leaf; using k/v pairs", () => {
            const tree = makeTreeBeta();
            tree.sprout("beta/2", [
                { key: "beta/2/1", value: "foo" },
                { key: "beta/2/2", value: "bar" },
                { key: "beta/2/3", value: "bar" },
            ]);
            expect(tree.deepKeys()).toStrictEqual(["beta", "beta/1", "beta/1/1", "beta/2", "beta/2/1", "beta/2/2", "beta/2/3"]);
            expect(tree.wideKeys()).toStrictEqual(["beta", "beta/1", "beta/2", "beta/1/1", "beta/2/1", "beta/2/2", "beta/2/3"]);
        });

        test("onto trunk; using tuples", () => {
            const tree = makeTreeBeta();
            tree.sprout("beta", [
                ["beta/3", "foo"],
                ["beta/4", "bar"],
                ["beta/5", "bar"],
            ]);
            expect(tree.deepKeys()).toStrictEqual(["beta", "beta/1", "beta/1/1", "beta/2", "beta/3", "beta/4", "beta/5"]);
            expect(tree.wideKeys()).toStrictEqual(["beta", "beta/1", "beta/2", "beta/3", "beta/4", "beta/5", "beta/1/1"]);
        });

        test("onto trunk; using obj", () => {
            const tree = makeTreeBeta();
            tree.sprout("beta", {
                "beta/3": "foo",
                "beta/4": "bar",
                "beta/5": "bar",
            });
            expect(tree.deepKeys()).toStrictEqual(["beta", "beta/1", "beta/1/1", "beta/2", "beta/3", "beta/4", "beta/5"]);
            expect(tree.wideKeys()).toStrictEqual(["beta", "beta/1", "beta/2", "beta/3", "beta/4", "beta/5", "beta/1/1"]);
        });

        test("onto trunk; using k/v pairs", () => {
            const tree = makeTreeBeta();
            tree.sprout("beta", [
                { key: "beta/3", value: "foo" },
                { key: "beta/4", value: "bar" },
                { key: "beta/5", value: "bar" },
            ]);
            expect(tree.deepKeys()).toStrictEqual(["beta", "beta/1", "beta/1/1", "beta/2", "beta/3", "beta/4", "beta/5"]);
            expect(tree.wideKeys()).toStrictEqual(["beta", "beta/1", "beta/2", "beta/3", "beta/4", "beta/5", "beta/1/1"]);
        });
    });

    test("truncate (remove from tree at given node and below; inclusive)", () => {
        const tree = makeTreeAlpha();
        expect(tree.deepKeys()).toStrictEqual(["alpha", "alpha/1", "alpha/1/1", "alpha/1/1/1", "alpha/1/2", "alpha/1/3", "alpha/1/3/1", "alpha/2", "alpha/2/1", "alpha/2/2"]);
        const subtree = tree.truncate("alpha/1/3")!;
        expect(subtree).toBeDefined();
        expect(subtree).toStrictEqual({
            "alpha/1/3": "alphaRoot/a1/b3",
            "alpha/1/3/1": "alphaRoot/a1/b3/c1",
        });
        expect(tree.deepKeys()).toStrictEqual(["alpha", "alpha/1", "alpha/1/1", "alpha/1/1/1", "alpha/1/2", "alpha/2", "alpha/2/1", "alpha/2/2"]);
    });

    test("pluck (remove given node, leave children as new roots to their own subtrees)", () => {
        const tree = makeTreeAlpha();
        const startSize = tree.size();
        const startRoots = tree.rootKeys().length;
        const plucked = tree.pluck("alpha/1/1");
        expect(tree.size()).toBe(startSize - 1);
        expect(tree.rootKeys().length).toBe(startRoots + 1);
        expect(plucked).toBe("alphaRoot/a1/b1");
    });

    test("prune (remove subtree at node, and return it while removing)", () => {
        const tree = makeTreeAlpha();
        const subtree = tree.prune("alpha/1/3")!;
        expect(subtree.deepKeys()).toStrictEqual(["alpha/1/3", "alpha/1/3/1"]);
        expect(tree.deepKeys()).toStrictEqual(["alpha", "alpha/1", "alpha/1/1", "alpha/1/1/1", "alpha/1/2", "alpha/2", "alpha/2/1", "alpha/2/2"]);
    });

    test("splice (remove node, and reparent children to parent of removed node)", () => {
        const tree = makeTreeAlpha();
        const spliced = tree.splice("alpha/1/3");
        expect(spliced).toBe("alphaRoot/a1/b3");
        expect(tree.deepKeys()).toStrictEqual(["alpha", "alpha/1", "alpha/1/1", "alpha/1/1/1", "alpha/1/2", "alpha/1/3/1", "alpha/2", "alpha/2/1", "alpha/2/2"]);
    });

    test("condense (collapse nodes according to merger function)", () => {
        const tree = makeTreeAlpha();

        tree.condense((a, b) => {
            return {
                key: `${a.key}/${b.key}`,
                value: `${a.value}/${b.value}`,
            };
        });

        expect(tree.deepKeys()).toStrictEqual(["alpha", "alpha/1", "alpha/1/2", "alpha/1/1/alpha/1/1/1", "alpha/1/3/alpha/1/3/1", "alpha/2", "alpha/2/1", "alpha/2/2"]);
        expect(tree.wideKeys()).toStrictEqual(["alpha", "alpha/1", "alpha/2", "alpha/1/2", "alpha/1/1/alpha/1/1/1", "alpha/1/3/alpha/1/3/1", "alpha/2/1", "alpha/2/2"]);
    });

    test("clear", () => {
        const tree = makeTreeAlpha();
        tree.clear();
        expect(tree.size()).toBe(0);
    });

    test("detach (make given node the root of a new subtree within the tree)", () => {
        const tree = makeTreeAlpha();
        const startSize = tree.size();
        const startRoots = tree.rootKeys().length;
        tree.detach("alpha/1/1");
        expect(tree.size()).toBe(startSize);
        expect(tree.rootKeys().length).toBe(startRoots + 1);
        expect(tree.deepDescendentKeys("alpha").length).toBe(startSize - 3);
        expect(tree.deepDescendentKeys("alpha/1/1").length).toBe(1);
    });

    test("subtrees", () => {
        const tree = makeTreeMulti();
        const [alpha, beta] = tree.subtrees();

        const alphaPrime = makeTreeAlpha();
        const betaPrime = makeTreeBeta();

        expect(alpha.deepKeys()).toStrictEqual(alphaPrime.deepKeys());
        expect(beta.deepKeys()).toStrictEqual(betaPrime.deepKeys());
    });

    describe("populate", () => {
        test("from list of entries", () => {
            const theList = [
                { key: "alpha", parent: null, value: "alphaRoot" },
                { key: "alpha/1", parent: "alpha", value: "alphaRoot/a1" },
                { key: "alpha/1/1", parent: "alpha/1", value: "alphaRoot/a1/b1" },
                {
                    key: "alpha/1/1/1",
                    parent: "alpha/1/1",
                    value: "alphaRoot/a1/b1/c1",
                },
                { key: "alpha/1/2", parent: "alpha/1", value: "alphaRoot/a1/b2" },
                { key: "alpha/1/3", parent: "alpha/1", value: "alphaRoot/a1/b3" },
                {
                    key: "alpha/1/3/1",
                    parent: "alpha/1/3",
                    value: "alphaRoot/a1/b3/c1",
                },
                { key: "alpha/2", parent: "alpha", value: "alphaRoot/c2" },
                { key: "alpha/2/1", parent: "alpha/2", value: "alphaRoot/a2/b1" },
                { key: "alpha/2/2", parent: "alpha/2", value: "alphaRoot/a2/b2" },
            ];

            const tree = new Tree<string>();
            tree.populate(theList, (data) => data);
            const alphaPrime = makeTreeAlpha();
            expect(tree.deepKeys()).toStrictEqual(alphaPrime.deepKeys());
        });

        test("from list of entries with spaces", () => {
            const theList = sigmaContent();

            const tree = new Tree<string>();
            tree.populate(theList, (data) => data);
            const sigmaPrime = makeTree(sigmaContent());
            expect(tree.deepKeys()).toStrictEqual(sigmaPrime.deepKeys());
        });

        test("from list of entries with invalid parents", () => {
            const theList = [
                {
                    key: "/",
                    parent: null,
                    value: "root",
                },
                { key: "alpha/", parent: "alpha", value: "alphaRoot" },
            ];

            const populateTree = () => {
                const tree = new Tree<string>();
                tree.populate(theList, (data) => data);
            };

            expect(populateTree).toThrow(Err.UNALLOCATED("alpha"));
        });

        test("from list of keys (strings)", () => {
            const theList = ["alphaRoot", "alphaRoot/a1", "alphaRoot/a1/b1", "alphaRoot/a1/b1/c1", "alphaRoot/a1/b2", "alphaRoot/a1/b3", "alphaRoot/a1/b3/c1", "alphaRoot/a2", "alphaRoot/a2/b1", "alphaRoot/a2/b2"];

            const tree = new Tree<string>();
            tree.populate(theList, (input) => {
                // "alphaRoot/a1/b1/c1" -> "alpha/1/1/1"
                const key = input
                    .split("/")
                    .map((v, i) => {
                        if (i === 0) {
                            return v.replace("Root", "");
                        } else {
                            return v.replace(/\D/g, "");
                        }
                    })
                    .join("/");
                // "alphaRoot/a1/b1/c1" -> "alpha/1/1/1" -> "alpha/1/1"
                const parent = key.split("/").slice(0, -1);
                // sure!
                const value = input;
                return {
                    key,
                    parent: parent.length === 0 ? null : parent.join("/"),
                    value,
                };
            });

            const alphaPrime = makeTreeAlpha();
            expect(tree.deepKeys()).toStrictEqual(alphaPrime.deepKeys());
        });

        test("inferring parents from list of only leaves (dir structure from file paths)", () => {
            const theList = ["alphaRoot/a1/b1", "alphaRoot/a1/b1/c1", "alphaRoot/a1/b2", "alphaRoot/a1/b3/c1", "alphaRoot/a2/b1", "alphaRoot/a2/b2"];

            const tree = new Tree<string>();
            tree.populate(theList, (input) => {
                const DUMMY = ["", "a", "b", "c"];

                // "alphaRoot/a1/b1/c1" -> "[alpha, 1, 1, 1]"
                const segments = input.split("/").map((v, i) => {
                    if (i === 0) {
                        return v.replace("Root", "");
                    } else {
                        return v.replace(/\D/g, "");
                    }
                });

                const keyGroups = segments.reduce<string[][]>((acc, each, i, ary) => {
                    acc.push(ary.slice(0, i + 1));
                    return acc;
                }, []);

                const res = keyGroups.reduce<{ key: string; parent: string | null; value: string }[]>((acc, eachKey) => {
                    const parent = eachKey.slice(0, -1);
                    acc.push({
                        key: eachKey.join("/"),
                        parent: parent.length === 0 ? null : parent.join("/"),
                        value: eachKey
                            .map((v, i) => {
                                return `${DUMMY[i]}${v}${i === 0 ? "Root" : ""}`;
                            })
                            .join("/"),
                    });
                    return acc;
                }, []);

                return res;
            });

            const alphaPrime = makeTreeAlpha();
            expect(tree.deepKeys()).toStrictEqual(alphaPrime.deepKeys());
        });
    });
});

describe("Traversal", () => {
    describe("deepKeys", () => {
        test("default", () => {
            const tree = makeTreeAlpha();
            expect(tree.deepKeys()).toStrictEqual(["alpha", "alpha/1", "alpha/1/1", "alpha/1/1/1", "alpha/1/2", "alpha/1/3", "alpha/1/3/1", "alpha/2", "alpha/2/1", "alpha/2/2"]);
        });

        test("single-scoped", () => {
            const tree = makeTreeAlpha();
            expect(tree.deepKeys("alpha/1")).toStrictEqual(["alpha/1", "alpha/1/1", "alpha/1/1/1", "alpha/1/2", "alpha/1/3", "alpha/1/3/1"]);
        });

        test("multiple scopes", () => {
            const tree = makeTreeAlpha();
            expect(tree.deepKeys("alpha/1", "alpha/2")).toStrictEqual(["alpha/1", "alpha/1/1", "alpha/1/1/1", "alpha/1/2", "alpha/1/3", "alpha/1/3/1", "alpha/2", "alpha/2/1", "alpha/2/2"]);
        });

        test("overlapping scopes", () => {
            const tree = makeTreeAlpha();
            expect(tree.deepKeys("alpha/1", "alpha/1/2")).toStrictEqual(["alpha/1", "alpha/1/1", "alpha/1/1/1", "alpha/1/2", "alpha/1/3", "alpha/1/3/1"]);
        });
    });

    describe("wideKeys", () => {
        test("default", () => {
            const tree = makeTreeAlpha();
            expect(tree.wideKeys()).toStrictEqual(["alpha", "alpha/1", "alpha/2", "alpha/1/1", "alpha/1/2", "alpha/1/3", "alpha/2/1", "alpha/2/2", "alpha/1/1/1", "alpha/1/3/1"]);
        });

        test("single scopes", () => {
            const tree = makeTreeAlpha();
            expect(tree.wideKeys("alpha/1")).toStrictEqual(["alpha/1", "alpha/1/1", "alpha/1/2", "alpha/1/3", "alpha/1/1/1", "alpha/1/3/1"]);
        });

        test("multiple scopes", () => {
            const tree = makeTreeAlpha();
            expect(tree.wideKeys("alpha/1", "alpha/2")).toStrictEqual(["alpha/1", "alpha/2", "alpha/1/1", "alpha/1/2", "alpha/1/3", "alpha/2/1", "alpha/2/2", "alpha/1/1/1", "alpha/1/3/1"]);
        });

        test("overlapping scopes", () => {
            const tree = makeTreeAlpha();
            expect(tree.wideKeys("alpha/1", "alpha/1/2")).toStrictEqual(["alpha/1", "alpha/1/2", "alpha/1/1", "alpha/1/3", "alpha/1/1/1", "alpha/1/3/1"]);
        });
    });

    describe("deepUpwardKeys", () => {
        test("default", () => {
            const tree = makeTreeAlpha();
            expect(tree.deepUpwardKeys()).toStrictEqual(["alpha/1/1/1", "alpha/1/1", "alpha/1", "alpha", "alpha/1/2", "alpha/1/3/1", "alpha/1/3", "alpha/2/1", "alpha/2", "alpha/2/2"]);
        });

        test("scoped", () => {
            const tree = makeTreeAlpha();
            expect(tree.deepUpwardKeys("alpha/1")).toStrictEqual(["alpha/1/1/1", "alpha/1/1", "alpha/1", "alpha/1/2", "alpha/1/3/1", "alpha/1/3"]);
        });

        test("multiple scopes", () => {
            const tree = makeTreeAlpha();
            expect(tree.deepUpwardKeys("alpha/1", "alpha/2")).toStrictEqual(["alpha/1/1/1", "alpha/1/1", "alpha/1", "alpha/1/2", "alpha/1/3/1", "alpha/1/3", "alpha/2/1", "alpha/2", "alpha/2/2"]);
        });

        test("overlapping scopes", () => {
            const tree = makeTreeAlpha();
            expect(tree.deepUpwardKeys("alpha/1", "alpha/1/2")).toStrictEqual(["alpha/1/1/1", "alpha/1/1", "alpha/1", "alpha/1/2", "alpha/1/3/1", "alpha/1/3"]);
        });
    });

    describe("wideUpwardKeys", () => {
        test("default", () => {
            const tree = makeTreeAlpha();
            expect(tree.wideUpwardKeys()).toStrictEqual(["alpha/1/1/1", "alpha/1/2", "alpha/1/3/1", "alpha/2/1", "alpha/2/2", "alpha/1/1", "alpha/1", "alpha/1/3", "alpha/2", "alpha"]);
        });

        test("scoped", () => {
            const tree = makeTreeAlpha();
            expect(tree.wideUpwardKeys("alpha/1")).toStrictEqual(["alpha/1/1/1", "alpha/1/2", "alpha/1/3/1", "alpha/1/1", "alpha/1", "alpha/1/3"]);
        });

        test("multiple scopes", () => {
            const tree = makeTreeAlpha();
            expect(tree.wideUpwardKeys("alpha/1", "alpha/2")).toStrictEqual(["alpha/1/1/1", "alpha/1/2", "alpha/1/3/1", "alpha/2/1", "alpha/2/2", "alpha/1/1", "alpha/1", "alpha/1/3", "alpha/2"]);
        });

        test("overlapping scopes", () => {
            const tree = makeTreeAlpha();
            expect(tree.wideUpwardKeys("alpha/1", "alpha/1/2")).toStrictEqual(["alpha/1/1/1", "alpha/1/2", "alpha/1/3/1", "alpha/1/1", "alpha/1/3", "alpha/1"]);
        });
    });

    describe("pathKeys", () => {
        test("viable", () => {
            const tree = makeTreeAlpha();
            expect(tree.pathKeys("alpha/2/2", "alpha/1/3")).toStrictEqual(["alpha/2/2", "alpha/2", "alpha", "alpha/1", "alpha/1/3"]);
        });

        test("inviable path (separate subtrees)", () => {
            const tree = makeTreeMulti();
            expect(tree.pathKeys("alpha/2/2", "beta/1/1")).toStrictEqual([]);
        });
    });

    test("rootKeys", () => {
        const tree = makeTreeMulti();
        expect(tree.rootKeys()).toStrictEqual(["alpha", "beta"]);
    });

    test("leafKeys", () => {
        const tree = makeTreeAlpha();
        expect(tree.leafKeys()).toStrictEqual(["alpha/1/1/1", "alpha/1/2", "alpha/1/3/1", "alpha/2/1", "alpha/2/2"]);
    });

    test("scoped leafKeys", () => {
        const tree = makeTreeAlpha();
        expect(tree.leafKeys("alpha/1")).toStrictEqual(["alpha/1/1/1", "alpha/1/2", "alpha/1/3/1"]);
    });

    test("leafKeys with overlapping scopes", () => {
        const tree = makeTreeAlpha();
        expect(tree.leafKeys("alpha/1", "alpha/1/2")).toStrictEqual(["alpha/1/1/1", "alpha/1/2", "alpha/1/3/1"]);
    });
});

describe("Hierarchy", () => {
    test("parentKey", () => {
        const tree = makeTreeAlpha();
        expect(tree.parentKey("alpha/1/1")).toBe("alpha/1");
        expect(tree.parentKey("alpha")).toBe(null);
    });

    test("childrenKeys", () => {
        const tree = makeTreeAlpha();
        expect(tree.childrenKeys("alpha/1")).toStrictEqual(["alpha/1/1", "alpha/1/2", "alpha/1/3"]);
    });

    test("siblingKeys", () => {
        const tree = makeTreeAlpha();
        expect(tree.siblingKeys("alpha/1")).toStrictEqual(["alpha/2"]);
    });

    test("ancestorKeys", () => {
        const tree = makeTreeAlpha();
        expect(tree.ancestorKeys("alpha/1/2")).toStrictEqual(["alpha/1", "alpha"]);
    });

    test("deepDescendentKeys", () => {
        const tree = makeTreeAlpha();
        expect(tree.deepDescendentKeys("alpha/1")).toStrictEqual(["alpha/1/1", "alpha/1/1/1", "alpha/1/2", "alpha/1/3", "alpha/1/3/1"]);
    });

    test("wideDescendentKeys", () => {
        const tree = makeTreeAlpha();
        expect(tree.wideDescendentKeys("alpha/1")).toStrictEqual(["alpha/1/1", "alpha/1/2", "alpha/1/3", "alpha/1/1/1", "alpha/1/3/1"]);
    });
});
