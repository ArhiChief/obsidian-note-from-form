import { App, Command, Plugin, type PluginManifest } from 'obsidian';
import { DEFAULT_PLUGIN_SETTINGS, NoteFromFormPluginSettings } from './pluginSettings';
import { TemplateIndex } from './template/templateIndex';
import { NoteFromFormSettingsTab } from './ui/settingsTab';


export default class NoteFromFormPlugin extends Plugin {
    settings: NoteFromFormPluginSettings;
    templateIndex!: TemplateIndex;
    private commandIds: string[] = [];
    
    constructor(app: App, manifest: PluginManifest) {
        super(app, manifest);
        this.settings = DEFAULT_PLUGIN_SETTINGS;
    }

    async onload() {
        await this.loadSettings();

        this.templateIndex = new TemplateIndex(this.app, this.settings, () => this.rebuildCommands());

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
        // Remove previously registered template commands
        for (const id of this.commandIds) {
            (this.app as any).commands.removeCommand(id);
        }
        this.commandIds = [];

        // Register a command for each indexed template
        for (const { file, label } of this.templateIndex.getItems()) {
            const commandId = `use-template:${label}`;
            this.addCommand({
                id: commandId,
                name: label,
                callback: () => {
                    // TODO: open form for this template
                },
            });
            this.commandIds.push(`${this.manifest.id}:${commandId}`);
        }
    }
}