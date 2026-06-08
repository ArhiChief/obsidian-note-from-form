import { validateTemplate } from "../template/templateValidator";

// ── helpers ──

function validTextItem(overrides: Record<string, unknown> = {}) {
    return {
        id: "title",
        type: "text",
        form: { title: "Title" },
        ...overrides,
    };
}

function validTemplate(overrides: Record<string, unknown> = {}) {
    return {
        "file-name": "t:{{title}}",
        "file-location": "v:/notes",
        "form-items": [validTextItem()],
        ...overrides,
    };
}

// ── tests ──

describe("validateTemplate", () => {

    // ─── valid templates ───

    test("accepts a minimal valid template", () => {
        const result = validateTemplate(validTemplate());
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    test("accepts template without optional fields", () => {
        const result = validateTemplate({
            "form-items": [validTextItem()],
        });
        expect(result.valid).toBe(true);
    });

    test("accepts empty object (all top-level properties optional)", () => {
        const result = validateTemplate({});
        expect(result.valid).toBe(true);
    });

    // ─── file-name ───

    describe("file-name", () => {
        test("accepts template type (t:...)", () => {
            const result = validateTemplate(validTemplate({ "file-name": "t:{{name}}" }));
            expect(result.valid).toBe(true);
        });

        test("accepts value type (v:...)", () => {
            const result = validateTemplate(validTemplate({ "file-name": "v:my-note" }));
            expect(result.valid).toBe(true);
        });

        test("accepts get-function type (f:async (view, api) => ...)", () => {
            const result = validateTemplate(validTemplate({ "file-name": "f:async (view, api) => view.title" }));
            expect(result.valid).toBe(true);
        });

        test("accepts get-function type (f:async function(view, api) { ... })", () => {
            const result = validateTemplate(validTemplate({ "file-name": 'f:async function(view, api) { return "some text"; }' }));
            expect(result.valid).toBe(true);
        });

        test("accepts ref to function name", () => {
            const result = validateTemplate(validTemplate({ "file-name": "ref:getFileName" }));
            expect(result.valid).toBe(true);
        });

        test("accepts ref to file path and function name", () => {
            const result = validateTemplate(validTemplate({ "file-name": "ref:/utils/helpers.md:getFileName" }));
            expect(result.valid).toBe(true);
        });

        test("rejects ref with invalid function name", () => {
            const result = validateTemplate(validTemplate({ "file-name": "ref:1bad" }));
            expect(result.valid).toBe(false);
        });

        test("rejects ref with empty name", () => {
            const result = validateTemplate(validTemplate({ "file-name": "ref:" }));
            expect(result.valid).toBe(false);
        });

        test("rejects plain string", () => {
            const result = validateTemplate(validTemplate({ "file-name": "just a name" }));
            expect(result.valid).toBe(false);
            expect(result.errors).toEqual(expect.arrayContaining([
                "/file-name: must be a template string starting with 't:' followed by at least one character",
                "/file-name: must be a value string starting with 'v:' followed by at least one character",
                "/file-name: must match exactly one schema in oneOf",
            ]));
        });

        test("rejects empty prefix (t:, v:, f: with nothing after)", () => {
            const resultT = validateTemplate(validTemplate({ "file-name": "t:" }));
            expect(resultT.valid).toBe(false);
            expect(resultT.errors).toEqual(expect.arrayContaining([
                "/file-name: must be a template string starting with 't:' followed by at least one character",
                "/file-name: must match exactly one schema in oneOf",
            ]));
            const resultV = validateTemplate(validTemplate({ "file-name": "v:" }));
            expect(resultV.valid).toBe(false);
            expect(resultV.errors).toEqual(expect.arrayContaining([
                "/file-name: must be a value string starting with 'v:' followed by at least one character",
                "/file-name: must match exactly one schema in oneOf",
            ]));
        });
    });

    // ─── file-location ───

    describe("file-location", () => {
        test("accepts template type", () => {
            const result = validateTemplate(validTemplate({ "file-location": "t:{{folder}}" }));
            expect(result.valid).toBe(true);
        });

        test("accepts path type (v:/path)", () => {
            const result = validateTemplate(validTemplate({ "file-location": "v:/folder/subfolder" }));
            expect(result.valid).toBe(true);
        });

        test("accepts get-function type", () => {
            const result = validateTemplate(validTemplate({ "file-location": "f:async (view, api) => '/notes'" }));
            expect(result.valid).toBe(true);
        });

        test("accepts get-function type (f:async function(view, api) { ... })", () => {
            const result = validateTemplate(validTemplate({ "file-location": 'f:async function(view, api) { return "some text"; }' }));
            expect(result.valid).toBe(true);
        });

        test("accepts ref to function name", () => {
            const result = validateTemplate(validTemplate({ "file-location": "ref:getLocation" }));
            expect(result.valid).toBe(true);
        });

        test("accepts ref to file path and function name", () => {
            const result = validateTemplate(validTemplate({ "file-location": "ref:/utils/helpers.md:getLocation" }));
            expect(result.valid).toBe(true);
        });

        test("rejects ref with invalid function name", () => {
            const result = validateTemplate(validTemplate({ "file-location": "ref:1bad" }));
            expect(result.valid).toBe(false);
        });

        test("rejects ref with empty name", () => {
            const result = validateTemplate(validTemplate({ "file-location": "ref:" }));
            expect(result.valid).toBe(false);
        });

        test("rejects plain string", () => {
            const result = validateTemplate(validTemplate({ "file-location": "some/path" }));
            expect(result.valid).toBe(false);
            expect(result.errors).toEqual(expect.arrayContaining([
                "/file-location: must be a template string starting with 't:' followed by at least one character",
                "/file-location: must be a path string starting with 'v:' followed by a valid Unix path (e.g. v:/folder/subfolder)",
                "/file-location: must match exactly one schema in oneOf",
            ]));
        });

        test("rejects value without leading slash", () => {
            const result = validateTemplate(validTemplate({ "file-location": "v:noSlash" }));
            expect(result.valid).toBe(false);
            expect(result.errors).toEqual(expect.arrayContaining([
                "/file-location: must be a path string starting with 'v:' followed by a valid Unix path (e.g. v:/folder/subfolder)",
                "/file-location: must match exactly one schema in oneOf",
            ]));
        });
    });

    // ─── form-items ───

    describe("form-items", () => {
        test("rejects item missing required 'id'", () => {
            const item = { type: "text", form: { title: "T" } };
            const result = validateTemplate(validTemplate({ "form-items": [item] }));
            expect(result.valid).toBe(false);
            expect(result.errors).toEqual(expect.arrayContaining([
                "/form-items/0: must have required property 'id'",
            ]));
        });

        test("rejects item missing required 'type'", () => {
            const item = { id: "x", form: { title: "T" } };
            const result = validateTemplate(validTemplate({ "form-items": [item] }));
            expect(result.valid).toBe(false);
            expect(result.errors).toEqual(expect.arrayContaining([
                "/form-items/0: must have required property 'type'",
            ]));
        });

        test("accepts item without optional 'form'", () => {
            const item = { id: "x", type: "text" };
            const result = validateTemplate(validTemplate({ "form-items": [item] }));
            expect(result.valid).toBe(true);
        });

        test("rejects invalid id (starts with number)", () => {
            const result = validateTemplate(validTemplate({
                "form-items": [validTextItem({ id: "1abc" })],
            }));
            expect(result.valid).toBe(false);
            expect(result.errors).toEqual(expect.arrayContaining([
                "/form-items/0/id: id must be a valid JavaScript variable name",
            ]));
        });

        test("rejects unknown type", () => {
            const result = validateTemplate(validTemplate({
                "form-items": [validTextItem({ type: "slider" })],
            }));
            expect(result.valid).toBe(false);
            expect(result.errors).toEqual(expect.arrayContaining([
                "/form-items/0/type: type must be one of: text, textArea, number, date, time, dateTime, checkbox, dropdown",
            ]));
        });

        test("rejects form.title that starts with space", () => {
            const result = validateTemplate(validTemplate({
                "form-items": [validTextItem({ form: { title: " bad" } })],
            }));
            expect(result.valid).toBe(false);
            expect(result.errors).toEqual(expect.arrayContaining([
                "/form-items/0/form/title: must not be empty or start with a space",
            ]));
        });

        test("rejects duplicate item ids (uniqueItemProperties)", () => {
            const result = validateTemplate(validTemplate({
                "form-items": [
                    validTextItem({ id: "name" }),
                    validTextItem({ id: "name" }),
                ],
            }));
            expect(result.valid).toBe(false);
            expect(result.errors).toEqual(expect.arrayContaining([
                '/form-items: must pass "uniqueItemProperties" keyword validation',
            ]));
        });

        test("accepts items with distinct ids", () => {
            const result = validateTemplate(validTemplate({
                "form-items": [
                    validTextItem({ id: "first" }),
                    validTextItem({ id: "second" }),
                ],
            }));
            expect(result.valid).toBe(true);
        });
    });

    // ─── form item types ───

    describe("form item types", () => {
        test.each(["text", "textArea"])("accepts %s type with placeholder", (type) => {
            const result = validateTemplate(validTemplate({
                "form-items": [{
                    id: "field",
                    type,
                    form: { title: "Field", placeholder: "Enter..." },
                }],
            }));
            expect(result.valid).toBe(true);
        });

        test("accepts number type", () => {
            const result = validateTemplate(validTemplate({
                "form-items": [validTextItem({ id: "age", type: "number" })],
            }));
            expect(result.valid).toBe(true);
        });

        test.each(["date", "time", "dateTime"])("accepts %s type", (type) => {
            const result = validateTemplate(validTemplate({
                "form-items": [validTextItem({ id: "d", type })],
            }));
            expect(result.valid).toBe(true);
        });

        test("accepts checkbox type", () => {
            const result = validateTemplate(validTemplate({
                "form-items": [validTextItem({ id: "done", type: "checkbox" })],
            }));
            expect(result.valid).toBe(true);
        });

        test("accepts dropdown type", () => {
            const result = validateTemplate(validTemplate({
                "form-items": [validTextItem({ id: "category", type: "dropdown", init: 'v:[{"k":"a","v":"Alpha"}]' })],
            }));
            expect(result.valid).toBe(true);
        });
    });

    // ─── init / get functions ───

    describe("init and get functions", () => {
        test("accepts valid init function (arrow)", () => {
            const result = validateTemplate(validTemplate({
                "form-items": [validTextItem({ init: "f:async (view, api) => 'default'" })],
            }));
            expect(result.valid).toBe(true);
        });

        test("accepts valid init function (classic)", () => {
            const result = validateTemplate(validTemplate({
                "form-items": [validTextItem({ init: "f:async function(view, api) { return 'x'; }" })],
            }));
            expect(result.valid).toBe(true);
        });

        test("accepts valid get function (arrow)", () => {
            const result = validateTemplate(validTemplate({
                "form-items": [validTextItem({ get: "f:async (view, api) => view.title" })],
            }));
            expect(result.valid).toBe(true);
        });

        test("accepts valid get function (classic)", () => {
            const result = validateTemplate(validTemplate({
                "form-items": [validTextItem({ get: "f:async function(view, api) { return view.title; }" })],
            }));
            expect(result.valid).toBe(true);
        });

        test("rejects get function without view parameter", () => {
            const result = validateTemplate(validTemplate({
                "form-items": [validTextItem({ get: "f:async (view) => 'oops'" })],
            }));
            expect(result.valid).toBe(false);
            expect(result.errors).toEqual(expect.arrayContaining([
                "/form-items/0/get: must be a function string starting with 'f:' followed by an async arrow function receiving 'view' and 'api' parameters (e.g. f:async (view, api) => value)",
            ]));
        });

        test("accepts get with ref to function name", () => {
            const result = validateTemplate(validTemplate({
                "form-items": [validTextItem({ get: "ref:myGetter" })],
            }));
            expect(result.valid).toBe(true);
        });

        test("accepts get with ref to file path and function name", () => {
            const result = validateTemplate(validTemplate({
                "form-items": [validTextItem({ get: "ref:/my/dir/functions.md:myGetter" })],
            }));
            expect(result.valid).toBe(true);
        });

        test("rejects get ref with invalid function name", () => {
            const result = validateTemplate(validTemplate({
                "form-items": [validTextItem({ get: "ref:1bad" })],
            }));
            expect(result.valid).toBe(false);
        });

        test("rejects get ref with empty function name", () => {
            const result = validateTemplate(validTemplate({
                "form-items": [validTextItem({ get: "ref:" })],
            }));
            expect(result.valid).toBe(false);
        });

        test("rejects get ref:path with invalid function name", () => {
            const result = validateTemplate(validTemplate({
                "form-items": [validTextItem({ get: "ref:/path/to/file.md:123bad" })],
            }));
            expect(result.valid).toBe(false);
        });

        test("accepts init with ref to function name", () => {
            const result = validateTemplate(validTemplate({
                "form-items": [validTextItem({ init: "ref:myFunction" })],
            }));
            expect(result.valid).toBe(true);
        });

        test("accepts init with ref to function name starting with $ or _", () => {
            const result1 = validateTemplate(validTemplate({
                "form-items": [validTextItem({ init: "ref:$helper" })],
            }));
            expect(result1.valid).toBe(true);

            const result2 = validateTemplate(validTemplate({
                "form-items": [validTextItem({ init: "ref:_private" })],
            }));
            expect(result2.valid).toBe(true);
        });

        test("accepts init with ref to file path and function name", () => {
            const result = validateTemplate(validTemplate({
                "form-items": [validTextItem({ init: "ref:/my/dir/functions.md:myFunc" })],
            }));
            expect(result.valid).toBe(true);
        });

        test("accepts init with ref to single-segment file path", () => {
            const result = validateTemplate(validTemplate({
                "form-items": [validTextItem({ init: "ref:/functions.md:init" })],
            }));
            expect(result.valid).toBe(true);
        });

        test("rejects init ref with invalid function name (starts with number)", () => {
            const result = validateTemplate(validTemplate({
                "form-items": [validTextItem({ init: "ref:1bad" })],
            }));
            expect(result.valid).toBe(false);
        });

        test("rejects init ref with empty function name", () => {
            const result = validateTemplate(validTemplate({
                "form-items": [validTextItem({ init: "ref:" })],
            }));
            expect(result.valid).toBe(false);
        });

        test("rejects init ref:path with invalid function name", () => {
            const result = validateTemplate(validTemplate({
                "form-items": [validTextItem({ init: "ref:/path/to/file.md:123bad" })],
            }));
            expect(result.valid).toBe(false);
        });

        test("rejects init ref:path without function name", () => {
            const result = validateTemplate(validTemplate({
                "form-items": [validTextItem({ init: "ref:/path/to/file.md:" })],
            }));
            expect(result.valid).toBe(false);
        });

        test("rejects init with plain ref (no prefix)", () => {
            const result = validateTemplate(validTemplate({
                "form-items": [validTextItem({ init: "myFunction" })],
            }));
            expect(result.valid).toBe(false);
        });
    });

    // ─── validate function ───

    describe("validate function", () => {
        test("accepts valid validate function (arrow)", () => {
            const result = validateTemplate(validTemplate({
                "form-items": [validTextItem({ validate: "f:async (view, api) => view.title !== ''" })],
            }));
            expect(result.valid).toBe(true);
        });

        test("accepts valid validate function (classic)", () => {
            const result = validateTemplate(validTemplate({
                "form-items": [validTextItem({ validate: "f:async function(view, api) { return view.title !== ''; }" })],
            }));
            expect(result.valid).toBe(true);
        });

        test("rejects validate function without view parameter", () => {
            const result = validateTemplate(validTemplate({
                "form-items": [validTextItem({ validate: "f:async (view) => true" })],
            }));
            expect(result.valid).toBe(false);
            expect(result.errors).toEqual(expect.arrayContaining([
                "/form-items/0/validate: must be a function string starting with 'f:' followed by an async arrow function receiving 'view' and 'api' parameters (e.g. f:async (view, api) => value)",
            ]));
        });

        test("accepts validate with ref to function name", () => {
            const result = validateTemplate(validTemplate({
                "form-items": [validTextItem({ validate: "ref:myValidator" })],
            }));
            expect(result.valid).toBe(true);
        });

        test("accepts validate with ref to file path and function name", () => {
            const result = validateTemplate(validTemplate({
                "form-items": [validTextItem({ validate: "ref:/my/dir/functions.md:myValidator" })],
            }));
            expect(result.valid).toBe(true);
        });

        test("rejects validate ref with invalid function name", () => {
            const result = validateTemplate(validTemplate({
                "form-items": [validTextItem({ validate: "ref:1bad" })],
            }));
            expect(result.valid).toBe(false);
        });

        test("rejects validate ref with empty function name", () => {
            const result = validateTemplate(validTemplate({
                "form-items": [validTextItem({ validate: "ref:" })],
            }));
            expect(result.valid).toBe(false);
        });

        test("rejects validate ref:path with invalid function name", () => {
            const result = validateTemplate(validTemplate({
                "form-items": [validTextItem({ validate: "ref:/path/to/file.md:123bad" })],
            }));
            expect(result.valid).toBe(false);
        });

        test("rejects validate with plain string (no prefix)", () => {
            const result = validateTemplate(validTemplate({
                "form-items": [validTextItem({ validate: "myValidator" })],
            }));
            expect(result.valid).toBe(false);
        });

        test("accepts item without validate (optional)", () => {
            const result = validateTemplate(validTemplate({
                "form-items": [validTextItem()],
            }));
            expect(result.valid).toBe(true);
        });
    });

    // ─── beforeCreate function (top-level) ───

    describe("beforeCreate function (top-level)", () => {
        test("accepts valid beforeCreate function (arrow)", () => {
            const result = validateTemplate(validTemplate({ beforeCreate: "f:async (view, api) => view.title !== ''" }));
            expect(result.valid).toBe(true);
        });

        test("accepts valid beforeCreate function (classic)", () => {
            const result = validateTemplate(validTemplate({ beforeCreate: "f:async function(view, api) { return view.title !== ''; }" }));
            expect(result.valid).toBe(true);
        });

        test("rejects beforeCreate function without view parameter", () => {
            const result = validateTemplate(validTemplate({ beforeCreate: "f:async (view) => true" }));
            expect(result.valid).toBe(false);
            expect(result.errors).toEqual(expect.arrayContaining([
                "/beforeCreate: must be a function string starting with 'f:' followed by an async arrow function receiving 'view' and 'api' parameters (e.g. f:async (view, api) => value)",
            ]));
        });

        test("accepts beforeCreate with ref to function name", () => {
            const result = validateTemplate(validTemplate({ beforeCreate: "ref:myBeforeCreate" }));
            expect(result.valid).toBe(true);
        });

        test("accepts beforeCreate with ref to file path and function name", () => {
            const result = validateTemplate(validTemplate({ beforeCreate: "ref:/my/dir/functions.md:myBeforeCreate" }));
            expect(result.valid).toBe(true);
        });

        test("rejects beforeCreate ref with invalid function name", () => {
            const result = validateTemplate(validTemplate({ beforeCreate: "ref:1bad" }));
            expect(result.valid).toBe(false);
        });

        test("rejects beforeCreate ref with empty function name", () => {
            const result = validateTemplate(validTemplate({ beforeCreate: "ref:" }));
            expect(result.valid).toBe(false);
        });

        test("rejects beforeCreate ref:path with invalid function name", () => {
            const result = validateTemplate(validTemplate({ beforeCreate: "ref:/path/to/file.md:123bad" }));
            expect(result.valid).toBe(false);
        });

        test("rejects beforeCreate with plain string (no prefix)", () => {
            const result = validateTemplate(validTemplate({ beforeCreate: "myBeforeCreate" }));
            expect(result.valid).toBe(false);
        });

        test("accepts template without beforeCreate (optional)", () => {
            const result = validateTemplate(validTemplate());
            expect(result.valid).toBe(true);
        });
    });

    // ─── additional properties ───

    test("rejects unknown top-level property", () => {
        const result = validateTemplate({ ...validTemplate(), extra: true });
        expect(result.valid).toBe(false);
        expect(result.errors).toEqual(expect.arrayContaining([
            "/: must NOT have additional properties",
        ]));
    });

    test("rejects unevaluated properties on form-items", () => {
        const result = validateTemplate(validTemplate({
            "form-items": [{ ...validTextItem(), unknown: "prop" }],
        }));
        expect(result.valid).toBe(false);
        expect(result.errors).toEqual(expect.arrayContaining([
            "/form-items/0: must NOT have unevaluated properties",
        ]));
    });
});
