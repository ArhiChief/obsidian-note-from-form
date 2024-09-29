import { App, normalizePath, Plugin, type PluginManifest } from 'obsidian';
import { NoteFromFormSettingTab } from './ui/settingsTab';
import { TemplateParser } from './template/templateParser';
import { DEFAULT_PLUGIN_SETTINGS, NoteFromFormPluginSettings } from './pluginSettings';
import { Template } from './template/template';
import { InputFormModal } from './ui/inputFormModal';
import { FormItem } from './form/formItemBase';
import { FormItemsManager } from './form/formItemsManager';
import { base64Decode, renderMustacheTemplate } from './helpers';


export default class NoteFromFormPlugin extends Plugin {
    settings: NoteFromFormPluginSettings;
    
    constructor(app: App, manifest: PluginManifest) {
        super(app, manifest);
        this.settings = DEFAULT_PLUGIN_SETTINGS;
    }

    async onload() {
        await this.loadSettings();

        this.updateCommands();

        // This adds a settings tab so the user can configure various aspects of the plugin
        this.addSettingTab(new NoteFromFormSettingTab(this.app, this));
    }

    onunload() { }

    private async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_PLUGIN_SETTINGS, await this.loadData());
    }

    async updateSettings(): Promise<void> {
        await this.saveData(this.settings);
    }
    
    async reindexTemplates(): Promise<void> {
        const parser = new TemplateParser(this.app.vault, this.settings);
        const result = await parser.parse();

        if (result) {
            this.settings.templates = result;
            await this.updateSettings();
            
            this.updateCommands();
        }
    }

    private updateCommands() {

        this.addCommand({
            id: 'rerebuild-template-index',
            name: 'Re-Build Template Index',
            callback: async () => await this.reindexTemplates(),
        });

        this.settings.templates.forEach((value, index) => {
            this.addCommand({
                id: `template-${index}`,
                name: value.name,
                callback: async () => await this.useTemplate(value),
            });
        });
    }

    private async useTemplate(template: Template): Promise<void> {

        const items: FormItem[] = FormItemsManager.getFormItems(template);
        new InputFormModal(this.app, template.name, items, async ()=> await this.createNewNote(template.text, items)).open();
    }

    private async createNewNote(noteTemplateText: string, src: FormItem[]): Promise<void> {
        const view = FormItemsManager.getViewModel(src);
        
        noteTemplateText = base64Decode(noteTemplateText);
        const noteText = renderMustacheTemplate(noteTemplateText, view);

        const vault = this.app.vault;
        if (!vault.getFolderByPath(normalizePath(view.fileLocation))) {
            await vault.createFolder(normalizePath(view.fileLocation));
        }

        const path = normalizePath(`${view.fileLocation}/${view.fileName}.md`);

        await vault.create(path, noteText);
    }
}