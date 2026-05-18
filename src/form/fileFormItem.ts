import { Setting, normalizePath } from "obsidian";
import { FormItemBase } from "./formItem";
import { FormItemForm, GetFunctionString, TemplateString, ValueString } from "src/template/templateTypes";

abstract class FileInfoFormItem extends FormItemBase<string> {

    private readonly _placeholder = "e.g. {{value}}";

    protected constructor (
        id: string, 
        title: string, 
        getFunc?: GetFunctionString | TemplateString | ValueString) {

        let formDisplay: FormItemForm | undefined = undefined;
        
        const initValue: string = "";
        
        if (!getFunc) {
            formDisplay = { title: title };
        }

        super(id, 'text', initValue, getFunc, formDisplay);
    }
    
    protected assignToFormImpl(contentEl: HTMLElement): void {
        new Setting(contentEl)
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
    constructor (getFunc?: GetFunctionString | TemplateString | ValueString) {
        super("fileName", "File name", getFunc);
    }
}

export class FileLocationFormItem extends FileInfoFormItem {
    constructor (getFunc?: GetFunctionString | TemplateString | ValueString) {
        super("fileLocation", "File location", getFunc);
    }
}