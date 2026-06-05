import { TFile, TFolder } from 'obsidian';
import { NoteFromFormPluginSettings, TEMPLATE_PROPERTY_NAME } from '../pluginSettings';
import { TemplateIndex } from '../template/templateIndex';

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

function createFolder(path: string, children: (TFile | TFolder)[] = []): TFolder {
    const folder = new TFolder();
    folder.path = path;
    folder.children = children;
    return folder;
}

function createMockApp(options: {
    processFrontMatter?: (file: TFile, fn: (frontmatter: any) => void) => Promise<void>;
    getFolderByPath?: (path: string) => TFolder | null;
} = {}) {
    return {
        fileManager: {
            processFrontMatter: options.processFrontMatter ?? jest.fn().mockResolvedValue(undefined),
        },
        vault: {
            getFolderByPath: options.getFolderByPath ?? jest.fn().mockReturnValue(null),
        },
    } as any;
}

function createIndex(app: any, settings: NoteFromFormPluginSettings, onIndexChanged?: jest.Mock) {
    return new TemplateIndex(app, settings, onIndexChanged ?? jest.fn());
}

function mockProcessFrontMatter(frontmatterByPath: Record<string, Record<string, any>>) {
    return jest.fn().mockImplementation(async (file: TFile, fn: (fm: any) => void) => {
        const fm = frontmatterByPath[file.path] ?? {};
        fn(fm);
    });
}

// ── tests ──

describe("TemplateIndex", () => {

    // ─── onVaultChange ───

    describe("onVaultChange", () => {
        test("ignores non-TFile (TFolder)", () => {
            const settings = defaultSettings();
            const processFrontMatter = jest.fn();
            const app = createMockApp({ processFrontMatter });
            const index = createIndex(app, settings);

            const folder = createFolder('templates/subfolder');
            index.onVaultChange(folder);

            expect(processFrontMatter).not.toHaveBeenCalled();
        });

        test("ignores file outside templates folder", async () => {
            const settings = defaultSettings();
            const processFrontMatter = jest.fn().mockImplementation(async (_file: any, fn: any) => fn({}));
            const app = createMockApp({ processFrontMatter });
            const index = createIndex(app, settings);

            const file = createFile('other/note.md');
            index.onVaultChange(file);

            await new Promise(resolve => setTimeout(resolve, 0));

            expect(index.getItems()).toHaveLength(0);
        });

        test("updates index for file inside templates folder", async () => {
            const settings = defaultSettings();
            const processFrontMatter = mockProcessFrontMatter({
                'templates/note.md': { [TEMPLATE_PROPERTY_NAME]: true },
            });
            const app = createMockApp({ processFrontMatter });
            const index = createIndex(app, settings);

            const file = createFile('templates/note.md');
            index.onVaultChange(file);

            // Wait for async update
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(processFrontMatter).toHaveBeenCalledWith(file, expect.any(Function));
            expect(index.getItems()).toHaveLength(1);
        });

        test("ignores file when templatesFolderLocation is empty", () => {
            const settings = defaultSettings({ templatesFolderLocation: '' });
            const processFrontMatter = jest.fn();
            const app = createMockApp({ processFrontMatter });
            const index = createIndex(app, settings);

            const file = createFile('templates/note.md');
            index.onVaultChange(file);

            expect(processFrontMatter).not.toHaveBeenCalled();
        });

        test("handles file in nested subfolder of templates", async () => {
            const settings = defaultSettings();
            const processFrontMatter = mockProcessFrontMatter({
                'templates/sub/deep/note.md': { [TEMPLATE_PROPERTY_NAME]: true },
            });
            const app = createMockApp({ processFrontMatter });
            const index = createIndex(app, settings);

            const file = createFile('templates/sub/deep/note.md');
            index.onVaultChange(file);

            await new Promise(resolve => setTimeout(resolve, 0));

            expect(index.getItems()).toHaveLength(1);
        });

        test("does not match folder with similar prefix", async () => {
            const settings = defaultSettings();
            const processFrontMatter = jest.fn().mockImplementation(async (_file: any, fn: any) => fn({}));
            const app = createMockApp({ processFrontMatter });
            const index = createIndex(app, settings);

            const file = createFile('templates-other/note.md');
            index.onVaultChange(file);

            await new Promise(resolve => setTimeout(resolve, 0));

            expect(index.getItems()).toHaveLength(0);
        });
    });

    // ─── update ───

    describe("update", () => {
        test("adds file to index when front matter has template property", async () => {
            const settings = defaultSettings();
            const processFrontMatter = mockProcessFrontMatter({
                'templates/note.md': { [TEMPLATE_PROPERTY_NAME]: { items: [] } },
            });
            const app = createMockApp({ processFrontMatter });
            const index = createIndex(app, settings);

            const file = createFile('templates/note.md');
            await index.update(file);

            expect(index.getItems()).toEqual([{ file, label: 'note' }]);
        });

        test("does not add file when front matter lacks template property", async () => {
            const settings = defaultSettings();
            const processFrontMatter = mockProcessFrontMatter({
                'templates/note.md': { title: 'Just a note' },
            });
            const app = createMockApp({ processFrontMatter });
            const index = createIndex(app, settings);

            const file = createFile('templates/note.md');
            await index.update(file);

            expect(index.getItems()).toHaveLength(0);
        });

        test("does not duplicate file already in index", async () => {
            const settings = defaultSettings();
            const processFrontMatter = mockProcessFrontMatter({
                'templates/note.md': { [TEMPLATE_PROPERTY_NAME]: true },
            });
            const app = createMockApp({ processFrontMatter });
            const index = createIndex(app, settings);

            const file = createFile('templates/note.md');
            await index.update(file);
            await index.update(file);

            expect(index.getItems()).toHaveLength(1);
        });

        test("removes file from index when template property is removed", async () => {
            const settings = defaultSettings();
            let frontmatter: Record<string, any> = { [TEMPLATE_PROPERTY_NAME]: true };
            const processFrontMatter = jest.fn().mockImplementation(async (_file: TFile, fn: (fm: any) => void) => {
                fn(frontmatter);
            });
            const app = createMockApp({ processFrontMatter });
            const index = createIndex(app, settings);

            const file = createFile('templates/note.md');

            // First call: add to index
            await index.update(file);
            expect(index.getItems()).toHaveLength(1);

            // Second call: property removed
            frontmatter = { title: 'No longer a template' };
            await index.update(file);
            expect(index.getItems()).toHaveLength(0);
        });

        test("uses custom template property name from settings", async () => {
            const settings = defaultSettings({ templatePropertyName: 'my-form' });
            const processFrontMatter = mockProcessFrontMatter({
                'templates/note.md': { 'my-form': { items: [] } },
            });
            const app = createMockApp({ processFrontMatter });
            const index = createIndex(app, settings);

            const file = createFile('templates/note.md');
            await index.update(file);

            expect(index.getItems()).toEqual([{ file, label: 'note' }]);
        });

        test("does not add file when front matter has wrong property name", async () => {
            const settings = defaultSettings({ templatePropertyName: 'my-form' });
            const processFrontMatter = mockProcessFrontMatter({
                'templates/note.md': { [TEMPLATE_PROPERTY_NAME]: true },
            });
            const app = createMockApp({ processFrontMatter });
            const index = createIndex(app, settings);

            const file = createFile('templates/note.md');
            await index.update(file);

            expect(index.getItems()).toHaveLength(0);
        });
    });

    // ─── rebuild ───

    describe("rebuild", () => {
        test("clears existing index and rebuilds", async () => {
            const settings = defaultSettings();
            const file1 = createFile('templates/a.md');
            const file2 = createFile('templates/b.md');
            const folder = createFolder('templates', [file1, file2]);

            const processFrontMatter = mockProcessFrontMatter({
                'templates/a.md': { [TEMPLATE_PROPERTY_NAME]: true },
                'templates/b.md': { [TEMPLATE_PROPERTY_NAME]: true },
            });
            const app = createMockApp({
                processFrontMatter,
                getFolderByPath: jest.fn().mockReturnValue(folder),
            });
            const index = createIndex(app, settings);

            await index.rebuild();
            expect(index.getItems()).toHaveLength(2);

            // Rebuild again — should not accumulate
            await index.rebuild();
            expect(index.getItems()).toHaveLength(2);
        });

        test("does nothing when templatesFolderLocation is empty", async () => {
            const settings = defaultSettings({ templatesFolderLocation: '' });
            const getFolderByPath = jest.fn();
            const app = createMockApp({ getFolderByPath });
            const index = createIndex(app, settings);

            await index.rebuild();

            expect(getFolderByPath).not.toHaveBeenCalled();
            expect(index.getItems()).toHaveLength(0);
        });

        test("does nothing when folder does not exist", async () => {
            const settings = defaultSettings();
            const processFrontMatter = jest.fn();
            const app = createMockApp({
                processFrontMatter,
                getFolderByPath: jest.fn().mockReturnValue(null),
            });
            const index = createIndex(app, settings);

            await index.rebuild();

            expect(processFrontMatter).not.toHaveBeenCalled();
            expect(index.getItems()).toHaveLength(0);
        });

        test("indexes files recursively in nested folders", async () => {
            const settings = defaultSettings();
            const deepFile = createFile('templates/sub/deep.md');
            const subFolder = createFolder('templates/sub', [deepFile]);
            const topFile = createFile('templates/top.md');
            const rootFolder = createFolder('templates', [topFile, subFolder]);

            const processFrontMatter = mockProcessFrontMatter({
                'templates/top.md': { [TEMPLATE_PROPERTY_NAME]: true },
                'templates/sub/deep.md': { [TEMPLATE_PROPERTY_NAME]: true },
            });
            const app = createMockApp({
                processFrontMatter,
                getFolderByPath: jest.fn().mockReturnValue(rootFolder),
            });
            const index = createIndex(app, settings);

            await index.rebuild();

            expect(index.getItems()).toHaveLength(2);
            expect(index.getItems().map(item => item.file.path)).toEqual(
                expect.arrayContaining(['templates/top.md', 'templates/sub/deep.md'])
            );
        });

        test("only indexes files with template property", async () => {
            const settings = defaultSettings();
            const templateFile = createFile('templates/form.md');
            const regularFile = createFile('templates/readme.md');
            const folder = createFolder('templates', [templateFile, regularFile]);

            const processFrontMatter = mockProcessFrontMatter({
                'templates/form.md': { [TEMPLATE_PROPERTY_NAME]: true },
                'templates/readme.md': { title: 'Just a readme' },
            });
            const app = createMockApp({
                processFrontMatter,
                getFolderByPath: jest.fn().mockReturnValue(folder),
            });
            const index = createIndex(app, settings);

            await index.rebuild();

            expect(index.getItems()).toHaveLength(1);
            expect(index.getItems()[0].file.path).toBe('templates/form.md');
        });

        test("handles folder with trailing slash in settings", async () => {
            const settings = defaultSettings({ templatesFolderLocation: 'templates/' });
            const file = createFile('templates/note.md');
            const folder = createFolder('templates', [file]);

            const processFrontMatter = mockProcessFrontMatter({
                'templates/note.md': { [TEMPLATE_PROPERTY_NAME]: true },
            });
            const app = createMockApp({
                processFrontMatter,
                getFolderByPath: jest.fn().mockReturnValue(folder),
            });
            const index = createIndex(app, settings);

            await index.rebuild();

            expect(index.getItems()).toHaveLength(1);
        });
    });

    // ─── getItems ───

    describe("getItems", () => {
        test("returns empty array initially", () => {
            const app = createMockApp();
            const index = createIndex(app, defaultSettings());
            expect(index.getItems()).toEqual([]);
        });
    });

    // ─── onIndexChanged callback ───

    describe("onIndexChanged callback", () => {
        test("is called after rebuild", async () => {
            const settings = defaultSettings();
            const folder = createFolder('templates', []);
            const onIndexChanged = jest.fn();
            const app = createMockApp({
                getFolderByPath: jest.fn().mockReturnValue(folder),
            });
            const index = createIndex(app, settings, onIndexChanged);

            await index.rebuild();

            expect(onIndexChanged).toHaveBeenCalledTimes(1);
        });

        test("is called after rebuild even when folder is empty", async () => {
            const settings = defaultSettings();
            const folder = createFolder('templates', []);
            const onIndexChanged = jest.fn();
            const app = createMockApp({
                getFolderByPath: jest.fn().mockReturnValue(folder),
            });
            const index = createIndex(app, settings, onIndexChanged);

            await index.rebuild();

            expect(onIndexChanged).toHaveBeenCalled();
        });

        test("is not called when templatesFolderLocation is empty", async () => {
            const settings = defaultSettings({ templatesFolderLocation: '' });
            const onIndexChanged = jest.fn();
            const app = createMockApp();
            const index = createIndex(app, settings, onIndexChanged);

            await index.rebuild();

            expect(onIndexChanged).not.toHaveBeenCalled();
        });

        test("is not called when folder does not exist", async () => {
            const settings = defaultSettings();
            const onIndexChanged = jest.fn();
            const app = createMockApp({
                getFolderByPath: jest.fn().mockReturnValue(null),
            });
            const index = createIndex(app, settings, onIndexChanged);

            await index.rebuild();

            expect(onIndexChanged).not.toHaveBeenCalled();
        });
    });
});
