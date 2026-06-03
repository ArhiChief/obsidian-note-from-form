import { TextFormItem } from "../form/textFormItem";

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

describe("TextFormItem", () => {

    // ─── constructor ───

    describe("constructor", () => {
        test("defaults to empty string when no init provided", () => {
            const item = new TextFormItem({ id: "t1", type: "text" });
            expect(item.value).toBe("");
        });

        test("parses v: init value", () => {
            const item = new TextFormItem({ id: "t1", type: "text", init: "v:hello" });
            expect(item.value).toBe("hello");
        });

        test("evaluates f: init function", () => {
            const item = new TextFormItem({ id: "t1", type: "text", init: "f:() => 'computed'" });
            expect(item.value).toBe("computed");
        });

        test("accepts text type", () => {
            expect(() => new TextFormItem({ id: "t1", type: "text" })).not.toThrow();
        });

        test("accepts textArea type", () => {
            expect(() => new TextFormItem({ id: "t1", type: "textArea" })).not.toThrow();
        });

        test("throws for unsupported type", () => {
            expect(() => new TextFormItem({ id: "t1", type: "number" as any }))
                .toThrow("Unsupported type");
        });

        test("sets id and type correctly", () => {
            const item = new TextFormItem({ id: "myText", type: "textArea" });
            expect(item.id).toBe("myText");
            expect(item.type).toBe("textArea");
        });
    });

    // ─── get ───

    describe("get", () => {
        test("returns value when no getFunc", () => {
            const item = new TextFormItem({ id: "t1", type: "text", init: "v:world" });
            expect(item.get({})).toBe("world");
        });

        test("returns empty string for default value", () => {
            const item = new TextFormItem({ id: "t1", type: "text" });
            expect(item.get({})).toBe("");
        });

        test("returns literal for v: getFunc", () => {
            const item = new TextFormItem({ id: "t1", type: "text", get: "v:override" });
            expect(item.get({})).toBe("override");
        });
    });

    // ─── assignToForm ───

    describe("assignToForm", () => {
        test("does nothing when no form display is configured", () => {
            const item = new TextFormItem({ id: "t1", type: "text" });
            expect(() => item.assignToForm({} as HTMLElement)).not.toThrow();
        });

        test("does not throw for text type with form", () => {
            const item = new TextFormItem({
                id: "t1", type: "text",
                form: { title: "Enter text", placeholder: "type here" },
            });
            expect(() => item.assignToForm({} as HTMLElement)).not.toThrow();
        });

        test("does not throw for textArea type with form", () => {
            const item = new TextFormItem({
                id: "t1", type: "textArea",
                form: { title: "Enter text" },
            });
            expect(() => item.assignToForm({} as HTMLElement)).not.toThrow();
        });
    });
});
