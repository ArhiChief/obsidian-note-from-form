import { App, Plugin, type PluginManifest } from 'obsidian';
import { DEFAULT_PLUGIN_SETTINGS, NoteFromFormPluginSettings } from './pluginSettings';
import { NoteFromFormSettingsTab } from './ui/settingsTab';


export default class NoteFromFormPlugin extends Plugin {
    settings: NoteFromFormPluginSettings;
    
    constructor(app: App, manifest: PluginManifest) {
        super(app, manifest);
        this.settings = DEFAULT_PLUGIN_SETTINGS;
    }

    async onload() {
        await this.loadSettings();

        // This adds a settings tab so the user can configure various aspects of the plugin
        this.addSettingTab(new NoteFromFormSettingsTab(this.app, this, this.settings, this.updateSettings.bind(this)));
    }

    onunload() { 

    }

    private async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_PLUGIN_SETTINGS, await this.loadData());
    }

    async updateSettings(): Promise<void> {
        await this.saveData(this.settings);
    }
}