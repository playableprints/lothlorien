import { SortedTree } from "./sortedtree";
import { Tree } from "./tree";
import { Comparator } from "./types";

const TEST_SORTER: Comparator<[string, number]> = ([ak, av], [bk, bv]) => av - bv;

const makeTreeAlpha = () => {
    const theTree = new SortedTree<number>(TEST_SORTER);
    theTree.add("alpha", null, 19);
    theTree.add("alpha/1", "alpha", 29);
    theTree.add("alpha/1/1", "alpha/1", 39);
    theTree.add("alpha/1/1/1", "alpha/1/1", 49);
    theTree.add("alpha/1/2", "alpha/1", 38);
    theTree.add("alpha/1/3", "alpha/1", 37);
    theTree.add("alpha/1/3/1", "alpha/1/3", 48);
    theTree.add("alpha/2", "alpha", 28);
    theTree.add("alpha/2/1", "alpha/2", 36);
    theTree.add("alpha/2/2", "alpha/2", 35);

    return theTree;
    /*
"alpha", //19
    "alpha/2", //28
        "alpha/2/2", //35 -leaf
        "alpha/2/1", //36 -leaf
    "alpha/1", //29
        "alpha/1/3", //37
            "alpha/1/3/1", //48 -leaf
        "alpha/1/2", //38 -leaf
        "alpha/1/1", //39
            "alpha/1/1/1", //49 -leaf
    */
};

const makeTreeBeta = () => {
    const theTree = new SortedTree<number>(TEST_SORTER);
    theTree.add("beta", null, 18);
    theTree.add("beta/1", "beta", 27);
    theTree.add("beta/2", "beta", 26);
    theTree.add("beta/1/1", "beta/1", 34);
    return theTree;

    /*
"beta", //18
    "beta/2", //26
    "beta/1", //27
        "beta/1/1", //34
    */
};

const makeTreeMulti = () => {
    const theTree = new SortedTree<number>(TEST_SORTER);

    // primary disconnected subtree
    theTree.add("alpha", null, 19);
    theTree.add("alpha/1", "alpha", 29);
    theTree.add("alpha/1/1", "alpha/1", 39);
    theTree.add("alpha/1/1/1", "alpha/1/1", 49);
    theTree.add("alpha/1/2", "alpha/1", 38);
    theTree.add("alpha/1/3", "alpha/1", 37);
    theTree.add("alpha/1/3/1", "alpha/1/3", 48);
    theTree.add("alpha/2", "alpha", 28);
    theTree.add("alpha/2/1", "alpha/2", 36);
    theTree.add("alpha/2/2", "alpha/2", 35);

    // second disconnected subtree
    theTree.add("beta", null, 18);
    theTree.add("beta/1", "beta", 27);
    theTree.add("beta/2", "beta", 26);
    theTree.add("beta/1/1", "beta/1", 34);

    return theTree;
};

test("initialization", () => {
    const theTree = new SortedTree<string>();
    theTree.add("/", null, "root");
    expect(theTree.get("/")).toBe("root");
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
        expect(theTree.contains(19)).toBe(true);
        expect(theTree.contains(29)).toBe(true);
        expect(theTree.contains(0)).toBe(false);
    });

    test("some - tree has some value", () => {
        const theTree = makeTreeAlpha();
        expect(theTree.some((v) => v === 39)).toBe(true);
        expect(theTree.some((v) => v === 0)).toBe(false);
    });

    test("keyOf", () => {
        const theTree = makeTreeAlpha();
        expect(theTree.keyOf(19)).toBe("alpha");
        expect(theTree.keyOf(29)).toBe("alpha/1");
        expect(theTree.keyOf(0)).toBe(undefined);
    });

    test("findKeyOf", () => {
        const theTree = makeTreeAlpha();
        expect(theTree.findKeyOf((v) => v === 19)).toBe("alpha");
        expect(theTree.findKeyOf((v) => v === 29)).toBe("alpha/1");
        expect(theTree.findKeyOf((v) => v === 0)).toBe(undefined);
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
            expect(theTree.get("alpha")).toBe(19);
        });
        test("on elsewhere", () => {
            expect(theTree.get("alpha/1")).toBe(29);
        });
        test("on noSuchKey", () => {
            expect(theTree.get("noSuchKey")).toBe(undefined);
        });
    });

    describe("add", () => {
        test("with valid parent", () => {
            const tree = makeTreeAlpha();
            const startSize = tree.size();
            tree.add("alpha/1/9", "alpha/1", 31);
            expect(tree.size()).toBe(startSize + 1);
        });

        test("with invalid parent", () => {
            const tree = makeTreeAlpha();
            expect(() => {
                tree.add("alpha/1/9", "noSuchKey", 31);
            }).toThrow();
        });

        test("with null parent as new root", () => {
            const tree = makeTreeAlpha();
            const startSize = tree.size();
            tree.add("~", null, 8);
            expect(tree.size()).toBe(startSize + 1);
            expect(tree.rootKeys().length).toBe(2);
        });
    });

    test("addRoot", () => {
        const tree = makeTreeAlpha();
        const startSize = tree.size();
        tree.addRoot("~", 99);
        expect(tree.size()).toBe(startSize + 1);
        expect(tree.rootKeys().length).toBe(2);
    });

    test("addLeaf", () => {
        const tree = makeTreeAlpha();
        const startSize = tree.size();
        tree.addLeaf("alpha/1/9", "alpha/1", 99);
        expect(tree.size()).toBe(startSize + 1);
    });

    test("update", () => {
        const tree = makeTreeAlpha();
        tree.update("alpha", 999);
        expect(tree.get("alpha")).toBe(999);
    });

    test("updateWith (setter function)", () => {
        const tree = makeTreeAlpha();
        tree.updateWith("alpha", (prev) => prev + 6);
        expect(tree.get("alpha")).toBe(25);
    });

    describe("trim (remove only if leaf)", () => {
        test("on leaf", () => {
            const tree = makeTreeAlpha();
            const startSize = tree.size();
            const v = tree.trim("alpha/1/1/1");
            expect(tree.size()).toBe(startSize - 1);
            expect(v).toBe(49);
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
    test("establish baseline (alpha)", () => {
        const tree = makeTreeAlpha();
        /* prettier-ignore */
        expect(tree.deepKeys()).toStrictEqual([
            "alpha", //19
                "alpha/2", //28
                    "alpha/2/2", //35
                    "alpha/2/1", //36
                "alpha/1", //29
                    "alpha/1/3", //37
                        "alpha/1/3/1", //48
                    "alpha/1/2", //38
                    "alpha/1/1", //39
                        "alpha/1/1/1", //49
        ]);
    });

    test("establish baseline (beta)", () => {
        const tree = makeTreeBeta();
        /* prettier-ignore */
        expect(tree.deepKeys()).toStrictEqual([
            "beta", //18
                "beta/2", //26
                "beta/1", //27
                    "beta/1/1", //34
        ]);
    });

    describe("graft (join to trees at inflection point)", () => {
        test("onto leaf", () => {
            const t1 = makeTreeAlpha();
            const t2 = makeTreeBeta();

            t1.graft(t2, "beta", "alpha/1/3/1");

            /* prettier-ignore */
            expect(t1.deepKeys()).toStrictEqual([

                "alpha", //19
                "alpha/2", //28
                    "alpha/2/2", //35
                    "alpha/2/1", //36
                "alpha/1", //29
                    "alpha/1/3", //37
                        "alpha/1/3/1", //48
                        "beta", //18
                "beta/2", //26
                "beta/1", //27
                    "beta/1/1", //34
                    "alpha/1/2", //38
                    "alpha/1/1", //39
                        "alpha/1/1/1", //49

            ]);
        });

        test("onto trunk", () => {
            const t1 = makeTreeAlpha();
            const t2 = makeTreeBeta();

            t1.graft(t2, "beta", "alpha/2");

            /* prettier-ignore */
            expect(t1.deepKeys()).toStrictEqual([
                "alpha", //19
                    "alpha/2", //28
                        "beta", //18
                            "beta/2", //28
                            "beta/1", //29
                                "beta/1/1", //39
                        "alpha/2/2", //38
                        "alpha/2/1", //39
                    "alpha/1", //29
                        "alpha/1/3", //37
                            "alpha/1/3/1", //49
                        "alpha/1/2", //38
                        "alpha/1/1", //39
                            "alpha/1/1/1" //49
            ]);
        });
    });

    describe("sprout (multi-add)", () => {
        test("onto leaf; using tuples", () => {
            const tree = makeTreeBeta();
            tree.sprout("beta/2", [
                ["beta/2/1", 62],
                ["beta/2/2", 64],
                ["beta/2/3", 62],
            ]);

            /* prettier-ignore */
            expect(tree.deepKeys()).toStrictEqual([
                "beta", //18
                    "beta/2", //28
                        "beta/2/1", //62
                        "beta/2/3", //64
                        "beta/2/2", //63
                    "beta/1", //29
                        "beta/1/1", //39
            ]);
        });

        test("onto leaf; using obj", () => {
            const tree = makeTreeBeta();
            tree.sprout("beta/2", { "beta/2/1": 62, "beta/2/2": 64, "beta/2/3": 63 });
            /* prettier-ignore */
            expect(tree.deepKeys()).toStrictEqual([
                "beta", //18
                    "beta/2", //28
                        "beta/2/1", //62
                        "beta/2/3", //64
                        "beta/2/2", //63
                    "beta/1", //29
                        "beta/1/1", //39
            ]);
        });

        test("onto leaf; using k/v pairs", () => {
            const tree = makeTreeBeta();
            tree.sprout("beta/2", [
                { key: "beta/2/1", value: 62 },
                { key: "beta/2/2", value: 64 },
                { key: "beta/2/3", value: 63 },
            ]);
            /* prettier-ignore */
            expect(tree.deepKeys()).toStrictEqual([
                "beta", //18
                    "beta/2", //28
                        "beta/2/1", //62
                        "beta/2/3", //63
                        "beta/2/2", //64
                    "beta/1", //29
                        "beta/1/1", //39
            ]);
        });

        test("onto trunk; using tuples", () => {
            const tree = makeTreeBeta();
            tree.sprout("beta", [
                ["beta/3", 62],
                ["beta/4", 64],
                ["beta/5", 63],
            ]);
            /* prettier-ignore */
            expect(tree.deepKeys()).toStrictEqual([
                "beta", //18
                    "beta/2", //28
                    "beta/1", //29
                        "beta/1/1", //39
                    "beta/3", //62
                    "beta/5", //63
                    "beta/4", //64
            ]);
        });

        test("onto trunk; using obj", () => {
            const tree = makeTreeBeta();
            tree.sprout("beta", { "beta/3": 62, "beta/4": 64, "beta/5": 63 });
            /* prettier-ignore */
            expect(tree.deepKeys()).toStrictEqual([
                "beta", //18
                    "beta/2", //28
                    "beta/1", //29
                        "beta/1/1", //39
                    "beta/3", //62
                    "beta/5", //63
                    "beta/4", //64
            ]);
        });

        test("onto trunk; using k/v pairs", () => {
            const tree = makeTreeBeta();
            tree.sprout("beta", [
                { key: "beta/3", value: 62 },
                { key: "beta/4", value: 64 },
                { key: "beta/5", value: 63 },
            ]);
            /* prettier-ignore */
            expect(tree.deepKeys()).toStrictEqual([
                "beta", //18
                    "beta/2", //28
                    "beta/1", //29
                        "beta/1/1", //39
                    "beta/3", //62
                    "beta/5", //63
                    "beta/4", //64
            ]);
        });
    });

    test("truncate (remove from tree at given node and below; inclusive)", () => {
        const tree = makeTreeAlpha();
        /* prettier-ignore */
        expect(tree.deepKeys()).toStrictEqual([
            "alpha", //19
                "alpha/2", //28
                    "alpha/2/2", //35
                    "alpha/2/1", //36
                "alpha/1", //29
                    "alpha/1/3", //37
                        "alpha/1/3/1", //48
                    "alpha/1/2", //38
                    "alpha/1/1", //39
                        "alpha/1/1/1", //49
        ]);
        const subtree = tree.truncate("alpha/1/3")!;
        expect(subtree).toBeDefined();
        expect(subtree).toStrictEqual({
            "alpha/1/3": 37,
            "alpha/1/3/1": 48,
        });
        /* prettier-ignore */
        expect(tree.deepKeys()).toStrictEqual([
            "alpha", //19
                "alpha/2", //28
                    "alpha/2/2", //35
                    "alpha/2/1", //36
                "alpha/1", //29
                    "alpha/1/2", //38
                    "alpha/1/1", //39
                        "alpha/1/1/1", //49
        ]);
    });

    test("pluck (remove given node, leave children as new roots to their own subtrees)", () => {
        const tree = makeTreeAlpha();
        const startSize = tree.size();
        const startRoots = tree.rootKeys().length;
        const plucked = tree.pluck("alpha/1/1");
        expect(tree.size()).toBe(startSize - 1);
        expect(tree.rootKeys().length).toBe(startRoots + 1);
        expect(plucked).toBe(39);
    });

    test("prune (remove subtree at node, and return it while removing)", () => {
        const tree = makeTreeAlpha();
        const subtree = tree.prune("alpha/1/3")!;
        expect(subtree.deepKeys()).toStrictEqual(["alpha/1/3", "alpha/1/3/1"]);
        /* prettier-ignore */
        expect(tree.deepKeys()).toStrictEqual([
            "alpha", //19
                "alpha/2", //28
                    "alpha/2/2", //35
                    "alpha/2/1", //36
                "alpha/1", //29
                    "alpha/1/2", //38
                    "alpha/1/1", //39
                        "alpha/1/1/1", //49
        ]);
    });

    test("splice (remove node, and reparent children to parent of removed node)", () => {
        const tree = makeTreeAlpha();
        const spliced = tree.splice("alpha/1/3");
        expect(spliced).toBe(37);
        /* prettier-ignore */
        expect(tree.deepKeys()).toStrictEqual([
            "alpha", //19
                "alpha/2", //28
                    "alpha/2/2", //35
                    "alpha/2/1", //36
                "alpha/1", //29
                    "alpha/1/2", //38
                    "alpha/1/1", //39
                        "alpha/1/1/1", //49
                    "alpha/1/3/1", //48
        ]);
    });

    test("condense (collapse nodes according to merger function)", () => {
        const tree = makeTreeAlpha();

        tree.condense((a, b) => {
            return {
                key: `${a.key}/${b.key}`,
                value: a.value * b.value,
            };
        });
        /* prettier-ignore */
        expect(tree.deepKeys()).toStrictEqual([
            "alpha", //19
                "alpha/2",  //28
                    "alpha/2/2", //35
                    "alpha/2/1", //36
                "alpha/1", //29
                    "alpha/1/2", //38
                "alpha/1/3/alpha/1/3/1", //1776
                "alpha/1/1/alpha/1/1/1", //1911
        ]);
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
        const [beta, alpha] = tree.subtrees();

        const alphaPrime = makeTreeAlpha();
        const betaPrime = makeTreeBeta();

        expect(alpha.deepKeys()).toStrictEqual(alphaPrime.deepKeys());
        expect(beta.deepKeys()).toStrictEqual(betaPrime.deepKeys());
    });

    describe("populate", () => {
        test("from list of entries", () => {
            const theList = [
                { key: "alpha", parent: null, value: 19 },
                { key: "alpha/1", parent: "alpha", value: 29 },
                { key: "alpha/1/1", parent: "alpha/1", value: 39 },
                { key: "alpha/1/1/1", parent: "alpha/1/1", value: 49 },
                { key: "alpha/1/2", parent: "alpha/1", value: 38 },
                { key: "alpha/1/3", parent: "alpha/1", value: 37 },
                { key: "alpha/1/3/1", parent: "alpha/1/3", value: 49 },
                { key: "alpha/2", parent: "alpha", value: 28 },
                { key: "alpha/2/1", parent: "alpha/2", value: 39 },
                { key: "alpha/2/2", parent: "alpha/2", value: 38 },
            ];

            const tree = new SortedTree<number>(TEST_SORTER);
            tree.populate(theList, (data) => data);
            const alphaPrime = makeTreeAlpha();
            expect(tree.deepKeys()).toStrictEqual(alphaPrime.deepKeys());
        });
    });
});

describe("Traversal", () => {
    test("deepKeys - depth-wise traversal", () => {
        const tree = makeTreeAlpha();
        /* prettier-ignore */
        expect(tree.deepKeys()).toStrictEqual([
            "alpha", //19
            "alpha/2", //28
                "alpha/2/2", //35
                "alpha/2/1", //36
            "alpha/1", //29
                "alpha/1/3", //37
                    "alpha/1/3/1", //48
                "alpha/1/2", //38
                "alpha/1/1", //39
                    "alpha/1/1/1", //49
        ]);
    });

    test("wideKeys - width-wise traversal", () => {
        const tree = makeTreeAlpha();
        /* prettier-ignore */
        expect(tree.wideKeys()).toStrictEqual([

            "alpha", //19
                "alpha/2", //28
                "alpha/1", //29
                    "alpha/2/2", //35
                    "alpha/2/1", //36
                    "alpha/1/3", //37
                    "alpha/1/2", //38
                    "alpha/1/1", //39
                        "alpha/1/3/1", //48
                        "alpha/1/1/1", //49
        ]);
    });

    test("deepUpwardKeys - depth-wise traversal from leaves", () => {
        const tree = makeTreeAlpha();
        /* prettier-ignore */
        expect(tree.deepUpwardKeys()).toStrictEqual([
            "alpha/2/2", //35 -leaf
            "alpha/2", //28
            "alpha", //19
            "alpha/2/1", //36 -leaf
            "alpha/1/3/1", //48 -leaf
            "alpha/1/3", //37
            "alpha/1", //29
            "alpha/1/2", //38 -leaf
            "alpha/1/1/1", //49 -leaf
            "alpha/1/1", //39

        ]);
    });

    test("wideUpwardKeys - width-wise traversal from leaves", () => {
        const tree = makeTreeAlpha();
        /* prettier-ignore */
        expect(tree.wideUpwardKeys()).toStrictEqual([
            "alpha/2/2", //35 -leaf
            "alpha/2/1", //36 -leaf
            "alpha/1/3/1", //48 -leaf
            "alpha/1/2", //38 -leaf
            "alpha/1/1/1", //49 -leaf            
            "alpha/2", //28
            "alpha/1/3", //37
            "alpha/1", //29
            "alpha/1/1", //39
            "alpha", //19
        ]);
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

    test("flatPath", () => {
        const tree = makeTreeAlpha();

        const res = [
            "alpha/2/2", //38
            "alpha/2/1", //39
            "alpha/1", //29
            "alpha/1/3", //37
            "alpha/1/3/1", //49
            "alpha/1/2", //38
        ];
        expect(tree.flatPathKeys("alpha/1/2", "alpha/2/2")).toStrictEqual([...res].reverse());

        expect(tree.flatPathKeys("alpha/2/2", "alpha/1/2")).toStrictEqual([...res]);
    });

    test("rootKeys", () => {
        const tree = makeTreeMulti();
        expect(tree.rootKeys()).toStrictEqual(["beta", "alpha"]);
    });

    test("leafKeys", () => {
        const tree = makeTreeAlpha();
        /* prettier-ignore */
        expect(tree.leafKeys()).toStrictEqual([
            "alpha/2/2", //38
            "alpha/2/1", //39
                "alpha/1/3/1", //49
            "alpha/1/2", //38
                "alpha/1/1/1", //49
        ]);
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
        expect(tree.childrenKeys("alpha/1")).toStrictEqual(["alpha/1/3", "alpha/1/2", "alpha/1/1"]);
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
        /* prettier-ignore */
        expect(tree.deepDescendentKeys("alpha/1")).toStrictEqual([
            "alpha/1/3", 
                "alpha/1/3/1",
            "alpha/1/2", 
            "alpha/1/1", 
                "alpha/1/1/1", 
        ]);
    });

    test("wideDescendentKeys", () => {
        const tree = makeTreeAlpha();
        /* prettier-ignore */
        expect(tree.wideDescendentKeys("alpha/1")).toStrictEqual([

            "alpha/1/3", 
            "alpha/1/2", 
            "alpha/1/1", 
                "alpha/1/3/1",
                "alpha/1/1/1", 

            // "alpha/1/1", "alpha/1/2", "alpha/1/3", "alpha/1/1/1", "alpha/1/3/1"
        ]);
    });
});
