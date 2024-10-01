import { FormDisplay, GetFunctionType, Template, TemplateFormItemType, TemplateFunction} from "src/template/template";
import { FormItemBase } from "./formItemBase";
import { normalizePath } from "obsidian";
import { SettingExtended } from "src/ui/settingExtensions";
import { nameof } from "src/helpers";


abstract class FileInfoFormItem extends FormItemBase<string> {

    protected constructor (id: string, title: string, src?: TemplateFunction<GetFunctionType>) {

        let formDisplay: FormDisplay | undefined = undefined;
        
        const initValue: string = "";
        
        if (!src) {
            formDisplay = { title: title };
        }

        super(id, TemplateFormItemType.Text, initValue, src, formDisplay);
    }
    
    protected assignToFormImpl(contentEl: HTMLElement): void {
        new SettingExtended(contentEl)
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
    constructor (src?: TemplateFunction<GetFunctionType>){
        super(nameof<Template>("fileName"), "File Name", src);
    }
}

export class FileLocationFormItem extends FileInfoFormItem {
    constructor (src?: TemplateFunction<GetFunctionType>) {
        super(nameof<Template>("fileLocation"), "File Location", src);
    }
}