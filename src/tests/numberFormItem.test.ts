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

describe("NumberFormItem", () => {

    // ─── constructor ───

    describe("constructor", () => {
        test("defaults to 0 when no init provided", () => {
            const item = new NumberFormItem({ id: "n1", type: "number" });
            expect(item.value).toBe(0);
        });

        test("parses v: numeric init", () => {
            const item = new NumberFormItem({ id: "n1", type: "number", init: "v:42" });
            expect(item.value).toBe(42);
        });

        test("parses v: negative number", () => {
            const item = new NumberFormItem({ id: "n1", type: "number", init: "v:-7" });
            expect(item.value).toBe(-7);
        });

        test("parses v: float", () => {
            const item = new NumberFormItem({ id: "n1", type: "number", init: "v:3.14" });
            expect(item.value).toBeCloseTo(3.14);
        });

        test("throws for v: non-numeric init", () => {
            expect(() => new NumberFormItem({ id: "n1", type: "number", init: "v:abc" }))
                .toThrow("Invalid number init value");
        });

        test("evaluates f: init function", () => {
            const item = new NumberFormItem({ id: "n1", type: "number", init: "f:() => 99" });
            expect(item.value).toBe(99);
        });

        test("throws for unsupported type", () => {
            expect(() => new NumberFormItem({ id: "n1", type: "text" as any }))
                .toThrow("Unsupported type");
        });

        test("sets id and type correctly", () => {
            const item = new NumberFormItem({ id: "myNum", type: "number" });
            expect(item.id).toBe("myNum");
            expect(item.type).toBe("number");
        });
    });

    // ─── get ───

    describe("get", () => {
        test("returns stringified number when no getFunc", () => {
            const item = new NumberFormItem({ id: "n1", type: "number", init: "v:42" });
            expect(item.get({})).toBe("42");
        });

        test("returns '0' for default value", () => {
            const item = new NumberFormItem({ id: "n1", type: "number" });
            expect(item.get({})).toBe("0");
        });

        test("returns literal for v: getFunc", () => {
            const item = new NumberFormItem({ id: "n1", type: "number", get: "v:hundred" });
            expect(item.get({})).toBe("hundred");
        });
    });

    // ─── assignToForm ───

    describe("assignToForm", () => {
        test("does nothing when no form display is configured", () => {
            const item = new NumberFormItem({ id: "n1", type: "number" });
            expect(() => item.assignToForm({} as HTMLElement)).not.toThrow();
        });

        test("does not throw when form display is configured", () => {
            const item = new NumberFormItem({
                id: "n1", type: "number",
                form: { title: "Enter a number" },
            });
            expect(() => item.assignToForm({} as HTMLElement)).not.toThrow();
        });
    });
});
