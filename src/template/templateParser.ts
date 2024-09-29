import { Notice, TAbstractFile, TFile, TFolder, type Vault } from "obsidian";
import { NoteFromFormPluginSettings } from "src/pluginSettings";
import { FormDisplay, GetFunctionType, InitFunctionType, Template, TemplateFormItem, TemplateFunction, TemplateInput } from "./template";
import { base64Encode, nameof } from "src/helpers";


const TEMPLATE_PROPS_EXTRACTOR_REGEX = new RegExp("---(.*?)---(.*)$", "ms");
const TEMPLATE_FUNC_EXTRACTOR_REGEX = new RegExp("(.):(.+)$");

export class TemplateParser {

    private _vault: Vault;
    private _settings: NoteFromFormPluginSettings

    constructor(vault: Vault, settings: NoteFromFormPluginSettings) {
        this._vault = vault;
        this._settings = settings;
    }

    async parse(): Promise<Template[] | null> {

        const folder = this._vault.getFolderByPath(this._settings.templatesFolderLocation);

        if (!folder) {
            new Notice(`Folder '${this._settings.templatesFolderLocation}' doesn't exist!`, 0);
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

            } catch (error) {
                console.error("Couldn't parse template frontmatter: ", props)
                console.error("Error: ", error)
            }
        }

        console.debug("No properties were found in ", file.path);

        return null;
    }

    private createTemplate(name: string, body: string, props: string, formTemplateText: string, templateNamePrefix?: string): Template {
        
        const templateText:string = (<string[]>[
            "---",
            props,
            "---",
            body,
        ]).join("");

        const formTemplate = <TemplateInput>JSON.parse(formTemplateText);

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
        return this.getTemplateGetFunction(data, nameof<TemplateInput>("file-name"));
    }

    private getOutputDir(data: TemplateInput) : TemplateFunction<GetFunctionType> {
        const result = this.getTemplateGetFunction(data, nameof<TemplateInput>("file-location"));
        return result 
            ? result
            : {
                type: GetFunctionType.Template,
                text: this._settings.outputDir,
            };
    }

    private getTemplateGetFunction(data: any, prop: string) :  TemplateFunction<GetFunctionType> | undefined {
        if (data[prop]) {
            
            const val:string = data[prop];

            const match = val.match(TEMPLATE_FUNC_EXTRACTOR_REGEX);
            if (match && match.length == 3) {
                return {
                    type: <GetFunctionType>match[1],
                    text: match[2],
                }
            }
        }

        return undefined;
    }

    private getTemplateInitFunction(data: any, prop: string) :  TemplateFunction<InitFunctionType> | undefined {
        if (data[prop]) {
            
            const val:string = data[prop];

            const match = val.match(TEMPLATE_FUNC_EXTRACTOR_REGEX);
            if (match && match.length == 3) {
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
            throw 1;
        }

        const formItems: TemplateFormItem[] = [];

        for (let i = 0; i < data["form-items"].length; i++) {
            const item = data["form-items"][i];

            let formItem: TemplateFormItem = {
                id: item.id,
                type: item.type,
                get: this.getTemplateGetFunction(item, nameof<TemplateFormItem>("get")),
                init: this.getTemplateInitFunction(item, nameof<TemplateFormItem>("init")),
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
}