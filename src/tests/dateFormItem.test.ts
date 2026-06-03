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
        'setValue', 'onChange', 'setPlaceholder', 'addOptions'];
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

describe("DateFormItem", () => {

    // ─── constructor ───

    describe("constructor", () => {
        test("defaults to current date when no init provided", () => {
            const before = Date.now();
            const item = new DateFormItem({ id: "d1", type: "date" });
            const after = Date.now();
            expect(item.value.getTime()).toBeGreaterThanOrEqual(before);
            expect(item.value.getTime()).toBeLessThanOrEqual(after);
        });

        test("parses v: date init value", () => {
            const item = new DateFormItem({ id: "d1", type: "date", init: "v:2025-01-15" });
            expect(item.value.getFullYear()).toBe(2025);
            expect(item.value.getMonth()).toBe(0);
            expect(item.value.getDate()).toBe(15);
        });

        test("throws for invalid v: date init value", () => {
            expect(() => new DateFormItem({ id: "d1", type: "date", init: "v:not-a-date" }))
                .toThrow("Invalid date init value");
        });

        test("evaluates f: init function", () => {
            const item = new DateFormItem({
                id: "d1", type: "date",
                init: "f:() => new Date(2025, 0, 1)",
            });
            expect(item.value.getFullYear()).toBe(2025);
        });

        test("accepts date type", () => {
            expect(() => new DateFormItem({ id: "d1", type: "date" })).not.toThrow();
        });

        test("accepts time type", () => {
            expect(() => new DateFormItem({ id: "d1", type: "time" })).not.toThrow();
        });

        test("accepts dateTime type", () => {
            expect(() => new DateFormItem({ id: "d1", type: "dateTime" })).not.toThrow();
        });

        test("throws for unsupported type", () => {
            expect(() => new DateFormItem({ id: "d1", type: "text" as any }))
                .toThrow("Unsupported type");
        });

        test("sets id and type correctly", () => {
            const item = new DateFormItem({ id: "myDate", type: "time" });
            expect(item.id).toBe("myDate");
            expect(item.type).toBe("time");
        });
    });

    // ─── get ───

    describe("get", () => {
        test("returns formatted date for date type (no getFunc)", () => {
            const item = new DateFormItem({ id: "d1", type: "date", init: "v:2025-01-15" });
            expect(item.get({})).toBe("01/15/2025");
        });

        test("returns formatted time for time type (no getFunc)", () => {
            const item = new DateFormItem({ id: "d1", type: "time", init: "v:2025-01-15T14:30:45" });
            expect(item.get({})).toBe("2:30:45 PM");
        });

        test("returns formatted dateTime for dateTime type (no getFunc)", () => {
            const item = new DateFormItem({ id: "d1", type: "dateTime", init: "v:2025-01-15T14:30:45" });
            expect(item.get({})).toBe("2025-01-15T14:30:45Z");
        });

        test("returns literal for v: getFunc", () => {
            const item = new DateFormItem({ id: "d1", type: "date", get: "v:custom-date" });
            expect(item.get({})).toBe("custom-date");
        });

        test("formats date with moment when template has no mustache expressions", () => {
            const item = new DateFormItem({ id: "d1", type: "date", get: "t:L", init: "v:2025-01-15" });
            expect(item.get({})).toBe("01/15/2025");
        });

        test("formats time with moment when template has no mustache expressions", () => {
            const item = new DateFormItem({ id: "d1", type: "time", get: "t:LTS", init: "v:2025-01-15T14:30:45" });
            expect(item.get({})).toBe("2:30:45 PM");
        });

        test("delegates to Mustache when template contains mustache expressions", () => {
            const item = new DateFormItem({ id: "d1", type: "date", get: "t:{{label}}", init: "v:2025-01-15" });
            expect(item.get({ label: "Jan 15" })).toBe("Jan 15");
        });

        test("delegates to Mustache for mixed mustache and text", () => {
            const item = new DateFormItem({ id: "d1", type: "date", get: "t:Date: {{label}}", init: "v:2025-01-15" });
            expect(item.get({ label: "2025" })).toBe("Date: 2025");
        });
    });

    // ─── assignToForm ───

    describe("assignToForm", () => {
        test("does nothing when no form display is configured", () => {
            const item = new DateFormItem({ id: "d1", type: "date" });
            expect(() => item.assignToForm({} as HTMLElement)).not.toThrow();
        });

        test("does not throw for date type with form", () => {
            const item = new DateFormItem({
                id: "d1", type: "date",
                form: { title: "Pick a date" },
            });
            expect(() => item.assignToForm({} as HTMLElement)).not.toThrow();
        });

        test("does not throw for time type with form", () => {
            const item = new DateFormItem({
                id: "d1", type: "time",
                form: { title: "Pick a time" },
            });
            expect(() => item.assignToForm({} as HTMLElement)).not.toThrow();
        });

        test("does not throw for dateTime type with form", () => {
            const item = new DateFormItem({
                id: "d1", type: "dateTime",
                form: { title: "Pick date and time" },
            });
            expect(() => item.assignToForm({} as HTMLElement)).not.toThrow();
        });
    });
});
