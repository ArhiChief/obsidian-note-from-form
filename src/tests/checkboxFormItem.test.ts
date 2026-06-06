import { CheckboxFormItem } from "../form/checkboxFormItem";

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

describe("CheckboxFormItem", () => {

    // ─── constructor ───

    describe("constructor", () => {
        test("defaults to false when no init provided", async () => {
            const item = new CheckboxFormItem({ id: "cb1", type: "checkbox" }, mockFunctionProcessor);
            await item.initialize();
            expect(item.value).toBe(false);
        });

        test("parses v:true init value", async () => {
            const item = new CheckboxFormItem({ id: "cb1", type: "checkbox", init: "v:true" }, mockFunctionProcessor);
            await item.initialize();
            expect(item.value).toBe(true);
        });

        test("parses v:false init value", async () => {
            const item = new CheckboxFormItem({ id: "cb1", type: "checkbox", init: "v:false" }, mockFunctionProcessor);
            await item.initialize();
            expect(item.value).toBe(false);
        });

        test("parses v:TRUE case-insensitively", async () => {
            const item = new CheckboxFormItem({ id: "cb1", type: "checkbox", init: "v:TRUE" }, mockFunctionProcessor);
            await item.initialize();
            expect(item.value).toBe(true);
        });

        test("evaluates f: init function", async () => {
            const item = new CheckboxFormItem({ id: "cb1", type: "checkbox", init: "f:() => true" }, mockFunctionProcessor);
            await item.initialize();
            expect(item.value).toBe(true);
        });

        test("throws for unsupported type", () => {
            expect(() => new CheckboxFormItem({ id: "cb1", type: "text" as any }, mockFunctionProcessor)).toThrow("Unsupported type");
        });

        test("sets id and type correctly", () => {
            const item = new CheckboxFormItem({ id: "myCheck", type: "checkbox" }, mockFunctionProcessor);
            expect(item.id).toBe("myCheck");
            expect(item.type).toBe("checkbox");
        });
    });

    // ─── getFunctionDefault (via get()) ───

    describe("get", () => {
        test("returns 'true' when value is true and no getFunc", async () => {
            const item = new CheckboxFormItem({ id: "cb1", type: "checkbox", init: "v:true" }, mockFunctionProcessor);
            await item.initialize();
            expect(item.get({})).toBe("true");
        });

        test("returns 'false' when value is false and no getFunc", async () => {
            const item = new CheckboxFormItem({ id: "cb1", type: "checkbox" }, mockFunctionProcessor);
            await item.initialize();
            expect(item.get({})).toBe("false");
        });

        test("returns literal for v: getFunc", async () => {
            const item = new CheckboxFormItem({ id: "cb1", type: "checkbox", get: "v:yes" }, mockFunctionProcessor);
            await item.initialize();
            expect(item.get({})).toBe("yes");
        });

        test("invokes arrow function for f: getFunc", async () => {
            const item = new CheckboxFormItem({ id: "cb1", type: "checkbox", get: "f:(view)=>true" }, mockFunctionProcessor);
            await item.initialize();
            expect(item.get({})).toBe(true);
        });

        test("invokes regular function for f: getFunc", async () => {
            const item = new CheckboxFormItem({ id: "cb1", type: "checkbox", get: "f:function(view) { return true; }" }, mockFunctionProcessor);
            await item.initialize();
            expect(item.get({})).toBe(true);
        });
    });

    // ─── assignToForm ───

    describe("assignToForm", () => {
        test("does nothing when no form display is configured", async () => {
            const item = new CheckboxFormItem({ id: "cb1", type: "checkbox" }, mockFunctionProcessor);
            await item.initialize();
            // Should not throw
            expect(() => item.assignToForm({} as HTMLElement)).not.toThrow();
        });

        test("does not throw when form display is configured", async () => {
            const item = new CheckboxFormItem({
                id: "cb1", type: "checkbox",
                form: { title: "My Checkbox", description: "desc" },
            }, mockFunctionProcessor);
            await item.initialize();
            expect(() => item.assignToForm({} as HTMLElement)).not.toThrow();
        });
    });

    // ─── initialize ───

    describe("initialize", () => {
        test("value is undefined before initialize", () => {
            const item = new CheckboxFormItem({ id: "cb1", type: "checkbox", init: "v:true" }, mockFunctionProcessor);
            expect(item.value).toBeUndefined();
        });

        test("resolves ref: init via executeRefFunction", async () => {
            mockFunctionProcessor.executeRefFunction.mockResolvedValueOnce(true);
            const item = new CheckboxFormItem({ id: "cb1", type: "checkbox", init: "ref:isChecked" }, mockFunctionProcessor);
            await item.initialize();
            expect(mockFunctionProcessor.executeRefFunction).toHaveBeenCalledWith("isChecked");
            expect(item.value).toBe(true);
        });

        test("resolves ref: with path via executeRefFunction", async () => {
            mockFunctionProcessor.executeRefFunction.mockResolvedValueOnce(false);
            const item = new CheckboxFormItem({ id: "cb1", type: "checkbox", init: "ref:/funcs.md:isChecked" }, mockFunctionProcessor);
            await item.initialize();
            expect(mockFunctionProcessor.executeRefFunction).toHaveBeenCalledWith("/funcs.md:isChecked");
            expect(item.value).toBe(false);
        });

        test("throws for unsupported init prefix", async () => {
            const item = new CheckboxFormItem({ id: "cb1", type: "checkbox", init: "x:bad" as any }, mockFunctionProcessor);
            await expect(item.initialize()).rejects.toThrow("Unsupported init function");
        });
    });
});
