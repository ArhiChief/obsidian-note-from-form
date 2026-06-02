import { App, Notice, Plugin, TFile, type PluginManifest } from 'obsidian';
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
        
        this.templateIndex = new TemplateIndex(this.app, this.settings, this.rebuildCommands.bind(this));
        this.templateProcessor = new TemplateProcessor(this.app, this.settings);

        

        // This adds a settings tab so the user can configure various aspects of the plugin
        this.addSettingTab(new NoteFromFormSettingsTab(this.app, this, this.settings, this.updateSettings.bind(this)));

        // listen for changes in vault to rebuild template index on fly
        this.registerEvent(this.app.vault.on('create', (file) => this.templateIndex.onVaultChange(file)));
        this.registerEvent(this.app.vault.on('delete', (file) => this.templateIndex.onVaultChange(file)));
        this.registerEvent(this.app.vault.on('modify', (file) => this.templateIndex.onVaultChange(file)));
        this.registerEvent(this.app.vault.on('rename', (file) => this.templateIndex.onVaultChange(file)));
        this.registerEvent(this.app.workspace.on('file-menu', (menu, file) => {
            if (file instanceof TFile && this.templateIndex.isInTemplatesFolder(file)) {
                menu.addItem((item) => {
                    item.setTitle('Note From Form: Use template')
                        .setIcon('captions')
                        .onClick(async () => {
                            const templateItem = this.templateIndex.getItems().find(i => i.file.path === file.path);                            
                            await  this.useTemplate(templateItem);
                        });
                });
            }
        }));

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
                callback: async () => await this.useTemplate(item)
            });
            this.commandIds.push(`${this.manifest.id}:${commandId}`);
        }
    }

    private async useTemplate(indexedTemplate?: TemplateIndexItem) {
        if (!indexedTemplate) {
            return;
        }
        try {
            await this.templateProcessor.useTemplate(indexedTemplate);
        } catch (e) {
            new Notice(e instanceof Error ? e.message : 'Failed to process template');
        }
    }
}