import { TFile, TFolder } from 'obsidian';
import { TemplateProcessor } from '../template/templateProcessor';
import { NoteFromFormPluginSettings, TEMPLATE_PROPERTY_NAME } from '../pluginSettings';
import { TemplateIndexItem } from '../template/templateIndex';
import { FormItem } from '../form/formItem';
import { FormItemFunctionProcessor } from '../form/formItemFunctionProcessor';

// ── mocks ──

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

let capturedModalCallback: ((items: FormItem[], indexedTemplate: TemplateIndexItem) => Promise<boolean>) | null = null;

jest.mock("src/ui/inputFormModal", () => ({
    InputFormModal: jest.fn().mockImplementation((_app: any, _tpl: any, _items: any, callback: any) => {
        capturedModalCallback = callback;
        return { open: jest.fn() };
    }),
}));

// ── helpers ──

function defaultSettings(overrides: Partial<NoteFromFormPluginSettings> = {}): NoteFromFormPluginSettings {
    return {
        templatesFolderLocation: 'templates',
        templatePropertyName: TEMPLATE_PROPERTY_NAME,
        defaultOutputDir: '',
        ...overrides,
    };
}

function createFile(path: string): TFile {
    const file = new TFile();
    file.path = path;
    return file;
}

function createFolder(path: string): TFolder {
    const folder = new TFolder();
    folder.path = path;
    return folder;
}

function createIndexedTemplate(path: string, label: string): TemplateIndexItem {
    return { file: createFile(path), label };
}

function createMockApp(options: {
    processFrontMatter?: jest.Mock;
    getFolderByPath?: jest.Mock;
    createFolder?: jest.Mock;
    copy?: jest.Mock;
    process?: jest.Mock;
} = {}) {
    return {
        fileManager: {
            processFrontMatter: options.processFrontMatter ?? jest.fn().mockResolvedValue(undefined),
        },
        vault: {
            getFolderByPath: options.getFolderByPath ?? jest.fn().mockReturnValue(null),
            createFolder: options.createFolder ?? jest.fn().mockImplementation(async (path: string) => {
                const folder = createFolder(path);
                return folder;
            }),
            copy: options.copy ?? jest.fn().mockImplementation(async (_src: TFile, newPath: string) => {
                return createFile(newPath);
            }),
            process: options.process ?? jest.fn().mockResolvedValue(undefined),
        },
    } as any;
}

// ── tests ──

describe("TemplateProcessor", () => {

    beforeEach(() => {
        capturedModalCallback = null;
    });

    describe("useTemplate", () => {
        test("throws when frontmatter property is null", async () => {
            const processFrontMatter = jest.fn().mockImplementation(async (_file: TFile, fn: (fm: any) => void) => {
                fn({});
            });
            const app = createMockApp({ processFrontMatter });
            const settings = defaultSettings();
            const processor = new TemplateProcessor(app, settings);

            const indexed = createIndexedTemplate('templates/note.md', 'note');
            await expect(processor.useTemplate(indexed)).rejects.toThrow('No template found in "templates/note.md"');

            expect(capturedModalCallback).toBeNull();
        });

        test("throws when JSON string is malformed", async () => {
            const processFrontMatter = jest.fn().mockImplementation(async (_file: TFile, fn: (fm: any) => void) => {
                fn({ [TEMPLATE_PROPERTY_NAME]: '{ invalid json' });
            });
            const app = createMockApp({ processFrontMatter });
            const settings = defaultSettings();
            const processor = new TemplateProcessor(app, settings);

            const indexed = createIndexedTemplate('templates/note.md', 'note');
            await expect(processor.useTemplate(indexed)).rejects.toThrow('Error parsing template in "templates/note.md"');
        });

        test("throws on invalid template data", async () => {
            const processFrontMatter = jest.fn().mockImplementation(async (_file: TFile, fn: (fm: any) => void) => {
                fn({ [TEMPLATE_PROPERTY_NAME]: { "form-items": [{ bad: true }] } });
            });
            const app = createMockApp({ processFrontMatter });
            const settings = defaultSettings();
            const processor = new TemplateProcessor(app, settings);

            const indexed = createIndexedTemplate('templates/note.md', 'note');
            await expect(processor.useTemplate(indexed)).rejects.toThrow('Invalid template');
        });

        test("parses JSON string template data", async () => {
            const templateObj = { "form-items": [] };
            const processFrontMatter = jest.fn().mockImplementation(async (_file: TFile, fn: (fm: any) => void) => {
                fn({ [TEMPLATE_PROPERTY_NAME]: JSON.stringify(templateObj) });
            });
            const app = createMockApp({ processFrontMatter });
            const settings = defaultSettings();
            const processor = new TemplateProcessor(app, settings);

            const indexed = createIndexedTemplate('templates/note.md', 'note');
            await processor.useTemplate(indexed);

            expect(capturedModalCallback).not.toBeNull();
        });

        test("accepts object template data directly", async () => {
            const processFrontMatter = jest.fn().mockImplementation(async (_file: TFile, fn: (fm: any) => void) => {
                fn({ [TEMPLATE_PROPERTY_NAME]: { "form-items": [] } });
            });
            const app = createMockApp({ processFrontMatter });
            const settings = defaultSettings();
            const processor = new TemplateProcessor(app, settings);

            const indexed = createIndexedTemplate('templates/note.md', 'note');
            await processor.useTemplate(indexed);

            expect(capturedModalCallback).not.toBeNull();
        });

        test("creates form items and opens modal for valid template", async () => {
            const { InputFormModal } = require("src/ui/inputFormModal");
            const processFrontMatter = jest.fn().mockImplementation(async (_file: TFile, fn: (fm: any) => void) => {
                fn({
                    [TEMPLATE_PROPERTY_NAME]: {
                        "form-items": [{ id: "title", type: "text" }],
                    },
                });
            });
            const app = createMockApp({ processFrontMatter });
            const settings = defaultSettings();
            const processor = new TemplateProcessor(app, settings);

            const indexed = createIndexedTemplate('templates/note.md', 'note');
            await processor.useTemplate(indexed);

            expect(InputFormModal).toHaveBeenCalledWith(
                app,
                indexed,
                expect.any(Array),
                expect.any(Function),
            );
        });

        test("uses custom template property name from settings", async () => {
            const customProp = "my-custom-template";
            const processFrontMatter = jest.fn().mockImplementation(async (_file: TFile, fn: (fm: any) => void) => {
                fn({ [customProp]: {} });
            });
            const app = createMockApp({ processFrontMatter });
            const settings = defaultSettings({ templatePropertyName: customProp });
            const processor = new TemplateProcessor(app, settings);

            const indexed = createIndexedTemplate('templates/note.md', 'note');
            await processor.useTemplate(indexed);

            expect(capturedModalCallback).not.toBeNull();
        });
    });

    describe("createNoteFromTemplate (via callback)", () => {

        async function setupAndGetCallback(templateObj: any, appOverrides: Parameters<typeof createMockApp>[0] = {}) {
            const processFrontMatter = appOverrides.processFrontMatter ?? jest.fn().mockImplementation(async (_file: TFile, fn: (fm: any) => void) => {
                fn({ [TEMPLATE_PROPERTY_NAME]: templateObj });
            });
            const app = createMockApp({ processFrontMatter, ...appOverrides });
            const settings = defaultSettings();
            const processor = new TemplateProcessor(app, settings);

            const indexed = createIndexedTemplate('templates/note.md', 'note');
            await processor.useTemplate(indexed);

            return { app, indexed, callback: capturedModalCallback! };
        }

        test("creates folder, copies note, sanitizes, and applies view model", async () => {
            const template = {
                "file-name": "v:MyNote" as const,
                "file-location": "v:/output" as const,
                "form-items": [{ id: "t", type: "text" as const }],
            };
            const folder = createFolder('/output');
            const getFolderByPath = jest.fn().mockReturnValue(folder);
            const copy = jest.fn().mockImplementation(async (_src: TFile, newPath: string) => createFile(newPath));
            const processFrontMatter = jest.fn().mockImplementation(async (file: TFile, fn: (fm: any) => void) => {
                if (file.path === 'templates/note.md') {
                    fn({ [TEMPLATE_PROPERTY_NAME]: template });
                } else {
                    fn({ [TEMPLATE_PROPERTY_NAME]: "something" });
                }
            });
            const process = jest.fn().mockResolvedValue(undefined);

            const { callback, indexed } = await setupAndGetCallback(
                template,
                { getFolderByPath, copy, processFrontMatter, process },
            );

            const { FormItemsManager } = require("../form/formItemManager");
            const formItems = await FormItemsManager.getFormItems(template, mockFunctionProcessor, defaultSettings());
            formItems[2].value = "hello";

            const result = await callback(formItems, indexed);

            expect(result).toBe(true);
            expect(getFolderByPath).toHaveBeenCalledWith("/output");
            expect(copy).toHaveBeenCalledWith(indexed.file, "/output/MyNote.md");
            expect(process).toHaveBeenCalled();
        });

        test("creates folder when it does not exist", async () => {
            const template = {
                "file-name": "v:Note" as const,
                "file-location": "v:/new-folder" as const,
            };
            const getFolderByPath = jest.fn().mockReturnValue(null);
            const newFolder = createFolder('/new-folder');
            const createFolderMock = jest.fn().mockResolvedValue(newFolder);
            const copy = jest.fn().mockImplementation(async (_src: TFile, newPath: string) => createFile(newPath));
            const processFrontMatter = jest.fn().mockImplementation(async (file: TFile, fn: (fm: any) => void) => {
                if (file.path === 'templates/note.md') {
                    fn({ [TEMPLATE_PROPERTY_NAME]: template });
                } else {
                    fn({});
                }
            });
            const process = jest.fn().mockResolvedValue(undefined);

            const { callback, indexed } = await setupAndGetCallback(
                template,
                { getFolderByPath, createFolder: createFolderMock, copy, processFrontMatter, process },
            );

            const { FormItemsManager } = require("../form/formItemManager");
            const formItems = await FormItemsManager.getFormItems(template, mockFunctionProcessor, defaultSettings());

            const result = await callback(formItems, indexed);

            expect(result).toBe(true);
            expect(createFolderMock).toHaveBeenCalledWith("/new-folder");
        });

        test("uses existing folder when it exists", async () => {
            const existingFolder = createFolder('existing');
            const getFolderByPath = jest.fn().mockReturnValue(existingFolder);
            const createFolderMock = jest.fn();
            const copy = jest.fn().mockImplementation(async (_src: TFile, newPath: string) => createFile(newPath));
            const processFrontMatter = jest.fn().mockImplementation(async (file: TFile, fn: (fm: any) => void) => {
                if (file.path === 'templates/note.md') {
                    fn({ [TEMPLATE_PROPERTY_NAME]: {} });
                } else {
                    fn({});
                }
            });
            const process = jest.fn().mockResolvedValue(undefined);

            const { callback, indexed } = await setupAndGetCallback(
                {},
                { getFolderByPath, createFolder: createFolderMock, copy, processFrontMatter, process },
            );

            const { FormItemsManager } = require("../form/formItemManager");
            const formItems = await FormItemsManager.getFormItems({}, mockFunctionProcessor, defaultSettings());
            formItems[0].value = "Note";
            formItems[1].value = "existing";

            await callback(formItems, indexed);

            expect(createFolderMock).not.toHaveBeenCalled();
        });

        test("sanitizes new note by removing template property from frontmatter", async () => {
            const capturedFrontmatters: any[] = [];
            const folder = createFolder('out');
            const getFolderByPath = jest.fn().mockReturnValue(folder);
            const copy = jest.fn().mockImplementation(async (_src: TFile, newPath: string) => createFile(newPath));
            const processFrontMatter = jest.fn().mockImplementation(async (file: TFile, fn: (fm: any) => void) => {
                if (file.path === 'templates/note.md') {
                    fn({ [TEMPLATE_PROPERTY_NAME]: {} });
                } else {
                    const fm = { [TEMPLATE_PROPERTY_NAME]: "should-be-deleted", other: "keep" };
                    fn(fm);
                    capturedFrontmatters.push({ ...fm });
                }
            });
            const process = jest.fn().mockResolvedValue(undefined);

            const { callback, indexed } = await setupAndGetCallback(
                {},
                { getFolderByPath, copy, processFrontMatter, process },
            );

            const { FormItemsManager } = require("../form/formItemManager");
            const formItems = await FormItemsManager.getFormItems({}, mockFunctionProcessor, defaultSettings());
            formItems[0].value = "Note";
            formItems[1].value = "out";

            await callback(formItems, indexed);

            // The frontmatter callback should have deleted the template property
            expect(capturedFrontmatters.length).toBe(1);
            expect(capturedFrontmatters[0]).not.toHaveProperty(TEMPLATE_PROPERTY_NAME);
            expect(capturedFrontmatters[0]).toHaveProperty("other", "keep");
        });

        test("sanitizes new note by removing code blocks with template property name", async () => {
            const folder = createFolder('out');
            const getFolderByPath = jest.fn().mockReturnValue(folder);
            const copy = jest.fn().mockImplementation(async (_src: TFile, newPath: string) => createFile(newPath));
            const processFrontMatter = jest.fn().mockImplementation(async (file: TFile, fn: (fm: any) => void) => {
                if (file.path === 'templates/note.md') {
                    fn({ [TEMPLATE_PROPERTY_NAME]: {} });
                } else {
                    fn({});
                }
            });
            let sanitizedContent: string | null = null;
            let processCallCount = 0;
            const process = jest.fn().mockImplementation(async (_file: TFile, cb: (content: string) => string) => {
                processCallCount++;
                if (processCallCount === 1) {
                    // sanitizeNewNote call
                    const input = [
                        "# My Note",
                        "",
                        "Some content.",
                        "",
                        "```js:" + TEMPLATE_PROPERTY_NAME + ":myInit",
                        "() => 'default'",
                        "```",
                        "",
                        "More content.",
                        "",
                        "```js:" + TEMPLATE_PROPERTY_NAME + ":getTitle",
                        "(view) => view.title",
                        "```",
                        "",
                        "End of note.",
                    ].join("\n");
                    sanitizedContent = cb(input);
                }
            });

            const { callback, indexed } = await setupAndGetCallback(
                {},
                { getFolderByPath, copy, processFrontMatter, process },
            );

            const { FormItemsManager } = require("../form/formItemManager");
            const formItems = await FormItemsManager.getFormItems({}, mockFunctionProcessor, defaultSettings());
            formItems[0].value = "Note";
            formItems[1].value = "out";

            await callback(formItems, indexed);

            expect(sanitizedContent).not.toContain("```js:" + TEMPLATE_PROPERTY_NAME);
            expect(sanitizedContent).toContain("# My Note");
            expect(sanitizedContent).toContain("Some content.");
            expect(sanitizedContent).toContain("More content.");
            expect(sanitizedContent).toContain("End of note.");
        });

        test("does not remove code blocks with different tags", async () => {
            const folder = createFolder('out');
            const getFolderByPath = jest.fn().mockReturnValue(folder);
            const copy = jest.fn().mockImplementation(async (_src: TFile, newPath: string) => createFile(newPath));
            const processFrontMatter = jest.fn().mockImplementation(async (file: TFile, fn: (fm: any) => void) => {
                if (file.path === 'templates/note.md') {
                    fn({ [TEMPLATE_PROPERTY_NAME]: {} });
                } else {
                    fn({});
                }
            });
            let sanitizedContent: string | null = null;
            let processCallCount = 0;
            const process = jest.fn().mockImplementation(async (_file: TFile, cb: (content: string) => string) => {
                processCallCount++;
                if (processCallCount === 1) {
                    const input = [
                        "# Note",
                        "",
                        "```js:other-plugin:func",
                        "() => 42",
                        "```",
                        "",
                        "```javascript",
                        "const x = 1;",
                        "```",
                    ].join("\n");
                    sanitizedContent = cb(input);
                }
            });

            const { callback, indexed } = await setupAndGetCallback(
                {},
                { getFolderByPath, copy, processFrontMatter, process },
            );

            const { FormItemsManager } = require("../form/formItemManager");
            const formItems = await FormItemsManager.getFormItems({}, mockFunctionProcessor, defaultSettings());
            formItems[0].value = "Note";
            formItems[1].value = "out";

            await callback(formItems, indexed);

            expect(sanitizedContent).toContain("```js:other-plugin:func");
            expect(sanitizedContent).toContain("```javascript");
        });

        test("applies Mustache view model to note content", async () => {
            const folder = createFolder('out');
            const getFolderByPath = jest.fn().mockReturnValue(folder);
            const copy = jest.fn().mockImplementation(async (_src: TFile, newPath: string) => createFile(newPath));
            const processFrontMatter = jest.fn().mockImplementation(async (file: TFile, fn: (fm: any) => void) => {
                if (file.path === 'templates/note.md') {
                    fn({ [TEMPLATE_PROPERTY_NAME]: { "form-items": [{ id: "title", type: "text" }] } });
                } else {
                    fn({});
                }
            });
            let renderedContent: string | null = null;
            const process = jest.fn().mockImplementation(async (_file: TFile, cb: (content: string) => string) => {
                renderedContent = cb("Hello {{title}}!");
            });

            const { callback, indexed } = await setupAndGetCallback(
                { "form-items": [{ id: "title", type: "text" }] },
                { getFolderByPath, copy, processFrontMatter, process },
            );

            const { FormItemsManager } = require("../form/formItemManager");
            const formItems = await FormItemsManager.getFormItems(
                { "form-items": [{ id: "title", type: "text" }] },
                mockFunctionProcessor,
                defaultSettings(),
            );
            formItems[0].value = "Note";
            formItems[1].value = "out";
            formItems[2].value = "World";

            await callback(formItems, indexed);

            expect(renderedContent).toBe("Hello World!");
        });

        test("does not escape HTML in Mustache rendering", async () => {
            const folder = createFolder('out');
            const getFolderByPath = jest.fn().mockReturnValue(folder);
            const copy = jest.fn().mockImplementation(async (_src: TFile, newPath: string) => createFile(newPath));
            const processFrontMatter = jest.fn().mockImplementation(async (file: TFile, fn: (fm: any) => void) => {
                if (file.path === 'templates/note.md') {
                    fn({ [TEMPLATE_PROPERTY_NAME]: { "form-items": [{ id: "content", type: "text" }] } });
                } else {
                    fn({});
                }
            });
            let renderedContent: string | null = null;
            const process = jest.fn().mockImplementation(async (_file: TFile, cb: (content: string) => string) => {
                renderedContent = cb("{{content}}");
            });

            const { callback, indexed } = await setupAndGetCallback(
                { "form-items": [{ id: "content", type: "text" }] },
                { getFolderByPath, copy, processFrontMatter, process },
            );

            const { FormItemsManager } = require("../form/formItemManager");
            const formItems = await FormItemsManager.getFormItems(
                { "form-items": [{ id: "content", type: "text" }] },
                mockFunctionProcessor,
                defaultSettings(),
            );
            formItems[0].value = "Note";
            formItems[1].value = "out";
            formItems[2].value = "<b>bold</b> & \"quoted\"";

            await callback(formItems, indexed);

            expect(renderedContent).toBe("<b>bold</b> & \"quoted\"");
        });

        test("returns false when getViewModel throws", async () => {
            const folder = createFolder('out');
            const getFolderByPath = jest.fn().mockReturnValue(folder);
            const processFrontMatter = jest.fn().mockImplementation(async (file: TFile, fn: (fm: any) => void) => {
                if (file.path === 'templates/note.md') {
                    fn({ [TEMPLATE_PROPERTY_NAME]: {} });
                } else {
                    fn({});
                }
            });

            const { callback, indexed } = await setupAndGetCallback(
                {},
                { getFolderByPath, processFrontMatter },
            );

            // Pass items with a broken get function to trigger an error
            const badItem: FormItem = {
                id: "bad",
                type: "text",
                value: "x",
                assignToForm: jest.fn(),
                get: () => { throw new Error("broken"); },
                initialize: jest.fn().mockResolvedValue(undefined),
                validate: jest.fn().mockResolvedValue(undefined),
            };

            const result = await callback([badItem], indexed);
            expect(result).toBe(false);
        });
    });
});
