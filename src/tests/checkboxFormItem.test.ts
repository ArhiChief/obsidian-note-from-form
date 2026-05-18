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

describe("CheckboxFormItem", () => {

    // ─── constructor ───

    describe("constructor", () => {
        test("defaults to false when no init provided", () => {
            const item = new CheckboxFormItem({ id: "cb1", type: "checkbox" });
            expect(item.value).toBe(false);
        });

        test("parses v:true init value", () => {
            const item = new CheckboxFormItem({ id: "cb1", type: "checkbox", init: "v:true" });
            expect(item.value).toBe(true);
        });

        test("parses v:false init value", () => {
            const item = new CheckboxFormItem({ id: "cb1", type: "checkbox", init: "v:false" });
            expect(item.value).toBe(false);
        });

        test("parses v:TRUE case-insensitively", () => {
            const item = new CheckboxFormItem({ id: "cb1", type: "checkbox", init: "v:TRUE" });
            expect(item.value).toBe(true);
        });

        test("evaluates f: init function", () => {
            const item = new CheckboxFormItem({ id: "cb1", type: "checkbox", init: "f:() => true" });
            expect(item.value).toBe(true);
        });

        test("throws for unsupported type", () => {
            expect(() => new CheckboxFormItem({ id: "cb1", type: "text" as any })).toThrow("Unsupported type");
        });

        test("sets id and type correctly", () => {
            const item = new CheckboxFormItem({ id: "myCheck", type: "checkbox" });
            expect(item.id).toBe("myCheck");
            expect(item.type).toBe("checkbox");
        });
    });

    // ─── getFunctionDefault (via get()) ───

    describe("get", () => {
        test("returns 'true' when value is true and no getFunc", () => {
            const item = new CheckboxFormItem({ id: "cb1", type: "checkbox", init: "v:true" });
            expect(item.get({})).toBe("true");
        });

        test("returns 'false' when value is false and no getFunc", () => {
            const item = new CheckboxFormItem({ id: "cb1", type: "checkbox" });
            expect(item.get({})).toBe("false");
        });

        test("returns literal for v: getFunc", () => {
            const item = new CheckboxFormItem({ id: "cb1", type: "checkbox", get: "v:yes" });
            expect(item.get({})).toBe("yes");
        });
    });

    // ─── assignToForm ───

    describe("assignToForm", () => {
        test("does nothing when no form display is configured", () => {
            const item = new CheckboxFormItem({ id: "cb1", type: "checkbox" });
            // Should not throw
            expect(() => item.assignToForm({} as HTMLElement)).not.toThrow();
        });

        test("does not throw when form display is configured", () => {
            const item = new CheckboxFormItem({
                id: "cb1", type: "checkbox",
                form: { title: "My Checkbox", description: "desc" },
            });
            expect(() => item.assignToForm({} as HTMLElement)).not.toThrow();
        });
    });
});
