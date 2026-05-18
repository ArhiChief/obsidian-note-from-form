import { normalizePath } from "obsidian";
import { FormItemBase } from "./formItem";
import { FormItemForm, GetFunctionString, TemplateString, ValueString } from "src/template/templateTypes";
import { ExtendedSetting } from "src/ui/settingsExtension";

abstract class FileInfoFormItem extends FormItemBase<string> {

    private readonly _placeholder: string;

    protected constructor (
        id: string, 
        title: string,
        description: string,
        placeholder: string,
        getFunc?: GetFunctionString | TemplateString | ValueString) {

        let formDisplay: FormItemForm | undefined = undefined;
        
        const initValue: string = "";
        
        if (!getFunc) {
            formDisplay = { 
                title: title,
                description: description,
            };
        }

        super(id, 'text', initValue, getFunc, formDisplay);
        this._placeholder = placeholder;
    }
    
    protected assignToFormImpl(contentEl: HTMLElement): void {
        new ExtendedSetting(contentEl)
            .setName(this._title)
            .setDesc(this._description)
            .addText(text => text
                .setPlaceholder(this._placeholder)
                .setValue(this.value)
                .onChange(newVal => this.value = newVal)
            );
    }

    get(view: Record<string, any>): string {
        const result = super.get(view);
        return normalizePath(result);
    }

    protected getFunctionDefault(): string {
        return this.value;
    }
}

export class FileNameFormItem extends FileInfoFormItem {

    private static readonly _title: string = "Name of created note";
    private static readonly _placeholder: string = "My Fancy Note";

    constructor (getFunc?: GetFunctionString | TemplateString | ValueString) {
        super("fileName", "File name", FileNameFormItem._title, FileNameFormItem._placeholder, getFunc);
    }
}

export class FileLocationFormItem extends FileInfoFormItem {
    private static readonly _title: string = "Folder where note will be placed";
    private static readonly _placeholder: string = "/some/path/";

    constructor (getFunc?: GetFunctionString | TemplateString | ValueString) {
        super("fileLocation", "File location", FileLocationFormItem._title, FileLocationFormItem._placeholder, getFunc);
    }
}