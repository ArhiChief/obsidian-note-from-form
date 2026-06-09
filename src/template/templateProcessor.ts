import { App, normalizePath, Notice, TFile, TFolder } from 'obsidian';
import Mustache from 'mustache';
import { NoteFromFormPluginSettings } from '../pluginSettings';
import { NoteTemplate } from './templateTypes';
import { validateTemplate } from './templateValidator';
import { FormItemsManager } from 'src/form/formItemManager';
import { InputFormModal } from 'src/ui/inputFormModal';
import { TemplateIndexItem } from './templateIndex';
import { FormItem } from 'src/form/formItem';
import { FileLocationFormItem, FileNameFormItem } from 'src/form/fileFormItem';
import { FormItemFunctionProcessor } from 'src/form/formItemFunctionProcessor';
import { UserApi } from 'src/userApi/userApi';

export class TemplateProcessor {
    private readonly _app: App;
    private readonly _settings: NoteFromFormPluginSettings;

    constructor(
        app: App,
        settings: NoteFromFormPluginSettings,
    ) {
        this._app = app;
        this._settings = settings;
    }

    async useTemplate(indexedTemplate: TemplateIndexItem) {
        let templateData: unknown = null;
        let parsingError: Error | null = null;

        await this._app.fileManager.processFrontMatter(indexedTemplate.file, (frontmatter) => {
            const propertyName = this._settings.templatePropertyName;
            const raw = frontmatter[propertyName];
            if (raw == null) return;

            try {
                if (typeof raw === 'string') {
                    templateData = JSON.parse(raw);
                } else {
                    templateData =  raw;
                }
            } catch (e: unknown) {
                parsingError = e as Error;
            }
        });

        if (templateData == null) {
            if (parsingError) {
                throw new Error(`Error parsing template in "${indexedTemplate.file.path}":\n${(parsingError as Error).message}`);
            }

            throw new Error(`No template found in "${indexedTemplate.file.path}"`);
        }

        const result = validateTemplate(templateData);
        if (!result.valid) {
            const errors = result.errors.slice(0, 5).join('\n');
            throw new Error(`Invalid template in "${indexedTemplate.file.path}":\n${errors}`);
        }

        const template = templateData as NoteTemplate;
        const functionProcessor = new FormItemFunctionProcessor(indexedTemplate, this._app, this._settings);
        const userApi = new UserApi(this._settings, this._app, this);
        const formItems = await FormItemsManager.getFormItems(template, functionProcessor, this._settings, userApi);

        const inputForm = new InputFormModal(this._app, indexedTemplate, formItems, template, this.createNoteFromTemplate.bind(this));
        inputForm.open();
    }

    private async createNoteFromTemplate(formItems: FormItem[], indexedTemplate: TemplateIndexItem, templateData: NoteTemplate): Promise<boolean> {

        try {
            const rawViewModel = FormItemsManager.getRawViewModel(formItems);
            const isValid = await FormItemsManager.validateItems(formItems, rawViewModel);
            if (!isValid) {
                return false;
            }
        } catch (e) {
            new Notice(`Error validating form items: ${(e as Error).message}`);
            return false;
        }

        let viewModel: Record<string, string>;
        try {
            viewModel = await FormItemsManager.getViewModel(formItems);
        } catch (e) {
            new Notice(`Error processing form items: ${(e as Error).message}`);
            return false;
        }

        try {
            var userApi = new UserApi(this._settings, this._app, this);
            var functionProcessor = new FormItemFunctionProcessor(indexedTemplate, this._app, this._settings);
            await FormItemsManager.beforeCreate(templateData, functionProcessor, userApi, viewModel);
        }catch (e) {
            new Notice(`Error creating note: ${(e as Error).message}`);
            return false;
        }

        await this.renderTemplate(indexedTemplate.file, viewModel);

        return true;
    }

    async renderTemplate(template: TFile, viewModel: Record<string, string>): Promise<void> {
        const dirPath = normalizePath(viewModel[FileLocationFormItem.FormFieldId]);
        const folder = await this.ensureFolderExists(dirPath);
        const newNote = await this.createNewNote(template, folder, viewModel[FileNameFormItem.FormFieldId]);
        await this.sanitizeNewNote(newNote);
        await this.applyViewModelToNote(newNote, viewModel);
    }


    private async ensureFolderExists(path: string) : Promise<TFolder> {
        let folder = this._app.vault.getFolderByPath(path);
        if (!folder) {
            folder = await this._app.vault.createFolder(path);
        }

        return folder;
    }

    private async createNewNote(originalFile: TFile, location: TFolder, name: string): Promise<TFile> {
        const newNotePath = normalizePath(`${location.path}/${name}.md`);
        const newNote = await this._app.vault.copy(originalFile, newNotePath);

        return newNote;
    }

    private async sanitizeNewNote(file: TFile): Promise<TFile> {
        await this._app.fileManager.processFrontMatter(file, (frontmatter) => {
            delete frontmatter[this._settings.templatePropertyName];
        });

        const codeBlockPattern = this.getCodeBlockPattern();
        await this._app.vault.process(file, (content: string) => {
            return content.replace(codeBlockPattern, '');
        });

        return file;
    }

    private getCodeBlockPattern(): RegExp {
        const propName = this._settings.templatePropertyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(
            '\\n?^```js:' + propName + ':[a-zA-Z_$][a-zA-Z0-9_$]*\\s*\\n[\\s\\S]*?\\n```$',
            'gm'
        );
    }

    private async applyViewModelToNote(note: TFile, viewModel: Record<string, string>): Promise<void> {
        await this._app.vault.process(note, (content) => {
            return Mustache.render(content, viewModel, {}, { escape: (val: string) => val });
        });
    }
}
