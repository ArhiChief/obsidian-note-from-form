import { FormItemsManager } from "../form/formItemManager";
import { FileNameFormItem, FileLocationFormItem } from "../form/fileFormItem";
import { TextFormItem } from "../form/textFormItem";
import { NumberFormItem } from "../form/numberFormItem";
import { DateTimeFormItem } from "../form/dateTimeFormItem";
import { CheckboxFormItem } from "../form/checkboxFormItem";
import { DropdownFormItem } from "../form/dropdownFormItem";
import { NoteTemplate } from "../template/templateTypes";
import { NoteFromFormPluginSettings } from "../pluginSettings";
import { FormItemFunctionProcessor } from "../form/formItemFunctionProcessor";

const mockSettings: NoteFromFormPluginSettings = {
    templatesFolderLocation: "/",
    templatePropertyName: "note-from-form",
    defaultOutputDir: "/",
};

const mockFunctionProcessor = {
    renderMustacheTemplate: jest.fn((t: string, v: any) => t),
    executeFunction: jest.fn((f: string) => eval(`(${f})()`)),
    executeFunctionWithParam: jest.fn((f: string, ...args: any[]) => eval(`(${f})`).apply(null, args)),
    executeRefFunction: jest.fn(),
    executeRefFunctionWithParam: jest.fn(),
} as unknown as FormItemFunctionProcessor;

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
        test("always creates FileNameFormItem and FileLocationFormItem", async () => {
            const template: NoteTemplate = {};
            const items = await FormItemsManager.getFormItems(template, mockFunctionProcessor, mockSettings);

            expect(items.length).toBeGreaterThanOrEqual(2);
            expect(items[0]).toBeInstanceOf(FileNameFormItem);
            expect(items[1]).toBeInstanceOf(FileLocationFormItem);
        });

        test("passes file-name getFunc to FileNameFormItem", async () => {
            const template: NoteTemplate = { "file-name": "v:MyNote" };
            const items = await FormItemsManager.getFormItems(template, mockFunctionProcessor, mockSettings);
            expect(items[0].get({})).toBe("MyNote");
        });

        test("passes file-location getFunc to FileLocationFormItem", async () => {
            const template: NoteTemplate = { "file-location": "v:notes/folder" };
            const items = await FormItemsManager.getFormItems(template, mockFunctionProcessor, mockSettings);
            expect(items[1].get({})).toBe("notes/folder");
        });

        test("creates TextFormItem for text type", async () => {
            const template: NoteTemplate = {
                "form-items": [{ id: "t", type: "text" }],
            };
            const items = await FormItemsManager.getFormItems(template, mockFunctionProcessor, mockSettings);
            expect(items[2]).toBeInstanceOf(TextFormItem);
        });

        test("creates TextFormItem for textArea type", async () => {
            const template: NoteTemplate = {
                "form-items": [{ id: "t", type: "textArea" }],
            };
            const items = await FormItemsManager.getFormItems(template, mockFunctionProcessor, mockSettings);
            expect(items[2]).toBeInstanceOf(TextFormItem);
        });

        test("creates NumberFormItem for number type", async () => {
            const template: NoteTemplate = {
                "form-items": [{ id: "n", type: "number" }],
            };
            const items = await FormItemsManager.getFormItems(template, mockFunctionProcessor, mockSettings);
            expect(items[2]).toBeInstanceOf(NumberFormItem);
        });

        test("creates DateTimeFormItem for date type", async () => {
            const template: NoteTemplate = {
                "form-items": [{ id: "d", type: "date" }],
            };
            const items = await FormItemsManager.getFormItems(template, mockFunctionProcessor, mockSettings);
            expect(items[2]).toBeInstanceOf(DateTimeFormItem);
        });

        test("creates DateTimeFormItem for time type", async () => {
            const template: NoteTemplate = {
                "form-items": [{ id: "d", type: "time" }],
            };
            const items = await FormItemsManager.getFormItems(template, mockFunctionProcessor, mockSettings);
            expect(items[2]).toBeInstanceOf(DateTimeFormItem);
        });

        test("creates DateTimeFormItem for dateTime type", async () => {
            const template: NoteTemplate = {
                "form-items": [{ id: "d", type: "dateTime" }],
            };
            const items = await FormItemsManager.getFormItems(template, mockFunctionProcessor, mockSettings);
            expect(items[2]).toBeInstanceOf(DateTimeFormItem);
        });

        test("creates CheckboxFormItem for checkbox type", async () => {
            const template: NoteTemplate = {
                "form-items": [{ id: "c", type: "checkbox" }],
            };
            const items = await FormItemsManager.getFormItems(template, mockFunctionProcessor, mockSettings);
            expect(items[2]).toBeInstanceOf(CheckboxFormItem);
        });

        test("creates DropdownFormItem for dropdown type", async () => {
            const template: NoteTemplate = {
                "form-items": [{
                    id: "dd", type: "dropdown",
                    init: 'v:[{"k":"a","v":"A"}]',
                }],
            };
            const items = await FormItemsManager.getFormItems(template, mockFunctionProcessor, mockSettings);
            expect(items[2]).toBeInstanceOf(DropdownFormItem);
        });

        test("handles multiple form items", async () => {
            const template: NoteTemplate = {
                "form-items": [
                    { id: "t", type: "text" },
                    { id: "n", type: "number" },
                    { id: "c", type: "checkbox" },
                ],
            };
            const items = await FormItemsManager.getFormItems(template, mockFunctionProcessor, mockSettings);
            // 2 file items + 3 form items
            expect(items.length).toBe(5);
        });

        test("returns only file items when form-items is undefined", async () => {
            const template: NoteTemplate = {};
            const items = await FormItemsManager.getFormItems(template, mockFunctionProcessor, mockSettings);
            expect(items.length).toBe(2);
        });

        test("returns only file items when form-items is empty", async () => {
            const template: NoteTemplate = { "form-items": [] };
            const items = await FormItemsManager.getFormItems(template, mockFunctionProcessor, mockSettings);
            expect(items.length).toBe(2);
        });
    });

    describe("getViewModel", () => {
        test("returns empty result for file-only items with no values", async () => {
            const template: NoteTemplate = {};
            const items = await FormItemsManager.getFormItems(template, mockFunctionProcessor, mockSettings);
            // file items have no user input, default get returns value (empty string)
            const vm = FormItemsManager.getViewModel(items);
            expect(vm["file-name"]).toBeDefined();
            expect(vm["file-location"]).toBeDefined();
        });

        test("includes form item values in view model", async () => {
            const template: NoteTemplate = {
                "form-items": [
                    { id: "t1", type: "text" },
                    { id: "t2", type: "text" },
                ],
            };
            const items = await FormItemsManager.getFormItems(template, mockFunctionProcessor, mockSettings);
            items[2].value = "hello";
            items[3].value = "world";

            const vm = FormItemsManager.getViewModel(items);
            expect(vm["t1"]).toBe("hello");
            expect(vm["t2"]).toBe("world");
        });

        test("resolves value-string get functions", async () => {
            const template: NoteTemplate = {
                "form-items": [
                    { id: "t", type: "text", get: "v:static-value" },
                ],
            };
            const items = await FormItemsManager.getFormItems(template, mockFunctionProcessor, mockSettings);
            const vm = FormItemsManager.getViewModel(items);
            expect(vm["t"]).toBe("static-value");
        });

        test("excludes file-name and file-location from intermediate view but includes in result", async () => {
            const template: NoteTemplate = {
                "file-name": "v:MyNote",
                "file-location": "v:notes",
                "form-items": [
                    { id: "title", type: "text" },
                ],
            };
            const items = await FormItemsManager.getFormItems(template, mockFunctionProcessor, mockSettings);
            items[2].value = "Test Title";

            const vm = FormItemsManager.getViewModel(items);
            expect(vm["title"]).toBe("Test Title");
            expect(vm["file-name"]).toBe("MyNote");
            expect(vm["file-location"]).toBe("notes");
        });

        test("resolves file-name after form items", async () => {
            const template: NoteTemplate = {
                "file-name": "v:NoteName",
                "form-items": [
                    { id: "t", type: "text" },
                ],
            };
            const items = await FormItemsManager.getFormItems(template, mockFunctionProcessor, mockSettings);
            items[2].value = "value";

            const vm = FormItemsManager.getViewModel(items);
            // file-name is resolved after form items
            expect(vm["file-name"]).toBe("NoteName");
            expect(vm["t"]).toBe("value");
        });

        test("handles number form item values", async () => {
            const template: NoteTemplate = {
                "form-items": [
                    { id: "n", type: "number" },
                ],
            };
            const items = await FormItemsManager.getFormItems(template, mockFunctionProcessor, mockSettings);
            items[2].value = 42;

            const vm = FormItemsManager.getViewModel(items);
            expect(vm["n"]).toBe("42");
        });

        test("handles checkbox form item values", async () => {
            const template: NoteTemplate = {
                "form-items": [
                    { id: "c", type: "checkbox" },
                ],
            };
            const items = await FormItemsManager.getFormItems(template, mockFunctionProcessor, mockSettings);
            items[2].value = true;

            const vm = FormItemsManager.getViewModel(items);
            expect(vm["c"]).toBeDefined();
        });

        test("handles mixed form item types", async () => {
            const template: NoteTemplate = {
                "file-name": "v:TestNote",
                "form-items": [
                    { id: "t", type: "text" },
                    { id: "n", type: "number" },
                    { id: "c", type: "checkbox" },
                ],
            };
            const items = await FormItemsManager.getFormItems(template, mockFunctionProcessor, mockSettings);
            items[2].value = "text-val";
            items[3].value = 7;
            items[4].value = true;

            const vm = FormItemsManager.getViewModel(items);
            expect(vm["t"]).toBe("text-val");
            expect(vm["n"]).toBeDefined();
            expect(vm["c"]).toBeDefined();
            expect(vm["file-name"]).toBe("TestNote");
        });

        test("returns only file items in view model when no form items", async () => {
            const template: NoteTemplate = {
                "file-name": "v:OnlyFile",
            };
            const items = await FormItemsManager.getFormItems(template, mockFunctionProcessor, mockSettings);
            const vm = FormItemsManager.getViewModel(items);

            expect(Object.keys(vm)).toEqual(
                expect.arrayContaining(["file-name", "file-location"])
            );
            expect(Object.keys(vm).length).toBe(2);
        });
    });
});
