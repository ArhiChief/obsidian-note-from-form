import { App, FileManager, TFile } from 'obsidian';
import { NoteFromFormPluginSettings } from '../pluginSettings';
import { NoteTemplate } from './templateTypes';
import { validateTemplate } from './templateValidator';
import { FormItemsManager } from 'src/form/formItemManager';
import { InputFormModal } from 'src/ui/inputFormModal';
import { TemplateIndexItem } from './templateIndex';

export class TemplateProcessor {
    private fileManager: FileManager;
    private readonly _app: App;

    constructor(
        app: App,
        private settings: NoteFromFormPluginSettings,
    ) {
        this.fileManager = app.fileManager;
        this._app = app;
    }

    async process(indexedTemplate: TemplateIndexItem) {
        let templateData: unknown = null;

        await this.fileManager.processFrontMatter(indexedTemplate.file, (frontmatter) => {
            const propertyName = this.settings.templatePropertyName;
            const raw = frontmatter[propertyName];
            if (raw == null) return;

            templateData = typeof raw === 'string' ? JSON.parse(raw) : raw;
        });

        if (templateData == null) return;

        const result = validateTemplate(templateData);
        if (!result.valid) {
            const errors = result.errors.slice(0, 5).join('\n');
            throw new Error(`Invalid template in "${indexedTemplate.file.path}":\n${errors}`);
        }

        const template = templateData as NoteTemplate;
        var formItems = FormItemsManager.getFormItems(template);

        var inputForm = new InputFormModal(this._app, indexedTemplate.label, formItems, () => this.createNote("some/path", "some content"));
        inputForm.open();
    }

    private async createNote(filePath: string, content: string): Promise<void> {
    }
}
