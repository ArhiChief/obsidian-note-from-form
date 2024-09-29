import { App, PluginSettingTab } from 'obsidian';
import NoteFromFormPlugin from 'src/main';
import { SettingExtended } from './settingExtensions';
import { TEMPLATE_PROPERTY_NAME } from 'src/pluginSettings';


export class NoteFromFormSettingTab extends PluginSettingTab {
    plugin: NoteFromFormPlugin;

    constructor(app: App, plugin: NoteFromFormPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const {containerEl} = this;

        containerEl.empty();

        new SettingExtended(containerEl)
            .setName('Template Folder Location')
            .setDesc('Files in this folder will be available as templates')
            .addText(text => text
                .setPlaceholder('Example: folder 1/folder 2')
                .setValue(this.plugin.settings.templatesFolderLocation)
                .onChange(async value => {
                    this.plugin.settings.templatesFolderLocation = value;
                    await this.plugin.updateSettings();
                })
            );

        new SettingExtended(containerEl)
            .setName('Template Property Name')
            .setDesc('Set property used to define form')
            .addText(text => text
                .setPlaceholder(`Example: ${TEMPLATE_PROPERTY_NAME}`)
                .setValue(this.plugin.settings.templatePropertyName)
                .onChange(async value => {
                    this.plugin.settings.templatePropertyName = value;
                    await this.plugin.updateSettings();
                })
            );

        new SettingExtended(containerEl)
            .setName('Default Output Folder')
            .addText(text => text
                .setValue(this.plugin.settings.outputDir)
                .onChange(async value => {
                    this.plugin.settings.outputDir = value;
                    await this.plugin.updateSettings();
                })
            );

        new SettingExtended(containerEl)
            .setName('Re-build Template Index')
            .setDesc('Run re-build of template index from templates specified in "Template Folder Location" setting')
            .addButton(button => button
                .setButtonText('Re-build')
                .onClick(async (_) => await this.plugin.reindexTemplates())
            );
    }
}