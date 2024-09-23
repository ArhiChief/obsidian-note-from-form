import { TemplateFormItem, TemplateFormItemType, TemplateGetFunction, TemplateGetFunctionType, TemplateInitFunction, TemplateInitFunctionType } from "src/template/template";
import { FormItemBase } from "./formItem";
import { SettingExtended } from "src/settingExtensions";
import { TextAreaComponent, TextComponent } from "obsidian";


export class TextFormItem extends FormItemBase<string> {
    
    private readonly _getSrc?: TemplateGetFunction;
    
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

        switch(this._getSrc.type) {
            case TemplateGetFunctionType.Template:
                return TextFormItem.renderMustacheTemplate(this._getSrc.setterText, view);
            case TemplateGetFunctionType.Function:
                return TextFormItem.executeGetFunction(this._getSrc.setterText, view);
            default: 
                throw 1;
        }
    }

    private static getInitValue(src?: TemplateInitFunction): string {

        if (!src) {
            return '';
        }

        switch(src.type) {
            case TemplateInitFunctionType.Function:
                return TextFormItem.executeInitFunction(src.setterText);
            case TemplateInitFunctionType.String:
                return src.setterText;
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