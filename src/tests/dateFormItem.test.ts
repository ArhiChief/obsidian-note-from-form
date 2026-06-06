import { DateTimeFormItem as DateFormItem } from "../form/dateTimeFormItem";

const momentMock = (date: any) => ({
    format: (fmt?: string) => {
        switch (fmt) {
            case 'L': return '01/15/2025';
            case 'LTS': return '2:30:45 PM';
            default: return '2025-01-15T14:30:45Z';
        }
    }
});

(globalThis as any).window = { moment: momentMock };

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

jest.mock("src/ui/dateTimeComponent", () => ({
    DateTimeComponent: jest.fn(),
}));

const mockFunctionProcessor = {
    renderMustacheTemplate: jest.fn(),
    executeFunction: jest.fn().mockImplementation((funcText: string, ...args: any[]) => {
        const func = eval(`(${funcText})`);
        return func(...args);
    }),
    executeRefFunction: jest.fn(),
} as any;
const mockUserApi = {} as any;

describe("DateFormItem", () => {

    // ─── constructor ───

    describe("constructor", () => {
        test("defaults to current date when no init provided", async () => {
            const before = Date.now();
            const item = new DateFormItem({ id: "d1", type: "date" }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            const after = Date.now();
            expect(item.value!.getTime()).toBeGreaterThanOrEqual(before);
            expect(item.value!.getTime()).toBeLessThanOrEqual(after);
        });

        test("parses v: date init value", async () => {
            const item = new DateFormItem({ id: "d1", type: "date", init: "v:2025-01-15" }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(item.value!.getFullYear()).toBe(2025);
            expect(item.value!.getMonth()).toBe(0);
            expect(item.value!.getDate()).toBe(15);
        });

        test("throws for invalid v: date init value", async () => {
            const item = new DateFormItem({ id: "d1", type: "date", init: "v:not-a-date" }, mockFunctionProcessor, mockUserApi);
            await expect(item.initialize()).rejects.toThrow("Invalid date init value");
        });

        test("evaluates f: init function", async () => {
            const item = new DateFormItem({
                id: "d1", type: "date",
                init: "f:async () => new Date(2025, 0, 1)",
            }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(item.value!.getFullYear()).toBe(2025);
        });

        test("accepts date type", () => {
            expect(() => new DateFormItem({ id: "d1", type: "date" }, mockFunctionProcessor, mockUserApi)).not.toThrow();
        });

        test("accepts time type", () => {
            expect(() => new DateFormItem({ id: "d1", type: "time" }, mockFunctionProcessor, mockUserApi)).not.toThrow();
        });

        test("accepts dateTime type", () => {
            expect(() => new DateFormItem({ id: "d1", type: "dateTime" }, mockFunctionProcessor, mockUserApi)).not.toThrow();
        });

        test("throws for unsupported type", () => {
            expect(() => new DateFormItem({ id: "d1", type: "text" as any }, mockFunctionProcessor, mockUserApi))
                .toThrow("Unsupported type");
        });

        test("sets id and type correctly", () => {
            const item = new DateFormItem({ id: "myDate", type: "time" }, mockFunctionProcessor, mockUserApi);
            expect(item.id).toBe("myDate");
            expect(item.type).toBe("time");
        });
    });

    // ─── get ───

    describe("get", () => {
        test("returns formatted date for date type (no getFunc)", async () => {
            const item = new DateFormItem({ id: "d1", type: "date", init: "v:2025-01-15" }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(await item.get({})).toBe("01/15/2025");
        });

        test("returns formatted time for time type (no getFunc)", async () => {
            const item = new DateFormItem({ id: "d1", type: "time", init: "v:2025-01-15T14:30:45" }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(await item.get({})).toBe("2:30:45 PM");
        });

        test("returns formatted dateTime for dateTime type (no getFunc)", async () => {
            const item = new DateFormItem({ id: "d1", type: "dateTime", init: "v:2025-01-15T14:30:45" }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(await item.get({})).toBe("2025-01-15T14:30:45Z");
        });

        test("returns literal for v: getFunc", async () => {
            const item = new DateFormItem({ id: "d1", type: "date", get: "v:custom-date" }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(await item.get({})).toBe("custom-date");
        });

        test("formats date with moment when template has no mustache expressions", async () => {
            const item = new DateFormItem({ id: "d1", type: "date", get: "t:L", init: "v:2025-01-15" }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(await item.get({})).toBe("01/15/2025");
        });

        test("formats time with moment when template has no mustache expressions", async () => {
            const item = new DateFormItem({ id: "d1", type: "time", get: "t:LTS", init: "v:2025-01-15T14:30:45" }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(await item.get({})).toBe("2:30:45 PM");
        });

        test("delegates to Mustache when template contains mustache expressions", async () => {
            mockFunctionProcessor.renderMustacheTemplate.mockReturnValueOnce("Jan 15");
            const item = new DateFormItem({ id: "d1", type: "date", get: "t:{{label}}", init: "v:2025-01-15" }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(await item.get({ label: "Jan 15" })).toBe("Jan 15");
        });

        test("delegates to Mustache for mixed mustache and text", async () => {
            mockFunctionProcessor.renderMustacheTemplate.mockReturnValueOnce("Date: 2025");
            const item = new DateFormItem({ id: "d1", type: "date", get: "t:Date: {{label}}", init: "v:2025-01-15" }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(await item.get({ label: "2025" })).toBe("Date: 2025");
        });
    });

    // ─── assignToForm ───

    describe("assignToForm", () => {
        test("does nothing when no form display is configured", async () => {
            const item = new DateFormItem({ id: "d1", type: "date" }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(() => item.assignToForm({} as HTMLElement)).not.toThrow();
        });

        test("does not throw for date type with form", async () => {
            const item = new DateFormItem({
                id: "d1", type: "date",
                form: { title: "Pick a date" },
            }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(() => item.assignToForm({} as HTMLElement)).not.toThrow();
        });

        test("does not throw for time type with form", async () => {
            const item = new DateFormItem({
                id: "d1", type: "time",
                form: { title: "Pick a time" },
            }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(() => item.assignToForm({} as HTMLElement)).not.toThrow();
        });

        test("does not throw for dateTime type with form", async () => {
            const item = new DateFormItem({
                id: "d1", type: "dateTime",
                form: { title: "Pick date and time" },
            }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(() => item.assignToForm({} as HTMLElement)).not.toThrow();
        });
    });

    // ─── initialize ───

    describe("initialize", () => {
        test("value is undefined before initialize", () => {
            const item = new DateFormItem({ id: "d1", type: "date", init: "v:2025-01-15" }, mockFunctionProcessor, mockUserApi);
            expect(item.value).toBeUndefined();
        });

        test("resolves ref: init via executeRefFunction", async () => {
            const refDate = new Date(2025, 5, 1);
            mockFunctionProcessor.executeRefFunction.mockResolvedValueOnce(refDate);
            const item = new DateFormItem({ id: "d1", type: "date", init: "ref:getDate" }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(mockFunctionProcessor.executeRefFunction).toHaveBeenCalledWith("getDate");
            expect(item.value).toBe(refDate);
        });

        test("resolves ref: with path via executeRefFunction", async () => {
            const refDate = new Date(2024, 0, 1);
            mockFunctionProcessor.executeRefFunction.mockResolvedValueOnce(refDate);
            const item = new DateFormItem({ id: "d1", type: "date", init: "ref:/helpers.md:getDate" }, mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(mockFunctionProcessor.executeRefFunction).toHaveBeenCalledWith("/helpers.md:getDate");
            expect(item.value).toBe(refDate);
        });

        test("throws for unsupported init prefix", async () => {
            const item = new DateFormItem({ id: "d1", type: "date", init: "x:bad" as any }, mockFunctionProcessor, mockUserApi);
            await expect(item.initialize()).rejects.toThrow("Unsupported init function");
        });
    });

    // ─── validate ───

    describe("validate", () => {
        test("returns true when no validateFunc is provided", async () => {
            const item = new DateFormItem({ id: "d1", type: "date" }, mockFunctionProcessor, mockUserApi);
            const result = await item.validate({ d1: new Date() });
            expect(result).toBe(true);
        });

        test("returns true when no element is assigned (no form)", async () => {
            const item = new DateFormItem({
                id: "d1", type: "date",
                validate: "f:async (view) => ({ isValid: true })" as any,
            }, mockFunctionProcessor, mockUserApi);
            const result = await item.validate({ d1: new Date() });
            expect(result).toBe(true);
        });

        test("returns true for valid inline function", async () => {
            mockFunctionProcessor.executeFunction.mockReturnValueOnce({ isValid: true });
            const item = new DateFormItem({
                id: "d1", type: "date",
                form: { title: "Date" },
                validate: "f:async (view) => ({ isValid: true })" as any,
            }, mockFunctionProcessor, mockUserApi);
            item.assignToForm({} as HTMLElement);
            const result = await item.validate({ d1: new Date() });
            expect(result).toBe(true);
        });

        test("returns false and calls setError for invalid result", async () => {
            mockFunctionProcessor.executeFunction.mockReturnValueOnce({ isValid: false, errMsg: "Date too old" });
            const item = new DateFormItem({
                id: "d1", type: "date",
                form: { title: "Date" },
                validate: "f:async (view) => ({ isValid: false, errMsg: 'Date too old' })" as any,
            }, mockFunctionProcessor, mockUserApi);
            item.assignToForm({} as HTMLElement);

            const element = (item as any)._element;
            const setError = jest.fn().mockReturnThis();
            element.setError = setError;
            element.clearError = jest.fn().mockReturnThis();

            const result = await item.validate({ d1: new Date(2000, 0, 1) });
            expect(result).toBe(false);
            expect(setError).toHaveBeenCalledWith("Date too old");
        });

        test("resolves ref: validate via executeRefFunction", async () => {
            mockFunctionProcessor.executeRefFunction.mockResolvedValueOnce({ isValid: true });
            const item = new DateFormItem({
                id: "d1", type: "date",
                form: { title: "Date" },
                validate: "ref:dateValidator" as any,
            }, mockFunctionProcessor, mockUserApi);
            item.assignToForm({} as HTMLElement);
            const view = { d1: new Date() };
            const result = await item.validate(view);
            expect(result).toBe(true);
            expect(mockFunctionProcessor.executeRefFunction).toHaveBeenCalledWith("dateValidator", view);
        });

        test("throws for unsupported validate prefix", async () => {
            const item = new DateFormItem({
                id: "d1", type: "date",
                form: { title: "Date" },
                validate: "x:bad" as any,
            }, mockFunctionProcessor, mockUserApi);
            item.assignToForm({} as HTMLElement);
            await expect(item.validate({ d1: new Date() })).rejects.toThrow("Unsupported validate function");
        });
    });
});
