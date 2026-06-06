import { CheckboxFormItem } from "../form/checkboxFormItem";

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

describe("CheckboxFormItem", () => {

    // ─── constructor ───

    describe("constructor", () => {
        test("defaults to false when no init provided", async () => {
            const item = new CheckboxFormItem({ id: "cb1", type: "checkbox" }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(item.value).toBe(false);
        });

        test("parses v:true init value", async () => {
            const item = new CheckboxFormItem({ id: "cb1", type: "checkbox", init: "v:true" }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(item.value).toBe(true);
        });

        test("parses v:false init value", async () => {
            const item = new CheckboxFormItem({ id: "cb1", type: "checkbox", init: "v:false" }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(item.value).toBe(false);
        });

        test("parses v:TRUE case-insensitively", async () => {
            const item = new CheckboxFormItem({ id: "cb1", type: "checkbox", init: "v:TRUE" }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(item.value).toBe(true);
        });

        test("evaluates f: init function", async () => {
            const item = new CheckboxFormItem({ id: "cb1", type: "checkbox", init: "f:async () => true" }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(item.value).toBe(true);
        });

        test("throws for unsupported type", () => {
            expect(() => new CheckboxFormItem({ id: "cb1", type: "text" as any }, mockFunctionProcessor, mockUserApi)).toThrow("Unsupported type");
        });

        test("sets id and type correctly", () => {
            const item = new CheckboxFormItem({ id: "myCheck", type: "checkbox" }, mockFunctionProcessor, mockUserApi);
            expect(item.id).toBe("myCheck");
            expect(item.type).toBe("checkbox");
        });
    });

    // ─── getFunctionDefault (via get()) ───

    describe("get", () => {
        test("returns 'true' when value is true and no getFunc", async () => {
            const item = new CheckboxFormItem({ id: "cb1", type: "checkbox", init: "v:true" }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(await item.get({})).toBe("true");
        });

        test("returns 'false' when value is false and no getFunc", async () => {
            const item = new CheckboxFormItem({ id: "cb1", type: "checkbox" }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(await item.get({})).toBe("false");
        });

        test("returns literal for v: getFunc", async () => {
            const item = new CheckboxFormItem({ id: "cb1", type: "checkbox", get: "v:yes" }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(await item.get({})).toBe("yes");
        });

        test("invokes arrow function for f: getFunc", async () => {
            const item = new CheckboxFormItem({ id: "cb1", type: "checkbox", get: "f:async (view)=>true" }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(await item.get({})).toBe(true);
        });

        test("invokes regular function for f: getFunc", async () => {
            const item = new CheckboxFormItem({ id: "cb1", type: "checkbox", get: "f:async function(view) { return true; }" }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(await item.get({})).toBe(true);
        });
    });

    // ─── assignToForm ───

    describe("assignToForm", () => {
        test("does nothing when no form display is configured", async () => {
            const item = new CheckboxFormItem({ id: "cb1", type: "checkbox" }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            // Should not throw
            expect(() => item.assignToForm({} as HTMLElement)).not.toThrow();
        });

        test("does not throw when form display is configured", async () => {
            const item = new CheckboxFormItem({
                id: "cb1", type: "checkbox",
                form: { title: "My Checkbox", description: "desc" },
            }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(() => item.assignToForm({} as HTMLElement)).not.toThrow();
        });
    });

    // ─── initialize ───

    describe("initialize", () => {
        test("value is undefined before initialize", () => {
            const item = new CheckboxFormItem({ id: "cb1", type: "checkbox", init: "v:true" }, mockFunctionProcessor, mockUserApi);
            expect(item.value).toBeUndefined();
        });

        test("resolves ref: init via executeRefFunction", async () => {
            mockFunctionProcessor.executeRefFunction.mockResolvedValueOnce(true);
            const item = new CheckboxFormItem({ id: "cb1", type: "checkbox", init: "ref:isChecked" }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(mockFunctionProcessor.executeRefFunction).toHaveBeenCalledWith("isChecked");
            expect(item.value).toBe(true);
        });

        test("resolves ref: with path via executeRefFunction", async () => {
            mockFunctionProcessor.executeRefFunction.mockResolvedValueOnce(false);
            const item = new CheckboxFormItem({ id: "cb1", type: "checkbox", init: "ref:/funcs.md:isChecked" }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(mockFunctionProcessor.executeRefFunction).toHaveBeenCalledWith("/funcs.md:isChecked");
            expect(item.value).toBe(false);
        });

        test("throws for unsupported init prefix", async () => {
            const item = new CheckboxFormItem({ id: "cb1", type: "checkbox", init: "x:bad" as any }, mockFunctionProcessor, mockUserApi);
            await expect(item.initialize()).rejects.toThrow("Unsupported init function");
        });
    });

    // ─── validate ───

    describe("validate", () => {
        test("returns true when no validateFunc is provided", async () => {
            const item = new CheckboxFormItem({ id: "cb1", type: "checkbox" }, mockFunctionProcessor, mockUserApi);
            const result = await item.validate({ cb1: true });
            expect(result).toBe(true);
        });

        test("returns true when no element is assigned (no form)", async () => {
            const item = new CheckboxFormItem({
                id: "cb1", type: "checkbox",
                validate: "f:async (view) => ({ isValid: true })" as any,
            }, mockFunctionProcessor, mockUserApi);
            const result = await item.validate({ cb1: true });
            expect(result).toBe(true);
        });

        test("returns true for valid inline function", async () => {
            mockFunctionProcessor.executeFunction.mockReturnValueOnce({ isValid: true });
            const item = new CheckboxFormItem({
                id: "cb1", type: "checkbox",
                form: { title: "Check" },
                validate: "f:async (view) => ({ isValid: true })" as any,
            }, mockFunctionProcessor, mockUserApi);
            item.assignToForm({} as HTMLElement);
            const result = await item.validate({ cb1: true });
            expect(result).toBe(true);
        });

        test("returns false and calls setError for invalid result", async () => {
            mockFunctionProcessor.executeFunction.mockReturnValueOnce({ isValid: false, errMsg: "Must be checked" });
            const item = new CheckboxFormItem({
                id: "cb1", type: "checkbox",
                form: { title: "Check" },
                validate: "f:async (view) => ({ isValid: false, errMsg: 'Must be checked' })" as any,
            }, mockFunctionProcessor, mockUserApi);
            item.assignToForm({} as HTMLElement);

            const element = (item as any)._element;
            const setError = jest.fn().mockReturnThis();
            element.setError = setError;
            element.clearError = jest.fn().mockReturnThis();

            const result = await item.validate({ cb1: false });
            expect(result).toBe(false);
            expect(setError).toHaveBeenCalledWith("Must be checked");
        });

        test("resolves ref: validate via executeRefFunction", async () => {
            mockFunctionProcessor.executeRefFunction.mockResolvedValueOnce({ isValid: true });
            const item = new CheckboxFormItem({
                id: "cb1", type: "checkbox",
                form: { title: "Check" },
                validate: "ref:myValidator" as any,
            }, mockFunctionProcessor, mockUserApi);
            item.assignToForm({} as HTMLElement);
            const result = await item.validate({ cb1: true });
            expect(result).toBe(true);
            expect(mockFunctionProcessor.executeRefFunction).toHaveBeenCalledWith("myValidator", { cb1: true });
        });

        test("throws for unsupported validate prefix", async () => {
            const item = new CheckboxFormItem({
                id: "cb1", type: "checkbox",
                form: { title: "Check" },
                validate: "x:bad" as any,
            }, mockFunctionProcessor, mockUserApi);
            item.assignToForm({} as HTMLElement);
            await expect(item.validate({ cb1: true })).rejects.toThrow("Unsupported validate function");
        });
    });
});
