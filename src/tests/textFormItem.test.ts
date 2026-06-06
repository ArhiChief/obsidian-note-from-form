import { TextFormItem } from "../form/textFormItem";

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
    executeFunction: jest.fn().mockImplementation((funcText: string) => {
        const func = eval(`(${funcText})`);
        return func();
    }),
    executeFunctionWithParam: jest.fn(),
    executeRefFunction: jest.fn(),
    executeRefFunctionWithParam: jest.fn(),
} as any;

describe("TextFormItem", () => {

    // ─── constructor ───

    describe("constructor", () => {
        test("defaults to empty string when no init provided", async () => {
            const item = new TextFormItem({ id: "t1", type: "text" }, mockFunctionProcessor);
            await item.initialize();
            expect(item.value).toBe("");
        });

        test("parses v: init value", async () => {
            const item = new TextFormItem({ id: "t1", type: "text", init: "v:hello" }, mockFunctionProcessor);
            await item.initialize();
            expect(item.value).toBe("hello");
        });

        test("evaluates f: init function", async () => {
            const item = new TextFormItem({ id: "t1", type: "text", init: "f:() => 'computed'" }, mockFunctionProcessor);
            await item.initialize();
            expect(item.value).toBe("computed");
        });

        test("accepts text type", () => {
            expect(() => new TextFormItem({ id: "t1", type: "text" }, mockFunctionProcessor)).not.toThrow();
        });

        test("accepts textArea type", () => {
            expect(() => new TextFormItem({ id: "t1", type: "textArea" }, mockFunctionProcessor)).not.toThrow();
        });

        test("throws for unsupported type", () => {
            expect(() => new TextFormItem({ id: "t1", type: "number" as any }, mockFunctionProcessor))
                .toThrow("Unsupported type");
        });

        test("sets id and type correctly", () => {
            const item = new TextFormItem({ id: "myText", type: "textArea" }, mockFunctionProcessor);
            expect(item.id).toBe("myText");
            expect(item.type).toBe("textArea");
        });
    });

    // ─── get ───

    describe("get", () => {
        test("returns value when no getFunc", async () => {
            const item = new TextFormItem({ id: "t1", type: "text", init: "v:world" }, mockFunctionProcessor);
            await item.initialize();
            expect(item.get({})).toBe("world");
        });

        test("returns empty string for default value", async () => {
            const item = new TextFormItem({ id: "t1", type: "text" }, mockFunctionProcessor);
            await item.initialize();
            expect(item.get({})).toBe("");
        });

        test("returns literal for v: getFunc", async () => {
            const item = new TextFormItem({ id: "t1", type: "text", get: "v:override" }, mockFunctionProcessor);
            await item.initialize();
            expect(item.get({})).toBe("override");
        });
    });

    // ─── assignToForm ───

    describe("assignToForm", () => {
        test("does nothing when no form display is configured", async () => {
            const item = new TextFormItem({ id: "t1", type: "text" }, mockFunctionProcessor);
            await item.initialize();
            expect(() => item.assignToForm({} as HTMLElement)).not.toThrow();
        });

        test("does not throw for text type with form", async () => {
            const item = new TextFormItem({
                id: "t1", type: "text",
                form: { title: "Enter text", placeholder: "type here" },
            }, mockFunctionProcessor);
            await item.initialize();
            expect(() => item.assignToForm({} as HTMLElement)).not.toThrow();
        });

        test("does not throw for textArea type with form", async () => {
            const item = new TextFormItem({
                id: "t1", type: "textArea",
                form: { title: "Enter text" },
            }, mockFunctionProcessor);
            await item.initialize();
            expect(() => item.assignToForm({} as HTMLElement)).not.toThrow();
        });
    });

    // ─── initialize ───

    describe("initialize", () => {
        test("value is undefined before initialize", () => {
            const item = new TextFormItem({ id: "t1", type: "text", init: "v:hello" }, mockFunctionProcessor);
            expect(item.value).toBeUndefined();
        });

        test("resolves ref: init via executeRefFunction", async () => {
            mockFunctionProcessor.executeRefFunction.mockResolvedValueOnce("from-ref");
            const item = new TextFormItem({ id: "t1", type: "text", init: "ref:myFunc" }, mockFunctionProcessor);
            await item.initialize();
            expect(mockFunctionProcessor.executeRefFunction).toHaveBeenCalledWith("myFunc");
            expect(item.value).toBe("from-ref");
        });

        test("resolves ref: with path via executeRefFunction", async () => {
            mockFunctionProcessor.executeRefFunction.mockResolvedValueOnce("from-file-ref");
            const item = new TextFormItem({ id: "t1", type: "text", init: "ref:/path/to/file.md:myFunc" }, mockFunctionProcessor);
            await item.initialize();
            expect(mockFunctionProcessor.executeRefFunction).toHaveBeenCalledWith("/path/to/file.md:myFunc");
            expect(item.value).toBe("from-file-ref");
        });

        test("throws for unsupported init prefix", async () => {
            const item = new TextFormItem({ id: "t1", type: "text", init: "x:bad" as any }, mockFunctionProcessor);
            await expect(item.initialize()).rejects.toThrow("Unsupported init function");
        });
    });

    // ─── validate ───

    describe("validate", () => {
        test("returns true when no validateFunc is provided", async () => {
            const item = new TextFormItem({ id: "t1", type: "text" }, mockFunctionProcessor);
            const result = await item.validate({ t1: "hello" });
            expect(result).toBe(true);
        });

        test("returns true when no element is assigned (no form)", async () => {
            const item = new TextFormItem({
                id: "t1", type: "text",
                validate: "f:(view) => ({ isValid: true })" as any,
            }, mockFunctionProcessor);
            const result = await item.validate({ t1: "hello" });
            expect(result).toBe(true);
        });

        test("returns true for valid inline function", async () => {
            mockFunctionProcessor.executeFunctionWithParam.mockReturnValueOnce({ isValid: true });
            const item = new TextFormItem({
                id: "t1", type: "text",
                form: { title: "Title" },
                validate: "f:(view) => ({ isValid: true })" as any,
            }, mockFunctionProcessor);
            item.assignToForm({} as HTMLElement);
            const result = await item.validate({ t1: "hello" });
            expect(result).toBe(true);
            expect(mockFunctionProcessor.executeFunctionWithParam).toHaveBeenCalledWith(
                "(view) => ({ isValid: true })",
                { t1: "hello" },
            );
        });

        test("returns false and calls setError for invalid inline function", async () => {
            mockFunctionProcessor.executeFunctionWithParam.mockReturnValueOnce({ isValid: false, errMsg: "Required!" });
            const item = new TextFormItem({
                id: "t1", type: "text",
                form: { title: "Title" },
                validate: "f:(view) => ({ isValid: false, errMsg: 'Required!' })" as any,
            }, mockFunctionProcessor);
            item.assignToForm({} as HTMLElement);
            const result = await item.validate({ t1: "" });
            expect(result).toBe(false);
        });

        test("calls clearError before checking result", async () => {
            const clearError = jest.fn().mockReturnThis();
            const setError = jest.fn().mockReturnThis();

            jest.resetModules();
            // Re-import after setting up specific mock tracking
            mockFunctionProcessor.executeFunctionWithParam.mockReturnValueOnce({ isValid: true });
            const item = new TextFormItem({
                id: "t1", type: "text",
                form: { title: "Title" },
                validate: "f:(view) => ({ isValid: true })" as any,
            }, mockFunctionProcessor);
            item.assignToForm({} as HTMLElement);

            // Access the private _element to attach spies
            const element = (item as any)._element;
            element.clearError = clearError;
            element.setError = setError;

            await item.validate({ t1: "val" });
            expect(clearError).toHaveBeenCalled();
            expect(setError).not.toHaveBeenCalled();
        });

        test("calls setError with errMsg when validation fails", async () => {
            mockFunctionProcessor.executeFunctionWithParam.mockReturnValueOnce({ isValid: false, errMsg: "Too short" });
            const item = new TextFormItem({
                id: "t1", type: "text",
                form: { title: "Title" },
                validate: "f:(view) => ({ isValid: false, errMsg: 'Too short' })" as any,
            }, mockFunctionProcessor);
            item.assignToForm({} as HTMLElement);

            const element = (item as any)._element;
            const setError = jest.fn().mockReturnThis();
            element.setError = setError;
            element.clearError = jest.fn().mockReturnThis();

            await item.validate({ t1: "a" });
            expect(setError).toHaveBeenCalledWith("Too short");
        });

        test("resolves ref: validate via executeRefFunctionWithParam", async () => {
            mockFunctionProcessor.executeRefFunctionWithParam.mockResolvedValueOnce({ isValid: true });
            const item = new TextFormItem({
                id: "t1", type: "text",
                form: { title: "Title" },
                validate: "ref:myValidator" as any,
            }, mockFunctionProcessor);
            item.assignToForm({} as HTMLElement);
            const result = await item.validate({ t1: "hello" });
            expect(result).toBe(true);
            expect(mockFunctionProcessor.executeRefFunctionWithParam).toHaveBeenCalledWith("myValidator", { t1: "hello" });
        });

        test("resolves ref: with path via executeRefFunctionWithParam", async () => {
            mockFunctionProcessor.executeRefFunctionWithParam.mockResolvedValueOnce({ isValid: false, errMsg: "Nope" });
            const item = new TextFormItem({
                id: "t1", type: "text",
                form: { title: "Title" },
                validate: "ref:/path/to/file.md:myValidator" as any,
            }, mockFunctionProcessor);
            item.assignToForm({} as HTMLElement);
            const result = await item.validate({ t1: "x" });
            expect(result).toBe(false);
            expect(mockFunctionProcessor.executeRefFunctionWithParam).toHaveBeenCalledWith("/path/to/file.md:myValidator", { t1: "x" });
        });

        test("throws for unsupported validate prefix", async () => {
            const item = new TextFormItem({
                id: "t1", type: "text",
                form: { title: "Title" },
                validate: "x:bad" as any,
            }, mockFunctionProcessor);
            item.assignToForm({} as HTMLElement);
            await expect(item.validate({ t1: "val" })).rejects.toThrow("Unsupported validate function");
        });
    });
});
