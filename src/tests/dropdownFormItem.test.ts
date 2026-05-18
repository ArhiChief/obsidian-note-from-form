import { DropdownFormItem } from "../form/dropdownFormItem";

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

describe("DropdownFormItem", () => {

    const twoOptions = 'v:[{"k":"a","v":"Alpha"},{"k":"b","v":"Beta"}]' as const;
    const withSelected = 'v:[{"k":"a","v":"Alpha"},{"k":"b","v":"Beta","s":true}]' as const;

    // ─── constructor ───

    describe("constructor", () => {
        test("parses v: JSON init and selects first option by default", () => {
            const item = new DropdownFormItem({ id: "dd1", type: "dropdown", init: twoOptions });
            expect(item.value).toEqual([{ k: "a", v: "Alpha" }]);
        });

        test("selects option marked with s:true", () => {
            const item = new DropdownFormItem({ id: "dd1", type: "dropdown", init: withSelected });
            expect(item.value).toEqual([{ k: "b", v: "Beta" }]);
        });

        test("evaluates f: init function", () => {
            const item = new DropdownFormItem({
                id: "dd1", type: "dropdown",
                init: 'f:() => [{"k":"x","v":"X-ray"}]',
            });
            expect(item.value).toEqual([{ k: "x", v: "X-ray" }]);
        });

        test("throws when no init is provided", () => {
            expect(() => new DropdownFormItem({ id: "dd1", type: "dropdown" }))
                .toThrow("Default value is not supported");
        });

        test("throws for empty array init", () => {
            expect(() => new DropdownFormItem({ id: "dd1", type: "dropdown", init: "v:[]" }))
                .toThrow("Init value can't be empty");
        });

        test("throws for unsupported type", () => {
            expect(() => new DropdownFormItem({ id: "dd1", type: "text" as any, init: twoOptions }))
                .toThrow("Unsupported type");
        });

        test("sets id and type correctly", () => {
            const item = new DropdownFormItem({ id: "myDd", type: "dropdown", init: twoOptions });
            expect(item.id).toBe("myDd");
            expect(item.type).toBe("dropdown");
        });
    });

    // ─── get ───

    describe("get", () => {
        test("returns selected option value when no getFunc", () => {
            const item = new DropdownFormItem({ id: "dd1", type: "dropdown", init: twoOptions });
            expect(item.get({})).toBe("Alpha");
        });

        test("returns selected value when s:true option", () => {
            const item = new DropdownFormItem({ id: "dd1", type: "dropdown", init: withSelected });
            expect(item.get({})).toBe("Beta");
        });

        test("returns literal for v: getFunc", () => {
            const item = new DropdownFormItem({
                id: "dd1", type: "dropdown", init: twoOptions, get: "v:override",
            });
            expect(item.get({})).toBe("override");
        });
    });

    // ─── assignToForm ───

    describe("assignToForm", () => {
        test("does nothing when no form display is configured", () => {
            const item = new DropdownFormItem({ id: "dd1", type: "dropdown", init: twoOptions });
            expect(() => item.assignToForm({} as HTMLElement)).not.toThrow();
        });

        test("does not throw when form display is configured", () => {
            const item = new DropdownFormItem({
                id: "dd1", type: "dropdown", init: twoOptions,
                form: { title: "Pick one" },
            });
            expect(() => item.assignToForm({} as HTMLElement)).not.toThrow();
        });
    });
});
