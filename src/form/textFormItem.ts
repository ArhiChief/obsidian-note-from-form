import { Setting, TextAreaComponent, TextComponent } from "obsidian";
import { TextFormItem as TextFormItemTemplate, InitFunctionString, ValueString, FormItemType } from "src/template/templateTypes";
import { FormItemBase } from "./formItem";

export class TextFormItem extends FormItemBase<string> {
    
    private readonly _placeholder: string = "";

    constructor (src: TextFormItemTemplate) {

        TextFormItem.assertType(src.type);

        const initValue =  TextFormItem.getInitValue(src.init);

        super(src.id, src.type, initValue, src.get, src.form);

        if (src.form?.placeholder) {
            this._placeholder = src.form.placeholder;
        }
    }

    protected assignToFormImpl(contentEl: HTMLElement): void {
        const setting = new Setting(contentEl)
            .setName(this._title)
            .setDesc(this._description);
        
        switch(this.type) {
            case 'text':
                setting.addText(this.configureComponent());
                break;
            case 'textArea':
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

    private static getInitValue(src?: InitFunctionString | ValueString): string {

        if (!src) {
            return "";
        }

        if (src.startsWith('f:')) {
            return FormItemBase.executeInitFunction(src.slice(2));
        } else if (src.startsWith('v:')) {
            return src.slice(2);
        } else {
            throw new Error(`Unsupported init value: ${src}`);
        }
    }

    private static assertType (type: FormItemType): void {
        switch (type) {
            case 'text':
            case 'textArea':
                return;
            default:
                throw new Error(`Unsupported type: ${type}`);
        }
    }
}