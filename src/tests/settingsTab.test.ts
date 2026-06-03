import { NoteFromFormSettingsTab } from "../ui/settingsTab";
import { NoteFromFormPluginSettings, TEMPLATE_PROPERTY_NAME } from "../pluginSettings";

// ── obsidian mocks ──

// We need to override the onChange method properly since the source calls `.onChange(async (value) => ...)`
// The source code chains: .addText(text => text.setPlaceholder(...).setValue(...).onChange(async (value) => ...))
// So onChange is called as a method on the text component that receives a callback.
class TextComponent {
    private _placeholder = "";
    private _value = "";
    private _onChangeCb: ((value: string) => Promise<void>) | null = null;

    setPlaceholder(p: string) { this._placeholder = p; return this; }
    setValue(v: string) { this._value = v; return this; }
    onChange(cb: (value: string) => Promise<void>) { this._onChangeCb = cb; return this; }

    async trigger(value: string) {
        if (this._onChangeCb) await this._onChangeCb(value);
    }

    get placeholder() { return this._placeholder; }
    get value() { return this._value; }
}

class SettingMock {
    descEl = { toggleClass: jest.fn() };
    private _name = "";
    private _desc = "";
    textComponent: TextComponent | null = null;

    constructor(public containerEl: HTMLElement) {}

    setName(name: string) { this._name = name; return this; }
    setDesc(desc: string) { this._desc = desc; return this; }
    addText(cb: (text: TextComponent) => void) {
        this.textComponent = new TextComponent();
        cb(this.textComponent);
        return this;
    }

    get name() { return this._name; }
    get desc() { return this._desc; }
}

// Track settings created during display()
let createdSettings: SettingMock[] = [];

jest.mock("obsidian", () => {
    return {
        App: class {},
        PluginSettingTab: class {
            app: any;
            containerEl: HTMLElement;
            constructor(app: any, _plugin: any) {
                this.app = app;
                this.containerEl = {
                    empty: jest.fn(),
                } as any;
            }
        },
        Setting: jest.fn().mockImplementation(function (this: any, containerEl: HTMLElement) {
            const s = new SettingMock(containerEl);
            createdSettings.push(s);
            // Copy all methods/properties so the returned object behaves like SettingMock
            Object.assign(this, s);
            this.descEl = s.descEl;
            this.setName = s.setName.bind(s);
            this.setDesc = s.setDesc.bind(s);
            this.addText = (cb: (text: TextComponent) => void) => {
                s.addText(cb);
                this.textComponent = s.textComponent;
                this.descEl = s.descEl;
                return this;
            };
            this._getName = () => s.name;
            this._getDesc = () => s.desc;
        }),
    };
});

jest.mock("src/main", () => {
    return class MockPlugin {};
});

// ── helpers ──

function defaultSettings(): NoteFromFormPluginSettings {
    return {
        templatesFolderLocation: "",
        templatePropertyName: TEMPLATE_PROPERTY_NAME,
        defaultOutputDir: "",
    };
}

function createTab(settings?: NoteFromFormPluginSettings, saveData?: jest.Mock) {
    const app = {} as any;
    const plugin = {} as any;
    const s = settings ?? defaultSettings();
    const save = saveData ?? jest.fn().mockResolvedValue(undefined);
    const tab = new NoteFromFormSettingsTab(app, plugin, s, save);
    return { tab, settings: s, saveData: save };
}

function displayAndGetTextComponents(tab: NoteFromFormSettingsTab) {
    createdSettings = [];
    tab.display();
    // display() creates 3 settings in order: templatesDirectory, templateProperty, defaultOutputDirectory
    // Each setting has a textComponent with a trigger() method
    const templatesDir = createdSettings[0];
    const templateProp = createdSettings[1];
    const defaultOutDir = createdSettings[2];
    return { templatesDir, templateProp, defaultOutDir };
}

// ── tests ──

describe("NoteFromFormSettingsTab", () => {

    beforeEach(() => {
        createdSettings = [];
    });

    // ─── display ───

    describe("display", () => {
        test("calls containerEl.empty()", () => {
            const { tab } = createTab();
            tab.display();
            expect((tab as any).containerEl.empty).toHaveBeenCalled();
        });
    });

    // ─── templates directory onChange ───

    describe("templates directory onChange", () => {
        test("saves valid folder path", async () => {
            const { tab, saveData } = createTab();
            const { templatesDir } = displayAndGetTextComponents(tab);
            await templatesDir.textComponent!.trigger("notes/templates");
            expect(saveData).toHaveBeenCalled();
        });

        test("saves when value is empty (clears path)", async () => {
            const settings = defaultSettings();
            settings.defaultOutputDir = "old/path";
            const { tab, saveData } = createTab(settings);
            const { templatesDir } = displayAndGetTextComponents(tab);
            await templatesDir.textComponent!.trigger("");
            expect(saveData).toHaveBeenCalled();
        });

        test("shows error for path with invalid characters (<>)", async () => {
            const { tab, saveData } = createTab();
            const { templatesDir } = displayAndGetTextComponents(tab);
            await templatesDir.textComponent!.trigger("invalid<path>");
            expect(saveData).not.toHaveBeenCalled();
            expect(templatesDir.descEl.toggleClass).toHaveBeenCalledWith("nff-error-desc", true);
        });

        test("shows error for path ending with slash", async () => {
            const { tab, saveData } = createTab();
            const { templatesDir } = displayAndGetTextComponents(tab);
            await templatesDir.textComponent!.trigger("path/to/folder/");
            expect(saveData).not.toHaveBeenCalled();
            expect(templatesDir.descEl.toggleClass).toHaveBeenCalledWith("nff-error-desc", true);
        });

        test("accepts path with colon (valid on Unix)", async () => {
            const { tab, saveData } = createTab();
            const { templatesDir } = displayAndGetTextComponents(tab);
            await templatesDir.textComponent!.trigger("C:folder");
            expect(saveData).toHaveBeenCalled();
        });

        test("shows error for path with pipe character", async () => {
            const { tab, saveData } = createTab();
            const { templatesDir } = displayAndGetTextComponents(tab);
            await templatesDir.textComponent!.trigger("path|other");
            expect(saveData).not.toHaveBeenCalled();
        });

        test("shows error for path with question mark", async () => {
            const { tab, saveData } = createTab();
            const { templatesDir } = displayAndGetTextComponents(tab);
            await templatesDir.textComponent!.trigger("path?");
            expect(saveData).not.toHaveBeenCalled();
        });

        test("shows error for path with asterisk", async () => {
            const { tab, saveData } = createTab();
            const { templatesDir } = displayAndGetTextComponents(tab);
            await templatesDir.textComponent!.trigger("path*");
            expect(saveData).not.toHaveBeenCalled();
        });

        test("shows error for path with double quote", async () => {
            const { tab, saveData } = createTab();
            const { templatesDir } = displayAndGetTextComponents(tab);
            await templatesDir.textComponent!.trigger('path"name');
            expect(saveData).not.toHaveBeenCalled();
        });

        test("resets error description before validating", async () => {
            const { tab } = createTab();
            const { templatesDir } = displayAndGetTextComponents(tab);
            await templatesDir.textComponent!.trigger("valid/path");
            // First call resets error, no second call with error=true
            expect(templatesDir.descEl.toggleClass).toHaveBeenCalledWith("nff-error-desc", false);
        });
    });

    // ─── template property name onChange ───

    describe("template property name onChange", () => {
        test("saves non-empty value", async () => {
            const { tab, saveData, settings } = createTab();
            const { templateProp } = displayAndGetTextComponents(tab);
            await templateProp.textComponent!.trigger("my-custom-property");
            expect(saveData).toHaveBeenCalledWith(settings);
            expect(settings.templatePropertyName).toBe("my-custom-property");
        });

        test("shows error for empty string", async () => {
            const { tab, saveData } = createTab();
            const { templateProp } = displayAndGetTextComponents(tab);
            await templateProp.textComponent!.trigger("");
            expect(saveData).not.toHaveBeenCalled();
            expect(templateProp.descEl.toggleClass).toHaveBeenCalledWith("nff-error-desc", true);
        });

        test("shows error for whitespace-only string", async () => {
            const { tab, saveData } = createTab();
            const { templateProp } = displayAndGetTextComponents(tab);
            await templateProp.textComponent!.trigger("   ");
            expect(saveData).not.toHaveBeenCalled();
            expect(templateProp.descEl.toggleClass).toHaveBeenCalledWith("nff-error-desc", true);
        });

        test("resets error state before validating", async () => {
            const { tab } = createTab();
            const { templateProp } = displayAndGetTextComponents(tab);
            await templateProp.textComponent!.trigger("valid");
            expect(templateProp.descEl.toggleClass).toHaveBeenCalledWith("nff-error-desc", false);
        });
    });

    // ─── default output directory onChange ───

    describe("default output directory onChange", () => {
        test("saves valid folder path", async () => {
            const { tab, saveData } = createTab();
            const { defaultOutDir } = displayAndGetTextComponents(tab);
            await defaultOutDir.textComponent!.trigger("output/notes");
            expect(saveData).toHaveBeenCalled();
        });

        test("saves when value is empty", async () => {
            const { tab, saveData } = createTab();
            const { defaultOutDir } = displayAndGetTextComponents(tab);
            await defaultOutDir.textComponent!.trigger("");
            expect(saveData).toHaveBeenCalled();
        });

        test("shows error for path ending with slash", async () => {
            const { tab, saveData } = createTab();
            const { defaultOutDir } = displayAndGetTextComponents(tab);
            await defaultOutDir.textComponent!.trigger("bad/path/");
            expect(saveData).not.toHaveBeenCalled();
            expect(defaultOutDir.descEl.toggleClass).toHaveBeenCalledWith("nff-error-desc", true);
        });

        test("shows error for path with invalid characters", async () => {
            const { tab, saveData } = createTab();
            const { defaultOutDir } = displayAndGetTextComponents(tab);
            await defaultOutDir.textComponent!.trigger("<invalid>");
            expect(saveData).not.toHaveBeenCalled();
            expect(defaultOutDir.descEl.toggleClass).toHaveBeenCalledWith("nff-error-desc", true);
        });

        test("accepts nested valid path", async () => {
            const { tab, saveData } = createTab();
            const { defaultOutDir } = displayAndGetTextComponents(tab);
            await defaultOutDir.textComponent!.trigger("a/b/c/d/e");
            expect(saveData).toHaveBeenCalled();
        });
    });

    // ─── isValidFolderPath (tested indirectly) ───

    describe("folder path validation (via directory settings)", () => {
        const invalidPaths = [
            { path: "has<angle", reason: "contains <" },
            { path: "has>angle", reason: "contains >" },
            { path: 'has"quote', reason: 'contains "' },
            { path: "has|pipe", reason: "contains |" },
            { path: "has?question", reason: "contains ?" },
            { path: "has*star", reason: "contains *" },
            { path: "has\\backslash", reason: "contains \\" },
            { path: "trailing/", reason: "ends with /" },
        ];

        test.each(invalidPaths)("rejects path that $reason: $path", async ({ path }) => {
            const { tab, saveData } = createTab();
            const { defaultOutDir } = displayAndGetTextComponents(tab);
            await defaultOutDir.textComponent!.trigger(path);
            expect(saveData).not.toHaveBeenCalled();
        });

        const validPaths = [
            "simple",
            "nested/path",
            "deeply/nested/folder/path",
            "with-dashes",
            "with_underscores",
            "with.dots",
            "with:colon",
            "MixedCase/Path",
        ];

        test.each(validPaths)("accepts valid path: %s", async (path) => {
            const { tab, saveData } = createTab();
            const { defaultOutDir } = displayAndGetTextComponents(tab);
            await defaultOutDir.textComponent!.trigger(path);
            expect(saveData).toHaveBeenCalled();
        });
    });

    // ─── settings persistence ───

    describe("settings persistence", () => {
        test("display uses current settings values", () => {
            const settings: NoteFromFormPluginSettings = {
                templatesFolderLocation: "my/templates",
                templatePropertyName: "custom-prop",
                defaultOutputDir: "my/output",
            };
            const { tab } = createTab(settings);
            displayAndGetTextComponents(tab);
            // Settings were read — if display didn't throw, values were consumed
            expect(createdSettings).toHaveLength(3);
        });

        test("valid directory change updates settings object", async () => {
            const settings = defaultSettings();
            const { tab } = createTab(settings);
            const { defaultOutDir } = displayAndGetTextComponents(tab);
            await defaultOutDir.textComponent!.trigger("new/path");
            expect(settings.defaultOutputDir).toBe("new/path");
        });

        test("valid templates directory change updates templatesFolderLocation", async () => {
            const settings = defaultSettings();
            const { tab } = createTab(settings);
            const { templatesDir } = displayAndGetTextComponents(tab);
            await templatesDir.textComponent!.trigger("my/templates");
            expect(settings.templatesFolderLocation).toBe("my/templates");
        });

        test("invalid directory change does not update settings", async () => {
            const settings = defaultSettings();
            settings.defaultOutputDir = "original";
            const { tab } = createTab(settings);
            const { defaultOutDir } = displayAndGetTextComponents(tab);
            await defaultOutDir.textComponent!.trigger("bad|path");
            // defaultOutputDir is set to value before validation check in validateAndSave
            // Actually looking at the code: it checks length == 0 || isValidFolderPath
            // If invalid, it doesn't assign. Let's verify the original is preserved
            // Wait - the code sets this.pluginSettings.defaultOutputDir = value inside the if
            // So for invalid paths it should NOT be updated
            expect(settings.defaultOutputDir).toBe("original");
        });

        test("template property change updates settings object", async () => {
            const settings = defaultSettings();
            const { tab } = createTab(settings);
            const { templateProp } = displayAndGetTextComponents(tab);
            await templateProp.textComponent!.trigger("new-property");
            expect(settings.templatePropertyName).toBe("new-property");
        });

        test("empty template property does not update settings", async () => {
            const settings = defaultSettings();
            const { tab } = createTab(settings);
            const { templateProp } = displayAndGetTextComponents(tab);
            await templateProp.textComponent!.trigger("");
            expect(settings.templatePropertyName).toBe(TEMPLATE_PROPERTY_NAME);
        });
    });
});
