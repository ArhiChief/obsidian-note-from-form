import { DropdownFormItem } from "../form/dropdownFormItem";

jest.mock("src/ui/settingsExtension", () => {
    const methods = ['setName', 'setDesc', 'addToggle', 'addText', 'addTextArea',
        'addDropdown', 'addDate', 'addTime', 'addDateTime', 'addNumber',
        'setValue', 'onChange', 'setPlaceholder', 'addOptions',
        'setError', 'clearError'];
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
    executeFunction: jest.fn().mockImplementation((funcText: string, ...args: any[]) => {
        const func = eval(`(${funcText})`);
        return func(...args);
    }),
    executeRefFunction: jest.fn(),
} as any;
const mockUserApi = {} as any;

describe("DropdownFormItem", () => {

    const twoOptions = 'v:[{"k":"a","v":"Alpha"},{"k":"b","v":"Beta"}]' as const;
    const withSelected = 'v:[{"k":"a","v":"Alpha"},{"k":"b","v":"Beta","s":true}]' as const;

    // ─── constructor ───

    describe("constructor", () => {
        test("parses v: JSON init and selects first option by default", async () => {
            const item = new DropdownFormItem({ id: "dd1", type: "dropdown", init: twoOptions }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(item.value).toEqual([{ k: "a", v: "Alpha" }, { k: "b", v: "Beta" }]);
        });

        test("selects option marked with s:true", async () => {
            const item = new DropdownFormItem({ id: "dd1", type: "dropdown", init: withSelected }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(item.value).toEqual([{ k: "a", v: "Alpha" }, { k: "b", v: "Beta", s: true }]);
        });

        test("evaluates f: init function", async () => {
            const item = new DropdownFormItem({
                id: "dd1", type: "dropdown",
                init: 'f:async () => [{"k":"x","v":"X-ray"}]',
            }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(item.value).toEqual([{ k: "x", v: "X-ray" }]);
        });

        test("throws when no init is provided", async () => {
            const item = new DropdownFormItem({ id: "dd1", type: "dropdown" }, mockFunctionProcessor, mockUserApi);
            await expect(item.initialize()).rejects.toThrow("Default value is not supported");
        });

        test("throws for empty array init", async () => {
            const item = new DropdownFormItem({ id: "dd1", type: "dropdown", init: "v:[]" }, mockFunctionProcessor, mockUserApi);
            await expect(item.initialize()).rejects.toThrow("Init value can't be empty");
        });

        test("throws for unsupported type", () => {
            expect(() => new DropdownFormItem({ id: "dd1", type: "text" as any, init: twoOptions }, mockFunctionProcessor, mockUserApi))
                .toThrow("Unsupported type");
        });

        test("sets id and type correctly", () => {
            const item = new DropdownFormItem({ id: "myDd", type: "dropdown", init: twoOptions }, mockFunctionProcessor, mockUserApi);
            expect(item.id).toBe("myDd");
            expect(item.type).toBe("dropdown");
        });
    });

    // ─── get ───

    describe("get", () => {
        test("returns selected option value when no getFunc", async () => {
            const item = new DropdownFormItem({ id: "dd1", type: "dropdown", init: twoOptions }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(await item.get({})).toBe("Alpha");
        });

        test("returns selected value when s:true option", async () => {
            const item = new DropdownFormItem({ id: "dd1", type: "dropdown", init: withSelected }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(await item.get({})).toBe("Alpha");
        });

        test("returns literal for v: getFunc", async () => {
            const item = new DropdownFormItem({
                id: "dd1", type: "dropdown", init: twoOptions, get: "v:override",
            }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(await item.get({})).toBe("override");
        });

        test("invokes arrow function for f: getFunc", async () => {
            const item = new DropdownFormItem({
                id: "dd1", type: "dropdown", init: twoOptions, get: "f:async (view) => view.label",
            }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(await item.get({ label: "from-view" })).toBe("from-view");
        });

        test("invokes regular function for f: getFunc", async () => {
            const item = new DropdownFormItem({
                id: "dd1", type: "dropdown", init: twoOptions, get: "f:async function(view) { return view.label; }",
            }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(await item.get({ label: "func-result" })).toBe("func-result");
        });
    });

    // ─── assignToForm ───

    describe("assignToForm", () => {
        test("does nothing when no form display is configured", async () => {
            const item = new DropdownFormItem({ id: "dd1", type: "dropdown", init: twoOptions }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(() => item.assignToForm({} as HTMLElement)).not.toThrow();
        });

        test("does not throw when form display is configured", async () => {
            const item = new DropdownFormItem({
                id: "dd1", type: "dropdown", init: twoOptions,
                form: { title: "Pick one" },
            }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(() => item.assignToForm({} as HTMLElement)).not.toThrow();
        });
    });

    // ─── initialize ───

    describe("initialize", () => {
        test("value is undefined before initialize", () => {
            const item = new DropdownFormItem({ id: "dd1", type: "dropdown", init: twoOptions }, mockFunctionProcessor, mockUserApi);
            expect(item.value).toBeUndefined();
        });

        test("resolves ref: init via executeRefFunction", async () => {
            const refOptions = [{k: "r", v: "Ref"}];
            mockFunctionProcessor.executeRefFunction.mockResolvedValueOnce(refOptions);
            const item = new DropdownFormItem({ id: "dd1", type: "dropdown", init: "ref:getOptions" }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(mockFunctionProcessor.executeRefFunction).toHaveBeenCalledWith("getOptions", {}, mockUserApi);
            expect(item.value).toEqual(refOptions);
        });

        test("resolves ref: with path via executeRefFunction", async () => {
            const refOptions = [{k: "a", v: "Alpha"}, {k: "b", v: "Beta"}];
            mockFunctionProcessor.executeRefFunction.mockResolvedValueOnce(refOptions);
            const item = new DropdownFormItem({ id: "dd1", type: "dropdown", init: "ref:/data.md:getOptions" }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(mockFunctionProcessor.executeRefFunction).toHaveBeenCalledWith("/data.md:getOptions", {}, mockUserApi);
            expect(item.value).toEqual(refOptions);
        });

        test("throws for unsupported init prefix", async () => {
            const item = new DropdownFormItem({ id: "dd1", type: "dropdown", init: "x:bad" as any }, mockFunctionProcessor, mockUserApi);
            await expect(item.initialize()).rejects.toThrow("Unsupported init function");
        });
    });

    // ─── validate ───

    describe("validate", () => {
        test("returns true when no validateFunc is provided", async () => {
            const item = new DropdownFormItem({ id: "dd1", type: "dropdown", init: twoOptions }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            const result = await item.validate({ dd1: "Alpha" });
            expect(result).toBe(true);
        });

        test("returns true when no element is assigned (no form)", async () => {
            const item = new DropdownFormItem({
                id: "dd1", type: "dropdown", init: twoOptions,
                validate: "f:async (view) => ({ isValid: true })" as any,
            }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            const result = await item.validate({ dd1: "Alpha" });
            expect(result).toBe(true);
        });

        test("returns true for valid inline function", async () => {
            mockFunctionProcessor.executeFunction.mockReturnValueOnce({ isValid: true });
            const item = new DropdownFormItem({
                id: "dd1", type: "dropdown", init: twoOptions,
                form: { title: "Pick" },
                validate: "f:async (view) => ({ isValid: true })" as any,
            }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            item.assignToForm({} as HTMLElement);
            const result = await item.validate({ dd1: "Alpha" });
            expect(result).toBe(true);
        });

        test("returns false and calls setError for invalid result", async () => {
            mockFunctionProcessor.executeFunction.mockReturnValueOnce({ isValid: false, errMsg: "Invalid selection" });
            const item = new DropdownFormItem({
                id: "dd1", type: "dropdown", init: twoOptions,
                form: { title: "Pick" },
                validate: "f:async (view) => ({ isValid: false, errMsg: 'Invalid selection' })" as any,
            }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            item.assignToForm({} as HTMLElement);

            const element = (item as any)._element;
            const setError = jest.fn().mockReturnThis();
            element.setError = setError;
            element.clearError = jest.fn().mockReturnThis();

            const result = await item.validate({ dd1: "Alpha" });
            expect(result).toBe(false);
            expect(setError).toHaveBeenCalledWith("Invalid selection");
        });

        test("resolves ref: validate via executeRefFunction", async () => {
            mockFunctionProcessor.executeRefFunction.mockResolvedValueOnce({ isValid: true });
            const item = new DropdownFormItem({
                id: "dd1", type: "dropdown", init: twoOptions,
                form: { title: "Pick" },
                validate: "ref:ddValidator" as any,
            }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            item.assignToForm({} as HTMLElement);
            const result = await item.validate({ dd1: "Alpha" });
            expect(result).toBe(true);
            expect(mockFunctionProcessor.executeRefFunction).toHaveBeenCalledWith("ddValidator", { dd1: "Alpha" }, mockUserApi);
        });

        test("throws for unsupported validate prefix", async () => {
            const item = new DropdownFormItem({
                id: "dd1", type: "dropdown", init: twoOptions,
                form: { title: "Pick" },
                validate: "x:bad" as any,
            }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            item.assignToForm({} as HTMLElement);
            await expect(item.validate({ dd1: "Alpha" })).rejects.toThrow("Unsupported validate function");
        });
    });
});
