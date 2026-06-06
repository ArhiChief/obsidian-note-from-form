import { TextAreaComponent, TextComponent } from "obsidian";
import { TextFormItem as TextFormItemTemplate, FormItemType } from "src/template/templateTypes";
import { FormItemBase } from "./formItem";
import { ExtendedSetting } from "src/ui/settingsExtension";
import { FormItemFunctionProcessor } from "./formItemFunctionProcessor";
import { IUserApi } from "src/userApi/userApi";

export class TextFormItem extends FormItemBase<string> {
    
    private readonly _placeholder: string;
    private readonly _title: string;
    private readonly _description: string;

    constructor (src: TextFormItemTemplate, funtionProcessor: FormItemFunctionProcessor, userApi: IUserApi) {
        TextFormItem.assertType(src.type);
        super(src.id, src.type, funtionProcessor, userApi, src.init, src.get, src.validate, src.form);

        this._placeholder = src.form?.placeholder ?? "";
        this._title = src.form?.title ?? "";
        this._description = src.form?.description ?? "";
    }

    protected assignToFormImpl(contentEl: HTMLElement): ExtendedSetting {
        const setting = new ExtendedSetting(contentEl)
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
        return setting;
    }

    private configureComponent() : (component: TextAreaComponent | TextComponent) => TextAreaComponent | TextComponent {
        return component => component
            .setPlaceholder(this._placeholder)
            .setValue(this.value!)
            .onChange(newVal => this.value = newVal);
    }

    protected getFunctionDefault(): string {
        return this.value!;
    }

    protected getInitValueFromString(valStr: string): string {
        return valStr;
    }

    protected getInitValueDefault(): string {
        return "";
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