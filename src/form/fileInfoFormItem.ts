import { FormDisplay, TemplateFormItemType, TemplateGetFunction, TemplateGetFunctionType, TemplateInitFunction } from "src/template/template";
import { FormItem, FormItemBase } from "./formItem";
import { normalizePath, Setting } from "obsidian";

abstract class FileInfoFormItem extends FormItemBase<string> {

    private readonly _getSrc?: TemplateGetFunction;

    protected constructor (id: string, title: string, src?: TemplateGetFunction) {

        let formDisplay: FormDisplay | undefined;
        let initValue: string;
        
        if (!src) {
            initValue = "";
            formDisplay = {
                description: "",
                title: title,
                placeholder: "",
            };
        } else {
            initValue = "";
        }

        super(id, TemplateFormItemType.Text, initValue, formDisplay);
        this._getSrc = src;
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

    protected getImpl(view: Record<string, any>): string {
        if (!this._getSrc) {
            return this.value;
        }

        switch(this._getSrc.type) {
            case TemplateGetFunctionType.Template:
                return FileInfoFormItem.renderMustacheTemplate(this._getSrc.setterText, view);
            case TemplateGetFunctionType.Function:
                return FileInfoFormItem.executeGetFunction(this._getSrc.setterText, view);
            default: 
                throw 1;
        }
    }
}

const INVALID_FILENAME_CHARS = /[:[\]?/\\]/g;
const INVALID_PATH_CHARS = /[:[\]?\\]/g;

export class FileNameFormItem extends FileInfoFormItem {
    constructor (src?: TemplateGetFunction){
        super("fileName", "File Name", src);
    }

    get(src: Record<string, unknown>): string {
        let result:string = super.get(src);

        return normalizePath(result.replace(INVALID_FILENAME_CHARS, ""));
    }
}

export class FileLocationFormItem extends FileInfoFormItem {
    constructor (src?: TemplateGetFunction) {
        super("fileLocation", "File Name", src);
    }

    get(src: Record<string, unknown>): string {
        let result:string = super.get(src);

        return result.replace(INVALID_PATH_CHARS, "");
    }
}