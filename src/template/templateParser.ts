import { Notice, TAbstractFile, TFile, TFolder, type Vault } from "obsidian";

import type { NoteFromFormPluginSettings } from "../pluginSettings";
import { FormDisplay, Template, TemplateFormItem, TemplateGetFunction, TemplateGetFunctionType, TemplateInitFunction, TemplateInitFunctionType, TemplateInput } from "./template";
import { Base64 } from "../base64";

const TEMPLATE_PROPS_EXTRACTOR_REGEX = new RegExp("---(.*?)---(.*)$", "ms");
const TEMPLATE_FUNC_EXTRACTOR_REGEX = new RegExp("(.):(.+)$");

const nameof = <T>(name: Extract<keyof T, string>): string => name;

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

        return await this.parseDirectory(folder, '');
    }

    private async parseDirectory(dir: TFolder, templateNamePrefix: string): Promise<Template[]> {

        const result: Template[] = [];

        for (let i: number = 0; i < dir.children.length; i++)
        {
            const item: TAbstractFile = dir.children[i];

            if ((<TFile>item).stat !== undefined) {
                const template = await this.parseFile(<TFile>item);

                if (template !== null) {
                    result.push(template);
                }

            } else {
                const subDirTemplates:Template[] =  await this.parseDirectory(<TFolder>item, item.path);
                result.concat(subDirTemplates);
            }
        }

        return result;
    }

    private async parseFile(file: TFile) : Promise<Template | null> {
        
        const data = await this._vault.read(file);

        const matches = data.match(TEMPLATE_PROPS_EXTRACTOR_REGEX);

        if (matches && matches.length == 3) {
            let props:string = matches[1];
            const body:string = matches[2];

            try {
                
                const formTemplateRegex = new RegExp(`${this._settings.templatePropertyName}\s*\:\s*(.+\})`, "ms");
                const formTemplateMatches = props.match(formTemplateRegex);

                if (formTemplateMatches && formTemplateMatches.length == 2) {
                    const formTemplate = formTemplateMatches[1];
                    props = props.replace(formTemplateRegex, "")

                    return this.createTemplate(file.basename, body, props, formTemplate);
                }

            } catch (error) {
                console.error("Couldn't parse template frontmatter: ",props)
                console.error("Error: ", error)
            }
        }

        console.debug("No properties were found in ", file.path);

        return null;
    }

    private createTemplate(name: string, body: string, props: string, formTemplateText: string): Template {
        
        const templateText:string = (<string[]>[
            "---",
            props,
            "---",
            body,
        ]).join("");

        const formTemplate = <TemplateInput>JSON.parse(formTemplateText);

        const result: Template = {
            name: name,
            text: Base64.Encode(templateText),
            fileLocation: this.getOutputDir(formTemplate),
            fileName: this.getFileName(formTemplate),
            formItems: this.getFormItems(formTemplate),
        };

        return result;
    }

    private getFileName(data: TemplateInput): TemplateGetFunction | undefined {
        return this.getTemplateGetFunction(data, nameof<TemplateInput>("file-name"));
    }

    private getOutputDir(data: TemplateInput) : TemplateGetFunction {
        const result = this.getTemplateGetFunction(data, nameof<TemplateInput>("file-location"));
        return result 
            ? result
            : {
                type: TemplateGetFunctionType.Template,
                setterText: this._settings.outputDir,
            };
    }

    private getTemplateGetFunction(data: any, prop: string) :  TemplateGetFunction | undefined {
        if (data[prop]) {
            
            const val:string = data[prop];

            const match = val.match(TEMPLATE_FUNC_EXTRACTOR_REGEX);
            if (match && match.length == 3) {
                return <TemplateGetFunction>{
                    type: <TemplateGetFunctionType>match[1],
                    setterText: match[2],
                }
            }
        }

        return undefined;
    }

    private getTemplateInitFunction(data: any, prop: string) :  TemplateInitFunction | undefined {
        if (data[prop]) {
            
            const val:string = data[prop];

            const match = val.match(TEMPLATE_FUNC_EXTRACTOR_REGEX);
            if (match && match.length == 3) {
                return <TemplateInitFunction>{
                    type: <TemplateInitFunctionType>match[1],
                    setterText: match[2],
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
