import { App, PluginSettingTab, Setting } from "obsidian";
import NoteFromFormPlugin from "src/main";
import { NoteFromFormPluginSettings, TEMPLATE_PROPERTY_NAME } from "src/pluginSettings";

const pathPlaceholder = 'folder1/folder2';
const defaultOutputDirectoryDesc = `Used to create new notes if "file-location" property is not defined in template. Path should be relative to vault root and should not start or end with a slash. Example: ${pathPlaceholder}`;
const invalidDirectoryPath = 'Invalid directory path. Please avoid characters like <>:"|?* and do not end with a slash';
const templatesDirectoryDesc = `Files in this directory will be available as templates. Path should be relative to vault root and should not start or end with a slash. Example: ${pathPlaceholder}`;
const templatePropertyNameDesc = 'Set property used to define form. Example: note-from-form';


export class NoteFromFormSettingsTab extends PluginSettingTab{
    
    private pluginSettings: NoteFromFormPluginSettings;
    private saveData: (data: any) => Promise<void>;

    constructor(app: App, plugin: NoteFromFormPlugin, pluginSettings: NoteFromFormPluginSettings, saveData: (data: any) => Promise<void>) {
        super(app, plugin);
        this.saveData = saveData;
        this.pluginSettings = pluginSettings;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        const templatesDirectory = new Setting(containerEl)
            .setName('Templates directory')
            .setDesc(templatesDirectoryDesc)
            .addText(text => text
                .setPlaceholder(pathPlaceholder)
                .setValue(this.pluginSettings.templatesFolderLocation)
                .onChange(async (value) => await this.validateAndSave(value, templatesDirectory, templatesDirectoryDesc, invalidDirectoryPath))
            );
        
        const templateProperty = new Setting(containerEl)
            .setName('Template property name')
            .setDesc(templatePropertyNameDesc)
            .addText(text => text
                .setPlaceholder(`Example: ${TEMPLATE_PROPERTY_NAME}`)
                .setValue(this.pluginSettings.templatePropertyName)
                .onChange(async (value) => {
                    this.updateDescription(templateProperty, templatePropertyNameDesc, false);

                    if (value.trim().length === 0) {
                        this.updateDescription(templateProperty, "Can't be empty or whitespace", true);
                    } else {
                        this.pluginSettings.templatePropertyName = value;
                        await this.saveData(this.pluginSettings);
                    }
                })
            );

         const defaultOutputDirectory = new Setting(containerEl)
            .setName('Default output directory')
            .setDesc(defaultOutputDirectoryDesc)
            .addText(text => text
                .setValue(this.pluginSettings.defaultOutputDir)
                .setPlaceholder(pathPlaceholder)
                .onChange(async (value) => await this.validateAndSave(value, defaultOutputDirectory, defaultOutputDirectoryDesc, invalidDirectoryPath))
            );
    }

    private async validateAndSave(value: string, setting: Setting, description: string, errorMessage: string) {
        this.updateDescription(setting, description, false);

        if (value.length == 0 || this.isValidFolderPath(value)) {
            this.pluginSettings.defaultOutputDir = value;
            await this.saveData(this.pluginSettings);    
        } else {
            this.updateDescription(setting, errorMessage, true);
        }
    }

    private updateDescription(setting: Setting, val: string, setError: boolean) {
        setting.descEl.toggleClass('nff-error-desc', setError);
        setting.setDesc(val);
    }

    private isValidFolderPath(path: string): boolean {
        // Simple validation: folder path should not contain invalid characters and should not end with a slash
        const invalidChars = /[<>:"|?*]/;
        if (invalidChars.test(path) || path.endsWith('/')) {
            return false;
        }
        return true;
    }
}
