import { NumberFormItem } from "../form/numberFormItem";

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

describe("NumberFormItem", () => {

    // ─── constructor ───

    describe("constructor", () => {
        test("defaults to 0 when no init provided", async () => {
            const item = new NumberFormItem({ id: "n1", type: "number" }, mockFunctionProcessor);
            await item.initialize();
            expect(item.value).toBe(0);
        });

        test("parses v: numeric init", async () => {
            const item = new NumberFormItem({ id: "n1", type: "number", init: "v:42" }, mockFunctionProcessor);
            await item.initialize();
            expect(item.value).toBe(42);
        });

        test("parses v: negative number", async () => {
            const item = new NumberFormItem({ id: "n1", type: "number", init: "v:-7" }, mockFunctionProcessor);
            await item.initialize();
            expect(item.value).toBe(-7);
        });

        test("parses v: float", async () => {
            const item = new NumberFormItem({ id: "n1", type: "number", init: "v:3.14" }, mockFunctionProcessor);
            await item.initialize();
            expect(item.value).toBeCloseTo(3.14);
        });

        test("throws for v: non-numeric init", async () => {
            const item = new NumberFormItem({ id: "n1", type: "number", init: "v:abc" }, mockFunctionProcessor);
            await expect(item.initialize()).rejects.toThrow("Invalid number init value");
        });

        test("evaluates f: init function", async () => {
            const item = new NumberFormItem({ id: "n1", type: "number", init: "f:() => 99" }, mockFunctionProcessor);
            await item.initialize();
            expect(item.value).toBe(99);
        });

        test("throws for unsupported type", () => {
            expect(() => new NumberFormItem({ id: "n1", type: "text" as any }, mockFunctionProcessor))
                .toThrow("Unsupported type");
        });

        test("sets id and type correctly", () => {
            const item = new NumberFormItem({ id: "myNum", type: "number" }, mockFunctionProcessor);
            expect(item.id).toBe("myNum");
            expect(item.type).toBe("number");
        });
    });

    // ─── get ───

    describe("get", () => {
        test("returns stringified number when no getFunc", async () => {
            const item = new NumberFormItem({ id: "n1", type: "number", init: "v:42" }, mockFunctionProcessor);
            await item.initialize();
            expect(item.get({})).toBe("42");
        });

        test("returns '0' for default value", async () => {
            const item = new NumberFormItem({ id: "n1", type: "number" }, mockFunctionProcessor);
            await item.initialize();
            expect(item.get({})).toBe("0");
        });

        test("returns literal for v: getFunc", async () => {
            const item = new NumberFormItem({ id: "n1", type: "number", get: "v:hundred" }, mockFunctionProcessor);
            await item.initialize();
            expect(item.get({})).toBe("hundred");
        });
    });

    // ─── assignToForm ───

    describe("assignToForm", () => {
        test("does nothing when no form display is configured", async () => {
            const item = new NumberFormItem({ id: "n1", type: "number" }, mockFunctionProcessor);
            await item.initialize();
            expect(() => item.assignToForm({} as HTMLElement)).not.toThrow();
        });

        test("does not throw when form display is configured", async () => {
            const item = new NumberFormItem({
                id: "n1", type: "number",
                form: { title: "Enter a number" },
            }, mockFunctionProcessor);
            await item.initialize();
            expect(() => item.assignToForm({} as HTMLElement)).not.toThrow();
        });
    });

    // ─── initialize ───

    describe("initialize", () => {
        test("value is undefined before initialize", () => {
            const item = new NumberFormItem({ id: "n1", type: "number", init: "v:42" }, mockFunctionProcessor);
            expect(item.value).toBeUndefined();
        });

        test("resolves ref: init via executeRefFunction", async () => {
            mockFunctionProcessor.executeRefFunction.mockResolvedValueOnce(77);
            const item = new NumberFormItem({ id: "n1", type: "number", init: "ref:getNumber" }, mockFunctionProcessor);
            await item.initialize();
            expect(mockFunctionProcessor.executeRefFunction).toHaveBeenCalledWith("getNumber");
            expect(item.value).toBe(77);
        });

        test("resolves ref: with path via executeRefFunction", async () => {
            mockFunctionProcessor.executeRefFunction.mockResolvedValueOnce(123);
            const item = new NumberFormItem({ id: "n1", type: "number", init: "ref:/utils.md:getNumber" }, mockFunctionProcessor);
            await item.initialize();
            expect(mockFunctionProcessor.executeRefFunction).toHaveBeenCalledWith("/utils.md:getNumber");
            expect(item.value).toBe(123);
        });

        test("throws for unsupported init prefix", async () => {
            const item = new NumberFormItem({ id: "n1", type: "number", init: "x:bad" as any }, mockFunctionProcessor);
            await expect(item.initialize()).rejects.toThrow("Unsupported init function");
        });
    });
});
