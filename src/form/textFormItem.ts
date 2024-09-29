import { GetFunctionType, InitFunctionType, TemplateFormItem, TemplateFormItemType, TemplateFunction } from "src/template/template";
import { TextAreaComponent, TextComponent } from "obsidian";
import { SettingExtended } from "src/ui/settingExtensions";
import { FormItemBase } from "./formItemBase";
import { renderMustacheTemplate } from "src/helpers";


export class TextFormItem extends FormItemBase<string> {
    
    private readonly _getSrc?: TemplateFunction<GetFunctionType>;
    
    constructor (src: TemplateFormItem) {
        TextFormItem.assertType(src.type);

        const initValue =  TextFormItem.getInitValue(src.init);

        super(src.id, src.type, initValue, src.form);

        this._getSrc = src.get;
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
                throw 1;
        }
    }

    private configureComponent() : (component: TextAreaComponent | TextComponent) => any {

        return component => component
            .setPlaceholder(this._placeholder)
            .setValue(this.value)
            .onChange(newVal => this.value = newVal);
    }

    protected getImpl(view: Record<string, any>): string {
        if (!this._getSrc) {
            return this.value;
        }

        const { type, text } = this._getSrc;
        switch(type) {
            case GetFunctionType.Template:
                return renderMustacheTemplate(text, view);
            case GetFunctionType.Function:
                return TextFormItem.executeGetFunction(text, view);
            case GetFunctionType.Value:
                    return text;
            default: 
                throw 1;
        }
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

    private static assertType (type: TemplateFormItemType) {
        switch (type) {
            case TemplateFormItemType.Text:
            case TemplateFormItemType.TextArea:
                return;
            default:
                throw 1;
        }
    }
}