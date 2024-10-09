import { App, normalizePath, Notice, Plugin, type PluginManifest } from 'obsidian';
import { NoteFromFormSettingTab } from './ui/settingsTab';
import { TemplateParser } from './template/templateParser';
import { DEFAULT_PLUGIN_SETTINGS, NoteFromFormPluginSettings } from './pluginSettings';
import { Template } from './template/template';
import { InputFormModal } from './ui/inputFormModal';
import { FormItem } from './form/formItemBase';
import { FormItemsManager } from './form/formItemsManager';
import { base64Decode, renderMustacheTemplate } from './helpers';
import { showMessageBox } from './ui/messageBox';

export default class NoteFromFormPlugin extends Plugin {
    settings: NoteFromFormPluginSettings;
    private _commands: string[];
    private _templates: Record<string, Template>;
    
    constructor(app: App, manifest: PluginManifest) {
        super(app, manifest);
        this.settings = DEFAULT_PLUGIN_SETTINGS;
        this._commands = [];
        this._templates = {};
    }

    async onload() {
        await this.loadSettings();

        this.updateCommands();

        this.settings.templates.forEach(template => this._templates[template.path] = template);

        // This adds a settings tab so the user can configure various aspects of the plugin
        this.addSettingTab(new NoteFromFormSettingTab(this.app, this));

        this.addContextMenu();
    }

    onunload() { }

    private async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_PLUGIN_SETTINGS, await this.loadData());
    }

    async updateSettings(): Promise<void> {
        await this.saveData(this.settings);
    }
    
    async reindexTemplates(): Promise<void> {
        const parser = new TemplateParser(this.app, this.settings);
        const result = await parser.parse();

        if (result) {
            this.settings.templates = result;
            await this.updateSettings();
            if (result.length > 0) {
                this._templates = {};
                result.forEach(template => this._templates[template.path] = template);
                new Notice('Templates index rebuild succeeded');
            }
            
            this.updateCommands();
        }
    }

    private updateCommands() {

        this._commands = [];

        this.addCommand({
            id: 'rerebuild-template-index',
            name: 'Re-Build Template Index',
            callback: async () => await this.reindexTemplates(),
        });

        this.settings.templates.forEach((value, index) => {
            const cmdId: string = `use-template-${index}`;
            this._commands.push(cmdId);
            this.addCommand({
                id: cmdId,
                name: value.name,
                callback: async () => await this.useTemplate(value),
            });
        });
    }

    private async useTemplate(template: Template): Promise<void> {

        let items: FormItem[]
        try {
            items = FormItemsManager.getFormItems(template);
        } catch(error) {
            showMessageBox(this.app, "Error", `Failed to create input form for '${template.name}' template: ${error}`);
            return;
        }

        new InputFormModal(this.app, template.name, items, async () => await this.createNewNote(template, items)).open();
    }

    private async createNewNote(template: Template, src: FormItem[]): Promise<void> {
        
        let view: Record<string, string>;
        try {
            view = FormItemsManager.getViewModel(src);
        }catch(error) {
            showMessageBox(this.app, "Error", `Failed to process input form for '${template.name}' template: ${error}`);
            return;
        }
        
        try {
            const templateText = base64Decode(template.text);
            const noteText = renderMustacheTemplate(templateText, view);

            const vault = this.app.vault;
            if (!vault.getFolderByPath(view.fileLocation)) {
                await vault.createFolder(view.fileLocation);
            }

            const path = normalizePath(`${view.fileLocation}/${view.fileName}.md`);
            await vault.create(path, noteText);
        } catch(error) {
            showMessageBox(this.app, "Error", `Failed to create new note: ${error}`);
        }
    }
    
    private addContextMenu(): void {
        
        this.registerEvent(
            this.app.workspace.on("file-menu", (menu, file) => {
                if (this._templates[file.path]) {
                    const template = this._templates[file.path];
                    menu
                        .addItem(menuItem => menuItem
                            .setTitle("Note From Form: Use Template")
                            .setIcon("file-input")
                            .onClick(() => this.useTemplate(template))
                        ).addSeparator();
                }
            })
        );
    }
}