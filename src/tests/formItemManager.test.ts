import { FormItemsManager } from "../form/formItemManager";
import { FileNameFormItem, FileLocationFormItem } from "../form/fileFormItem";
import { TextFormItem } from "../form/textFormItem";
import { NumberFormItem } from "../form/numberFormItem";
import { DateFormItem } from "../form/dateFormItem";
import { CheckboxFormItem } from "../form/checkboxFormItem";
import { DropdownFormItem } from "../form/dropdownFormItem";
import { NoteTemplate } from "../template/templateTypes";

jest.mock("moment", () => {
    const fn = (date: any) => ({
        format: (fmt?: string) => "2025-01-15",
    });
    return { __esModule: true, default: fn };
});

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

describe("FormItemsManager", () => {

    describe("getFormItems", () => {
        test("always creates FileNameFormItem and FileLocationFormItem", () => {
            const template: NoteTemplate = {};
            const items = FormItemsManager.getFormItems(template);

            expect(items.length).toBeGreaterThanOrEqual(2);
            expect(items[0]).toBeInstanceOf(FileNameFormItem);
            expect(items[1]).toBeInstanceOf(FileLocationFormItem);
        });

        test("passes file-name getFunc to FileNameFormItem", () => {
            const template: NoteTemplate = { "file-name": "v:MyNote" };
            const items = FormItemsManager.getFormItems(template);
            expect(items[0].get({})).toBe("MyNote");
        });

        test("passes file-location getFunc to FileLocationFormItem", () => {
            const template: NoteTemplate = { "file-location": "v:notes/folder" };
            const items = FormItemsManager.getFormItems(template);
            expect(items[1].get({})).toBe("notes/folder");
        });

        test("creates TextFormItem for text type", () => {
            const template: NoteTemplate = {
                "form-items": [{ id: "t", type: "text" }],
            };
            const items = FormItemsManager.getFormItems(template);
            expect(items[2]).toBeInstanceOf(TextFormItem);
        });

        test("creates TextFormItem for textArea type", () => {
            const template: NoteTemplate = {
                "form-items": [{ id: "t", type: "textArea" }],
            };
            const items = FormItemsManager.getFormItems(template);
            expect(items[2]).toBeInstanceOf(TextFormItem);
        });

        test("creates NumberFormItem for number type", () => {
            const template: NoteTemplate = {
                "form-items": [{ id: "n", type: "number" }],
            };
            const items = FormItemsManager.getFormItems(template);
            expect(items[2]).toBeInstanceOf(NumberFormItem);
        });

        test("creates DateFormItem for date type", () => {
            const template: NoteTemplate = {
                "form-items": [{ id: "d", type: "date" }],
            };
            const items = FormItemsManager.getFormItems(template);
            expect(items[2]).toBeInstanceOf(DateFormItem);
        });

        test("creates DateFormItem for time type", () => {
            const template: NoteTemplate = {
                "form-items": [{ id: "d", type: "time" }],
            };
            const items = FormItemsManager.getFormItems(template);
            expect(items[2]).toBeInstanceOf(DateFormItem);
        });

        test("creates DateFormItem for dateTime type", () => {
            const template: NoteTemplate = {
                "form-items": [{ id: "d", type: "dateTime" }],
            };
            const items = FormItemsManager.getFormItems(template);
            expect(items[2]).toBeInstanceOf(DateFormItem);
        });

        test("creates CheckboxFormItem for checkbox type", () => {
            const template: NoteTemplate = {
                "form-items": [{ id: "c", type: "checkbox" }],
            };
            const items = FormItemsManager.getFormItems(template);
            expect(items[2]).toBeInstanceOf(CheckboxFormItem);
        });

        test("creates DropdownFormItem for dropdown type", () => {
            const template: NoteTemplate = {
                "form-items": [{
                    id: "dd", type: "dropdown",
                    init: 'v:[{"k":"a","v":"A"}]',
                }],
            };
            const items = FormItemsManager.getFormItems(template);
            expect(items[2]).toBeInstanceOf(DropdownFormItem);
        });

        test("handles multiple form items", () => {
            const template: NoteTemplate = {
                "form-items": [
                    { id: "t", type: "text" },
                    { id: "n", type: "number" },
                    { id: "c", type: "checkbox" },
                ],
            };
            const items = FormItemsManager.getFormItems(template);
            // 2 file items + 3 form items
            expect(items.length).toBe(5);
        });

        test("returns only file items when form-items is undefined", () => {
            const template: NoteTemplate = {};
            const items = FormItemsManager.getFormItems(template);
            expect(items.length).toBe(2);
        });

        test("returns only file items when form-items is empty", () => {
            const template: NoteTemplate = { "form-items": [] };
            const items = FormItemsManager.getFormItems(template);
            expect(items.length).toBe(2);
        });
    });
});
