import { App, Command, Notice, Plugin, type PluginManifest } from 'obsidian';
import { DEFAULT_PLUGIN_SETTINGS, NoteFromFormPluginSettings } from './pluginSettings';
import { TemplateIndex, TemplateIndexItem } from './template/templateIndex';
import { TemplateProcessor } from './template/templateProcessor';
import { NoteFromFormSettingsTab } from './ui/settingsTab';


export default class NoteFromFormPlugin extends Plugin {
    private settings: NoteFromFormPluginSettings;
    private templateIndex!: TemplateIndex;
    private templateProcessor!: TemplateProcessor;
    private commandIds: string[] = [];
    
    constructor(app: App, manifest: PluginManifest) {
        super(app, manifest);
        this.settings = DEFAULT_PLUGIN_SETTINGS;
    }

    async onload() {
        await this.loadSettings();

        this.templateIndex = new TemplateIndex(this.app, this.settings, () => this.rebuildCommands());
        this.templateProcessor = new TemplateProcessor(this.app, this.settings);

        // This adds a settings tab so the user can configure various aspects of the plugin
        this.addSettingTab(new NoteFromFormSettingsTab(this.app, this, this.settings, this.updateSettings.bind(this)));

        // listen for changes in vault to rebuild template index on fly
        this.registerEvent(this.app.vault.on('create', (file) => this.templateIndex.onVaultChange(file)));
        this.registerEvent(this.app.vault.on('delete', (file) => this.templateIndex.onVaultChange(file)));
        this.registerEvent(this.app.vault.on('modify', (file) => this.templateIndex.onVaultChange(file)));
        this.registerEvent(this.app.vault.on('rename', (file) => this.templateIndex.onVaultChange(file)));

        await this.templateIndex.rebuild();
    }

    onunload() { 

    }

    private async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_PLUGIN_SETTINGS, await this.loadData());
    }

    async updateSettings(): Promise<void> {
        await this.saveData(this.settings);
        await this.templateIndex.rebuild();
    }

    private rebuildCommands() {
        for (const id of this.commandIds) {
            this.removeCommand(id);
        }

        this.commandIds = [];

        for (const item of this.templateIndex.getItems()) {
            const { label } = item;
            const commandId = `use-template:${label}`;
            this.addCommand({
                id: commandId,
                name: `use ${label}`,
                callback: async () => {
                    try {
                        await this.templateProcessor.process(item);
                    } catch (e) {
                        new Notice(e instanceof Error ? e.message : 'Failed to process template');
                    }
                },
            });
            this.commandIds.push(`${this.manifest.id}:${commandId}`);
        }
    }
}