import { InitFunctionType, TemplateFormItem, TemplateFormItemType, TemplateFunction } from "src/template/template";
import { TextAreaComponent, TextComponent } from "obsidian";
import { SettingExtended } from "src/ui/settingExtensions";
import { FormItemBase } from "./formItemBase";


export class TextFormItem extends FormItemBase<string> {
    
    constructor (src: TemplateFormItem) {

        TextFormItem.assertType(src.type);

        const initValue =  TextFormItem.getInitValue(src.init);

        super(src.id, src.type, initValue, src.get, src.form);
    }

    protected assignToFormImpl(contentEl: HTMLElement): void {
        const setting = new SettingExtended(contentEl)
            .setName(this._title)
            .setDesc(this._description);
        
        switch(this.type) {
            case TemplateFormItemType.Text:
                setting.addText(this.configureComponent());
                break;
            case TemplateFormItemType.TextArea:
                setting.addTextArea(this.configureComponent());
                break;
            default:
                throw new Error(`Unsupported type: ${this.type}`);
        }
    }

    private configureComponent() : (component: TextAreaComponent | TextComponent) => any {

        return component => component
            .setPlaceholder(this._placeholder)
            .setValue(this.value)
            .onChange(newVal => this.value = newVal);
    }

    protected getFunctionDefault(): string {
        return this.value;
    }

    private static getInitValue(src?: TemplateFunction<InitFunctionType>): string {

        if (!src) {
            return "";
        }

        const { type, text } =  src;
        switch(type) {
            case InitFunctionType.Function:
                return TextFormItem.executeInitFunction(text);
            case InitFunctionType.Value:
                return text;
            default:
                throw 1;
        }
    }

    private static assertType (type: TemplateFormItemType): void {
        switch (type) {
            case TemplateFormItemType.Text:
            case TemplateFormItemType.TextArea:
                return;
            default:
                throw new Error(`Unsupported type: ${type}`);
        }
    }
}