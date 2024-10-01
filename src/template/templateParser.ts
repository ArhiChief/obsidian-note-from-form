import { App, Notice, TAbstractFile, TFile, TFolder, type Vault } from "obsidian";
import { NoteFromFormPluginSettings } from "src/pluginSettings";
import { FormDisplay, GetFunctionType, InitFunctionType, Template, TemplateFormItem, TemplateFormItemType, TemplateFunction, TemplateInput, TemplateInputFormItem } from "./template";
import { base64Encode, nameof } from "src/helpers";
import { showMessageBox } from "src/ui/messageBox";


const TEMPLATE_PROPS_EXTRACTOR_REGEX = new RegExp("---(.*?)---(.*)$", "ms");
const TEMPLATE_FUNC_EXTRACTOR_REGEX = new RegExp("(.):(.+)$");

export class TemplateParser {

    private readonly _app: App;
    private readonly _vault: Vault;
    private readonly  _settings: NoteFromFormPluginSettings

    constructor(app: App, settings: NoteFromFormPluginSettings) {
        this._app = app;
        this._vault = app.vault;
        this._settings = settings;
    }

    async parse(): Promise<Template[] | null> {

        const folder = this._vault.getFolderByPath(this._settings.templatesFolderLocation);

        if (!folder) {
            showMessageBox(this._app, "Error", `Directory "${this._settings.templatesFolderLocation}" was not found in Vault.`);
            return null;
        }

        return await this.parseDirectory(folder);
    }

    private async parseDirectory(dir: TFolder, templateNamePrefix?: string): Promise<Template[]> {

        let result: Template[] = [];

        for (let i: number = 0; i < dir.children.length; i++)
        {
            const item: TAbstractFile = dir.children[i];

            if (item instanceof TFile) {
                const template = await this.parseFile(<TFile>item, templateNamePrefix);

                if (template) {
                    result.push(template);
                }

            } else {
                const prefix = `${templateNamePrefix ?? ""}${item.name} -> `;
                const subDirTemplates:Template[] =  await this.parseDirectory(<TFolder>item, prefix) ;
                result = result.concat(subDirTemplates);
            }
        }

        return result;
    }

    private async parseFile(file: TFile, templateNamePrefix?: string) : Promise<Template | null> {
        
        const data = await this._vault.read(file);
        const matches = data.match(TEMPLATE_PROPS_EXTRACTOR_REGEX);

        if (matches && matches.length == 3) {
            const props:string = matches[1];
            const body:string = matches[2];

            try {
                
                const formTemplateRegex = new RegExp(`${this._settings.templatePropertyName}\s*\:\s*(.+\})`, "ms");
                const matches = props.match(formTemplateRegex);

                if (matches && matches.length == 2) {
                    const formTemplate = matches[1];
                    const newProps = props.replace(formTemplateRegex, "")

                    return this.createTemplate(file.basename, body, newProps, formTemplate, templateNamePrefix);
                }

            } catch (e) {
                const error = <Error>e;
                showMessageBox(this._app, "Error", `Failed to parse template '${file.path}'. ${error.message}`);
                return null;
            }
        }

        showMessageBox(this._app, "Error", `File "${file.path}" doens't have frontmatter properties.`)

        return null;
    }

    private createTemplate(name: string, body: string, props: string, formTemplateText: string, templateNamePrefix?: string): Template {
        
        const templateText:string = (<string[]>[
            "---",
            props,
            "---",
            body,
        ]).join("");

        let formTemplate: TemplateInput
        try {
            formTemplate = <TemplateInput>JSON.parse(formTemplateText);
        } catch(error) {
            throw new Error(`${error}`);
        }

        templateNamePrefix ??= "";

        const result: Template = {
            name: `${templateNamePrefix}${name}`,
            text: base64Encode(templateText),
            fileLocation: this.getOutputDir(formTemplate),
            fileName: this.getFileName(formTemplate),
            formItems: this.getFormItems(formTemplate),
        };

        return result;
    }

    private getFileName(data: TemplateInput): TemplateFunction<GetFunctionType> | undefined {
        const path =  nameof<TemplateInput>("file-name");
        return this.getTemplateGetFunction(data, path, path);
    }

    private getOutputDir(data: TemplateInput) : TemplateFunction<GetFunctionType> {
        const path = nameof<TemplateInput>("file-location");
        const result = this.getTemplateGetFunction(data, path, path);
        return result 
            ? result
            : {
                type: GetFunctionType.Value,
                text: this._settings.outputDir,
            };
    }

    private getTemplateGetFunction(data: any, prop: string, path: string): TemplateFunction<GetFunctionType> | undefined {
        if (data[prop]) {
            
            const val:string = data[prop];

            const match = val.match(TEMPLATE_FUNC_EXTRACTOR_REGEX);
            if (match && match.length == 3) {
                TemplateParser.assertGetFunction(path, match[1]);
                return {
                    type: <GetFunctionType>match[1],
                    text: match[2],
                }
            }
        }

        return undefined;
    }

    private getTemplateInitFunction(data: any, prop: string, path: string): TemplateFunction<InitFunctionType> | undefined {
        if (data[prop]) {
            
            const val:string = data[prop];

            const match = val.match(TEMPLATE_FUNC_EXTRACTOR_REGEX);
            if (match && match.length == 3) {
                TemplateParser.assertInitFunction(path, match[1]);
                return {
                    type: <InitFunctionType>match[1],
                    text: match[2],
                }
            }
        }

        return undefined;
    }

    private getFormItems(data: TemplateInput): TemplateFormItem[] {
        if (!data["form-items"]) {
            throw new Error(`'${nameof<TemplateInput>("form-items")}' are missing`);
        }

        const formItems: TemplateFormItem[] = [];

        for (let i = 0; i < data["form-items"].length; i++) {
            const item: TemplateInputFormItem = data["form-items"][i];

            let formItem: TemplateFormItem = {
                id: TemplateParser.assertFormItemId(i, item.id),
                type: <TemplateFormItemType>TemplateParser.assertFormItemType(i, item.type),
                get: this.getTemplateGetFunction(item, nameof<TemplateFormItem>("get"), `${nameof<TemplateInput>("form-items")}[${i}].${nameof<TemplateFormItem>("get")}`),
                init: this.getTemplateInitFunction(item, nameof<TemplateFormItem>("init"), `${nameof<TemplateInput>("form-items")}[${i}].${nameof<TemplateFormItem>("init")}`),
                form: this.getForm(item),
            };

            formItems.push(formItem);
        }

        return formItems;
    }

    private getForm(data: any): FormDisplay | undefined {
        if (data[nameof<TemplateFormItem>("form")]) {
            data = data[nameof<TemplateFormItem>("form")];
            return {
                title: data[nameof<FormDisplay>("title")],
                description: data[nameof<FormDisplay>("description")],
                placeholder: data[nameof<FormDisplay>("placeholder")]
            };
        }

        return undefined;
    }

    private static assertInitFunction(path: string, val?: string): string {
        const predicate: (val?: string) => boolean  = v => {
            if (!v || v.length === 0) return false;
            switch(v) {
                case InitFunctionType.Function:
                case InitFunctionType.Value:
                    return true;
                default:
                    return false;
            }
        }

        return this.assert(predicate, `Failed to parse '${path}: unsupported ${val}:`, val);
    }

    private static assertGetFunction(path: string, val?: string): string {
        const predicate: (val?: string) => boolean  = v => {
            if (!v || v.length === 0) return false;
            switch(v) {
                case GetFunctionType.Function:
                case GetFunctionType.Template:
                case GetFunctionType.Value:
                    return true;
                default:
                    return false;
            }
        }

        return this.assert(predicate, `Failed to parse '${path}: unsupported ${val}:`, val);
    }

    private static assertFormItemId(index: number, val?: string): string {
        const predicate: (val?: string) => boolean  = v => !(!v || v.length === 0);

        return this.assert(predicate, `Failed to parse 'form-items' element ${index}: 'id' is missing, null, or empty`, val);
    }

    private static assertFormItemType(index: number, val?: string) {
        const predicate: (val?: string) => boolean  = v => {
            if (!v || v.length === 0) return false;    
            switch (v) {
                case TemplateFormItemType.Text:
                case TemplateFormItemType.TextArea:
                case TemplateFormItemType.Date:
                case TemplateFormItemType.Time:
                case TemplateFormItemType.DateTime:
                case TemplateFormItemType.Number:
                    return true;
                default:
                    return false;
            }
        };

        return this.assert(predicate, `Failed to parse 'form-items' element ${index}: '${val}' is not supported item type`, val);
    }

    private static assert<TField>(predicate: (val?: TField) => boolean, message: string, field?: TField): TField {
        if (!predicate(field)) {
            throw new Error(message);
        }

        return <TField>field;
    }

}