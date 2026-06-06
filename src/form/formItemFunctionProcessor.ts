import Mustache from 'mustache';
import { App, normalizePath, TFile } from "obsidian";
import { NoteFromFormPluginSettings } from 'src/pluginSettings';
import { TemplateIndexItem } from "src/template/templateIndex";

export class FormItemFunctionProcessor {
    private readonly _currentTemplate:TemplateIndexItem;
    private readonly _app: App;
    private readonly _settings: NoteFromFormPluginSettings;

    constructor(currentTemplate: TemplateIndexItem, app: App, settings: NoteFromFormPluginSettings) {
        this._currentTemplate = currentTemplate;
        this._app = app;
        this._settings = settings;
    }

    renderMustacheTemplate(templateText: string, view: Record<string, any>): string {
        return Mustache.render(templateText, view, {}, { escape: (val: string) => val });
    }

    executeFunction<TResult>(funcText: string): TResult {
        const func = eval(`(${funcText})`) as () => TResult;
        return func();
    }

    executeFunctionWithParam<TResult, TArgs extends any[]>(funcText: string, ...args: TArgs): TResult {
        const func = eval(`(${funcText})`) as (...args: TArgs) => TResult;
        return func(...args);
    }

    async executeRefFunction<TResult>(ref: string): Promise<TResult> {
        const funcText = await this.getFunctionText(ref);
        return this.executeFunction<TResult>(funcText);
    }

    async executeRefFunctionWithParam<TResult, TArgs extends any[]>(ref: string, ...args: TArgs): Promise<TResult> {
        const funcText = await this.getFunctionText(ref);
        return this.executeFunctionWithParam<TResult, TArgs>(funcText, ...args);
    }

    private async getFunctionText(ref: string): Promise<string> {
        const refParts = ref.split(':');
        let file: TFile;
        let funcName: string;

        switch(refParts.length) {
            case 1:
                file = this._currentTemplate.file;
                funcName = refParts[0];
                break;
            case 2:
                const filePath = normalizePath(refParts[0]);
                funcName = refParts[1];
                file = this._app.vault.getFileByPath(filePath) as TFile;
                if (!file) {
                    throw new Error(`File not found for reference: ${filePath}`);
                }
                break;
            default:
                throw new Error(`Invalid reference format: ${ref}`);
        }

        const fileContent = await this._app.vault.cachedRead(file);
        const pattern = this.getRegexForFunction(funcName);
        const match = fileContent.match(pattern);
        if (!match) {
            throw new Error(`Function '${funcName}' not found in file: ${file.path}`);
        }

        return match[1];
    }

    private getRegexForFunction(funcName: string): RegExp {
        return new RegExp(
            '^```js:' + this._settings.templatePropertyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ':' + funcName + '\\s*\\n([\\s\\S]*?)\\n```$',
            'm'
        );
    }
}