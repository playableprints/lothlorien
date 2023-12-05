import { dirname, getTree } from "./pathhelpers";

import { dirname as oDn } from "path";

describe("dirname should", () => {
    test("ignore empty", () => {
        expect(dirname("")).toStrictEqual(oDn(""));
    });

    test("accept root", () => {
        expect(dirname("/")).toStrictEqual(oDn("/"));
    });

    test("strip file", () => {
        expect(dirname("/a/b")).toStrictEqual(oDn("/a/b"));
    });

    test("strip dir", () => {
        expect(dirname("/a/b/")).toStrictEqual(oDn("/a/b/"));
    });
});

describe("getTree should", () => {
    test("accept root path", () => {
        const dirs = getTree("/");
        expect(dirs).toStrictEqual(["/"]);
    });

    test("return one deep", () => {
        const dirs = getTree("/a");
        expect(dirs).toStrictEqual(["/", "/a/"]);
    });

    test("return two deep", () => {
        const dirs = getTree("/a/b");
        expect(dirs).toStrictEqual(["/", "/a/", "/a/b/"]);
    });

    test("return three deep", () => {
        const dirs = getTree("/a/b/c");
        expect(dirs).toStrictEqual(["/", "/a/", "/a/b/", "/a/b/c/"]);
    });
});
