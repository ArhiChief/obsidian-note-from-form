import { App, FileManager, TFile } from 'obsidian';
import { NoteFromFormPluginSettings } from '../pluginSettings';
import { NoteTemplate } from './templateTypes';
import { validateTemplate } from './templateValidator';

export class TemplateProcessor {
    private fileManager: FileManager;

    constructor(
        app: App,
        private settings: NoteFromFormPluginSettings,
    ) {
        this.fileManager = app.fileManager;
    }

    async process(file: TFile) {
        let templateData: unknown = null;

        await this.fileManager.processFrontMatter(file, (frontmatter) => {
            const propertyName = this.settings.templatePropertyName;
            const raw = frontmatter[propertyName];
            if (raw == null) return;

            templateData = typeof raw === 'string' ? JSON.parse(raw) : raw;
        });

        if (templateData == null) return;

        const result = validateTemplate(templateData);
        if (!result.valid) {
            const errors = result.errors.slice(0, 5).join('\n');
            throw new Error(`Invalid template in "${file.path}":\n${errors}`);
        }

        const template = templateData as NoteTemplate;

        // TODO: build form from validated template
    }
}
