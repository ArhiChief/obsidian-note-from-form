
export const TEMPLATE_PROPERTY_NAME = "note-from-form";

export interface NoteFromFormPluginSettings {
    templatesFolderLocation: string;
    templatePropertyName: string;
    outputDir: string,
}

export const DEFAULT_PLUGIN_SETTINGS: NoteFromFormPluginSettings = {
    templatesFolderLocation: '',
    templatePropertyName: TEMPLATE_PROPERTY_NAME,
    outputDir: '',
};
