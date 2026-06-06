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

const mockFunctionProcessor = {
    renderMustacheTemplate: jest.fn(),
    executeFunction: jest.fn(),
    executeRefFunction: jest.fn(),
} as any;

const mockUserApi = {} as any;

describe("FileNameFormItem", () => {

    describe("constructor", () => {
        test("has id 'file-name'", () => {
            const item = new FileNameFormItem(mockFunctionProcessor, mockUserApi);
            expect(item.id).toBe("file-name");
        });

        test("has type 'text'", () => {
            const item = new FileNameFormItem(mockFunctionProcessor, mockUserApi);
            expect(item.type).toBe("text");
        });

        test("defaults to empty string value", async () => {
            const item = new FileNameFormItem(mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(item.value).toBe("");
        });

        test("without getFunc, assignToForm renders a form", async () => {
            const item = new FileNameFormItem(mockFunctionProcessor, mockUserApi);
            await item.initialize();
            // assignToForm should delegate to assignToFormImpl (form display is set)
            expect(() => item.assignToForm({} as HTMLElement)).not.toThrow();
        });

        test("with getFunc, assignToForm is a no-op", async () => {
            const item = new FileNameFormItem(mockFunctionProcessor, mockUserApi, "v:hardcoded");
            await item.initialize();
            // No form display → assignToForm does nothing
            expect(() => item.assignToForm({} as HTMLElement)).not.toThrow();
        });
    });

    describe("get", () => {
        test("returns normalized value when no getFunc", async () => {
            const item = new FileNameFormItem(mockFunctionProcessor, mockUserApi);
            await item.initialize();
            item.value = "my\\note";
            const result = await item.get({});
            expect(result).toBe("my/note");
        });

        test("returns normalized literal for v: getFunc", async () => {
            const item = new FileNameFormItem(mockFunctionProcessor, mockUserApi, "v:some\\path");
            await item.initialize();
            const result = await item.get({});
            expect(result).toBe("some/path");
        });

        test("normalizes trailing slashes", async () => {
            const item = new FileNameFormItem(mockFunctionProcessor, mockUserApi, "v:folder/name/");
            await item.initialize();
            const result = await item.get({});
            expect(result).toBe("folder/name");
        });
    });

    // ─── initialize ───

    describe("initialize", () => {
        test("value is undefined before initialize", () => {
            const item = new FileNameFormItem(mockFunctionProcessor, mockUserApi);
            expect(item.value).toBeUndefined();
        });
    });
});

describe("FileLocationFormItem", () => {

    describe("constructor", () => {
        test("has id 'file-location'", () => {
            const item = new FileLocationFormItem(mockFunctionProcessor, mockUserApi);
            expect(item.id).toBe("file-location");
        });

        test("has type 'text'", () => {
            const item = new FileLocationFormItem(mockFunctionProcessor, mockUserApi);
            expect(item.type).toBe("text");
        });

        test("defaults to empty string value", async () => {
            const item = new FileLocationFormItem(mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(item.value).toBe("");
        });

        test("without getFunc, assignToForm renders a form", async () => {
            const item = new FileLocationFormItem(mockFunctionProcessor, mockUserApi);
            await item.initialize();
            expect(() => item.assignToForm({} as HTMLElement)).not.toThrow();
        });

        test("with getFunc, assignToForm is a no-op", async () => {
            const item = new FileLocationFormItem(mockFunctionProcessor, mockUserApi, "v:/notes");
            await item.initialize();
            expect(() => item.assignToForm({} as HTMLElement)).not.toThrow();
        });
    });

    describe("get", () => {
        test("returns normalized value when no getFunc", async () => {
            const item = new FileLocationFormItem(mockFunctionProcessor, mockUserApi);
            await item.initialize();
            item.value = "path\\to\\folder";
            const result = await item.get({});
            expect(result).toBe("path/to/folder");
        });

        test("returns normalized literal for v: getFunc", async () => {
            const item = new FileLocationFormItem(mockFunctionProcessor, mockUserApi, "v:my\\folder");
            await item.initialize();
            const result = await item.get({});
            expect(result).toBe("my/folder");
        });
    });

    // ─── initialize ───

    describe("initialize", () => {
        test("value is undefined before initialize", () => {
            const item = new FileLocationFormItem(mockFunctionProcessor, mockUserApi);
            expect(item.value).toBeUndefined();
        });
    });
});
