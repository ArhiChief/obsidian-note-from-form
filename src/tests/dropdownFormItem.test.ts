import { DropdownFormItem } from "../form/dropdownFormItem";

jest.mock("src/ui/settingsExtension", () => {
    const methods = ['setName', 'setDesc', 'addToggle', 'addText', 'addTextArea',
        'addDropdown', 'addDate', 'addTime', 'addDateTime', 'addNumber',
        'setValue', 'onChange', 'setPlaceholder', 'addOptions'];
    const mock: Record<string, any> = {};
    const chain = (...args: any[]) => {
        if (typeof args[0] === 'function') args[0](mock);
        return mock;
    };
    for (const m of methods) mock[m] = jest.fn().mockImplementation(chain);
    return { ExtendedSetting: jest.fn().mockImplementation(() => ({ ...mock })) };
});

const mockFunctionProcessor = {
    renderMustacheTemplate: jest.fn(),
    executeFunction: jest.fn().mockImplementation((funcText: string) => {
        const func = eval(`(${funcText})`);
        return func();
    }),
    executeFunctionWithParam: jest.fn(),
    executeRefFunction: jest.fn(),
    executeRefFunctionWithParam: jest.fn(),
} as any;

describe("DropdownFormItem", () => {

    const twoOptions = 'v:[{"k":"a","v":"Alpha"},{"k":"b","v":"Beta"}]' as const;
    const withSelected = 'v:[{"k":"a","v":"Alpha"},{"k":"b","v":"Beta","s":true}]' as const;

    // ─── constructor ───

    describe("constructor", () => {
        test("parses v: JSON init and selects first option by default", async () => {
            const item = new DropdownFormItem({ id: "dd1", type: "dropdown", init: twoOptions }, mockFunctionProcessor);
            await item.initialize();
            expect(item.value).toEqual([{ k: "a", v: "Alpha" }, { k: "b", v: "Beta" }]);
        });

        test("selects option marked with s:true", async () => {
            const item = new DropdownFormItem({ id: "dd1", type: "dropdown", init: withSelected }, mockFunctionProcessor);
            await item.initialize();
            expect(item.value).toEqual([{ k: "a", v: "Alpha" }, { k: "b", v: "Beta", s: true }]);
        });

        test("evaluates f: init function", async () => {
            const item = new DropdownFormItem({
                id: "dd1", type: "dropdown",
                init: 'f:() => [{"k":"x","v":"X-ray"}]',
            }, mockFunctionProcessor);
            await item.initialize();
            expect(item.value).toEqual([{ k: "x", v: "X-ray" }]);
        });

        test("throws when no init is provided", async () => {
            const item = new DropdownFormItem({ id: "dd1", type: "dropdown" }, mockFunctionProcessor);
            await expect(item.initialize()).rejects.toThrow("Default value is not supported");
        });

        test("throws for empty array init", async () => {
            const item = new DropdownFormItem({ id: "dd1", type: "dropdown", init: "v:[]" }, mockFunctionProcessor);
            await expect(item.initialize()).rejects.toThrow("Init value can't be empty");
        });

        test("throws for unsupported type", () => {
            expect(() => new DropdownFormItem({ id: "dd1", type: "text" as any, init: twoOptions }, mockFunctionProcessor))
                .toThrow("Unsupported type");
        });

        test("sets id and type correctly", () => {
            const item = new DropdownFormItem({ id: "myDd", type: "dropdown", init: twoOptions }, mockFunctionProcessor);
            expect(item.id).toBe("myDd");
            expect(item.type).toBe("dropdown");
        });
    });

    // ─── get ───

    describe("get", () => {
        test("returns selected option value when no getFunc", async () => {
            const item = new DropdownFormItem({ id: "dd1", type: "dropdown", init: twoOptions }, mockFunctionProcessor);
            await item.initialize();
            expect(item.get({})).toBe("Alpha");
        });

        test("returns selected value when s:true option", async () => {
            const item = new DropdownFormItem({ id: "dd1", type: "dropdown", init: withSelected }, mockFunctionProcessor);
            await item.initialize();
            expect(item.get({})).toBe("Alpha");
        });

        test("returns literal for v: getFunc", async () => {
            const item = new DropdownFormItem({
                id: "dd1", type: "dropdown", init: twoOptions, get: "v:override",
            }, mockFunctionProcessor);
            await item.initialize();
            expect(item.get({})).toBe("override");
        });

        test("invokes arrow function for f: getFunc", async () => {
            const item = new DropdownFormItem({
                id: "dd1", type: "dropdown", init: twoOptions, get: "f:(view) => view.label",
            }, mockFunctionProcessor);
            await item.initialize();
            expect(item.get({ label: "from-view" })).toBe("from-view");
        });

        test("invokes regular function for f: getFunc", async () => {
            const item = new DropdownFormItem({
                id: "dd1", type: "dropdown", init: twoOptions, get: "f:function(view) { return view.label; }",
            }, mockFunctionProcessor);
            await item.initialize();
            expect(item.get({ label: "func-result" })).toBe("func-result");
        });
    });

    // ─── assignToForm ───

    describe("assignToForm", () => {
        test("does nothing when no form display is configured", async () => {
            const item = new DropdownFormItem({ id: "dd1", type: "dropdown", init: twoOptions }, mockFunctionProcessor);
            await item.initialize();
            expect(() => item.assignToForm({} as HTMLElement)).not.toThrow();
        });

        test("does not throw when form display is configured", async () => {
            const item = new DropdownFormItem({
                id: "dd1", type: "dropdown", init: twoOptions,
                form: { title: "Pick one" },
            }, mockFunctionProcessor);
            await item.initialize();
            expect(() => item.assignToForm({} as HTMLElement)).not.toThrow();
        });
    });

    // ─── initialize ───

    describe("initialize", () => {
        test("value is undefined before initialize", () => {
            const item = new DropdownFormItem({ id: "dd1", type: "dropdown", init: twoOptions }, mockFunctionProcessor);
            expect(item.value).toBeUndefined();
        });

        test("resolves ref: init via executeRefFunction", async () => {
            const refOptions = [{k: "r", v: "Ref"}];
            mockFunctionProcessor.executeRefFunction.mockResolvedValueOnce(refOptions);
            const item = new DropdownFormItem({ id: "dd1", type: "dropdown", init: "ref:getOptions" }, mockFunctionProcessor);
            await item.initialize();
            expect(mockFunctionProcessor.executeRefFunction).toHaveBeenCalledWith("getOptions");
            expect(item.value).toEqual(refOptions);
        });

        test("resolves ref: with path via executeRefFunction", async () => {
            const refOptions = [{k: "a", v: "Alpha"}, {k: "b", v: "Beta"}];
            mockFunctionProcessor.executeRefFunction.mockResolvedValueOnce(refOptions);
            const item = new DropdownFormItem({ id: "dd1", type: "dropdown", init: "ref:/data.md:getOptions" }, mockFunctionProcessor);
            await item.initialize();
            expect(mockFunctionProcessor.executeRefFunction).toHaveBeenCalledWith("/data.md:getOptions");
            expect(item.value).toEqual(refOptions);
        });

        test("throws for unsupported init prefix", async () => {
            const item = new DropdownFormItem({ id: "dd1", type: "dropdown", init: "x:bad" as any }, mockFunctionProcessor);
            await expect(item.initialize()).rejects.toThrow("Unsupported init function");
        });
    });
});
