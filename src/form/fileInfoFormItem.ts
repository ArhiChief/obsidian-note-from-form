import { FormDisplay, GetFunctionType, TemplateFormItemType, TemplateFunction} from "src/template/template";
import { FormItemBase } from "./formItemBase";
import { normalizePath, Setting } from "obsidian";
import { renderMustacheTemplate } from "src/helpers";


abstract class FileInfoFormItem extends FormItemBase<string> {

    private readonly _getSrc?: TemplateFunction<GetFunctionType>;

    protected constructor (id: string, title: string, src?: TemplateFunction<GetFunctionType>) {

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
            return normalizePath(this.value);
        }

        const {type, text } = this._getSrc;
        let result: string;
        switch(type) {
            case GetFunctionType.Template:
                result = renderMustacheTemplate(text, view);
                break;
            case GetFunctionType.Function:
                result = FileInfoFormItem.executeGetFunction(text, view);
                break;
            case GetFunctionType.Value:
                result = text;
                break;
            default: 
                throw 1;
        }

        return normalizePath(result);
    }
}

export class FileNameFormItem extends FileInfoFormItem {
    constructor (src?: TemplateFunction<GetFunctionType>){
        super("fileName", "File Name", src);
    }
}

export class FileLocationFormItem extends FileInfoFormItem {
    constructor (src?: TemplateFunction<GetFunctionType>) {
        super("fileLocation", "File Name", src);
    }
}