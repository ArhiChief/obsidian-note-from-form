import { NumberFormItem } from "../form/numberFormItem";

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

describe("NumberFormItem", () => {

    // ─── constructor ───

    describe("constructor", () => {
        test("defaults to 0 when no init provided", async () => {
            const item = new NumberFormItem({ id: "n1", type: "number" }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(item.value).toBe(0);
        });

        test("parses v: numeric init", async () => {
            const item = new NumberFormItem({ id: "n1", type: "number", init: "v:42" }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(item.value).toBe(42);
        });

        test("parses v: negative number", async () => {
            const item = new NumberFormItem({ id: "n1", type: "number", init: "v:-7" }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(item.value).toBe(-7);
        });

        test("parses v: float", async () => {
            const item = new NumberFormItem({ id: "n1", type: "number", init: "v:3.14" }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(item.value).toBeCloseTo(3.14);
        });

        test("throws for v: non-numeric init", async () => {
            const item = new NumberFormItem({ id: "n1", type: "number", init: "v:abc" }, mockFunctionProcessor, mockUserApi);
            await expect(item.initialize()).rejects.toThrow("Invalid number init value");
        });

        test("evaluates f: init function", async () => {
            const item = new NumberFormItem({ id: "n1", type: "number", init: "f:async () => 99" }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(item.value).toBe(99);
        });

        test("throws for unsupported type", () => {
            expect(() => new NumberFormItem({ id: "n1", type: "text" as any }, mockFunctionProcessor, mockUserApi))
                .toThrow("Unsupported type");
        });

        test("sets id and type correctly", () => {
            const item = new NumberFormItem({ id: "myNum", type: "number" }, mockFunctionProcessor, mockUserApi);
            expect(item.id).toBe("myNum");
            expect(item.type).toBe("number");
        });
    });

    // ─── get ───

    describe("get", () => {
        test("returns stringified number when no getFunc", async () => {
            const item = new NumberFormItem({ id: "n1", type: "number", init: "v:42" }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(await item.get({})).toBe("42");
        });

        test("returns '0' for default value", async () => {
            const item = new NumberFormItem({ id: "n1", type: "number" }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(await item.get({})).toBe("0");
        });

        test("returns literal for v: getFunc", async () => {
            const item = new NumberFormItem({ id: "n1", type: "number", get: "v:hundred" }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(await item.get({})).toBe("hundred");
        });
    });

    // ─── assignToForm ───

    describe("assignToForm", () => {
        test("does nothing when no form display is configured", async () => {
            const item = new NumberFormItem({ id: "n1", type: "number" }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(() => item.assignToForm({} as HTMLElement)).not.toThrow();
        });

        test("does not throw when form display is configured", async () => {
            const item = new NumberFormItem({
                id: "n1", type: "number",
                form: { title: "Enter a number" },
            }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(() => item.assignToForm({} as HTMLElement)).not.toThrow();
        });
    });

    // ─── initialize ───

    describe("initialize", () => {
        test("value is undefined before initialize", () => {
            const item = new NumberFormItem({ id: "n1", type: "number", init: "v:42" }, mockFunctionProcessor, mockUserApi);
            expect(item.value).toBeUndefined();
        });

        test("resolves ref: init via executeRefFunction", async () => {
            mockFunctionProcessor.executeRefFunction.mockResolvedValueOnce(77);
            const item = new NumberFormItem({ id: "n1", type: "number", init: "ref:getNumber" }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(mockFunctionProcessor.executeRefFunction).toHaveBeenCalledWith("getNumber");
            expect(item.value).toBe(77);
        });

        test("resolves ref: with path via executeRefFunction", async () => {
            mockFunctionProcessor.executeRefFunction.mockResolvedValueOnce(123);
            const item = new NumberFormItem({ id: "n1", type: "number", init: "ref:/utils.md:getNumber" }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(mockFunctionProcessor.executeRefFunction).toHaveBeenCalledWith("/utils.md:getNumber");
            expect(item.value).toBe(123);
        });

        test("throws for unsupported init prefix", async () => {
            const item = new NumberFormItem({ id: "n1", type: "number", init: "x:bad" as any }, mockFunctionProcessor, mockUserApi);
            await expect(item.initialize()).rejects.toThrow("Unsupported init function");
        });
    });

    // ─── validate ───

    describe("validate", () => {
        test("returns true when no validateFunc is provided", async () => {
            const item = new NumberFormItem({ id: "n1", type: "number" }, mockFunctionProcessor, mockUserApi);
            const result = await item.validate({ n1: 42 });
            expect(result).toBe(true);
        });

        test("returns true when no element is assigned (no form)", async () => {
            const item = new NumberFormItem({
                id: "n1", type: "number",
                validate: "f:async (view) => ({ isValid: true })" as any,
            }, mockFunctionProcessor, mockUserApi);
            const result = await item.validate({ n1: 42 });
            expect(result).toBe(true);
        });

        test("returns true for valid inline function", async () => {
            mockFunctionProcessor.executeFunction.mockReturnValueOnce({ isValid: true });
            const item = new NumberFormItem({
                id: "n1", type: "number",
                form: { title: "Number" },
                validate: "f:async (view) => ({ isValid: true })" as any,
            }, mockFunctionProcessor, mockUserApi);
            item.assignToForm({} as HTMLElement);
            const result = await item.validate({ n1: 42 });
            expect(result).toBe(true);
        });

        test("returns false and calls setError for invalid result", async () => {
            mockFunctionProcessor.executeFunction.mockReturnValueOnce({ isValid: false, errMsg: "Must be positive" });
            const item = new NumberFormItem({
                id: "n1", type: "number",
                form: { title: "Number" },
                validate: "f:async (view) => ({ isValid: false, errMsg: 'Must be positive' })" as any,
            }, mockFunctionProcessor, mockUserApi);
            item.assignToForm({} as HTMLElement);

            const element = (item as any)._element;
            const setError = jest.fn().mockReturnThis();
            element.setError = setError;
            element.clearError = jest.fn().mockReturnThis();

            const result = await item.validate({ n1: -5 });
            expect(result).toBe(false);
            expect(setError).toHaveBeenCalledWith("Must be positive");
        });

        test("resolves ref: validate via executeRefFunction", async () => {
            mockFunctionProcessor.executeRefFunction.mockResolvedValueOnce({ isValid: true });
            const item = new NumberFormItem({
                id: "n1", type: "number",
                form: { title: "Number" },
                validate: "ref:numValidator" as any,
            }, mockFunctionProcessor, mockUserApi);
            item.assignToForm({} as HTMLElement);
            const result = await item.validate({ n1: 10 });
            expect(result).toBe(true);
            expect(mockFunctionProcessor.executeRefFunction).toHaveBeenCalledWith("numValidator", { n1: 10 });
        });

        test("throws for unsupported validate prefix", async () => {
            const item = new NumberFormItem({
                id: "n1", type: "number",
                form: { title: "Number" },
                validate: "x:bad" as any,
            }, mockFunctionProcessor, mockUserApi);
            item.assignToForm({} as HTMLElement);
            await expect(item.validate({ n1: 0 })).rejects.toThrow("Unsupported validate function");
        });
    });
});
