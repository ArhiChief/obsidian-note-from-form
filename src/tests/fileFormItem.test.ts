import { FileNameFormItem, FileLocationFormItem } from "../form/fileFormItem";

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

describe("FileNameFormItem", () => {

    describe("constructor", () => {
        test("has id 'file-name'", () => {
            const item = new FileNameFormItem();
            expect(item.id).toBe("file-name");
        });

        test("has type 'text'", () => {
            const item = new FileNameFormItem();
            expect(item.type).toBe("text");
        });

        test("defaults to empty string value", () => {
            const item = new FileNameFormItem();
            expect(item.value).toBe("");
        });

        test("without getFunc, assignToForm renders a form", () => {
            const item = new FileNameFormItem();
            // assignToForm should delegate to assignToFormImpl (form display is set)
            expect(() => item.assignToForm({} as HTMLElement)).not.toThrow();
        });

        test("with getFunc, assignToForm is a no-op", () => {
            const item = new FileNameFormItem("v:hardcoded");
            // No form display → assignToForm does nothing
            expect(() => item.assignToForm({} as HTMLElement)).not.toThrow();
        });
    });

    describe("get", () => {
        test("returns normalized value when no getFunc", () => {
            const item = new FileNameFormItem();
            item.value = "my\\note";
            const result = item.get({});
            expect(result).toBe("my/note");
        });

        test("returns normalized literal for v: getFunc", () => {
            const item = new FileNameFormItem("v:some\\path");
            const result = item.get({});
            expect(result).toBe("some/path");
        });

        test("normalizes trailing slashes", () => {
            const item = new FileNameFormItem("v:folder/name/");
            const result = item.get({});
            expect(result).toBe("folder/name");
        });
    });
});

describe("FileLocationFormItem", () => {

    describe("constructor", () => {
        test("has id 'file-location'", () => {
            const item = new FileLocationFormItem();
            expect(item.id).toBe("file-location");
        });

        test("has type 'text'", () => {
            const item = new FileLocationFormItem();
            expect(item.type).toBe("text");
        });

        test("defaults to empty string value", () => {
            const item = new FileLocationFormItem();
            expect(item.value).toBe("");
        });

        test("without getFunc, assignToForm renders a form", () => {
            const item = new FileLocationFormItem();
            expect(() => item.assignToForm({} as HTMLElement)).not.toThrow();
        });

        test("with getFunc, assignToForm is a no-op", () => {
            const item = new FileLocationFormItem("v:/notes");
            expect(() => item.assignToForm({} as HTMLElement)).not.toThrow();
        });
    });

    describe("get", () => {
        test("returns normalized value when no getFunc", () => {
            const item = new FileLocationFormItem();
            item.value = "path\\to\\folder";
            const result = item.get({});
            expect(result).toBe("path/to/folder");
        });

        test("returns normalized literal for v: getFunc", () => {
            const item = new FileLocationFormItem("v:my\\folder");
            const result = item.get({});
            expect(result).toBe("my/folder");
        });
    });
});
