import { InitFunctionType, TemplateFormItem, TemplateFormItemType, TemplateFunction } from "src/template/template";
import { FormItemBase } from "./formItemBase";
import { SettingExtended } from "src/ui/settingExtensions";

export class CheckBoxFormItem extends FormItemBase<boolean> {
    
    constructor(src: TemplateFormItem) {
        
        CheckBoxFormItem.assertType(src.type);

        const initValue: boolean = CheckBoxFormItem.getInitValue(src.init);

        super(src.id, src.type, initValue, src.get, src.form);
    }

    protected assignToFormImpl(contentEl: HTMLElement): void {
        new SettingExtended(contentEl)
            .setName(this._title)
            .setDesc(this._description)
            .addToggle(toggle => toggle
                .setValue(this.value)
                .onChange(newVal => this.value = newVal)
            );
    }

    protected getFunctionDefault(): string {
        return this.value ? "true" : "false";
    }

    private static getInitValue(src?: TemplateFunction<InitFunctionType>): boolean {
        if (!src) {
            return false;
        }

        const { type, text } = src;
        switch(type) {
            case InitFunctionType.Value:
                return text.toLowerCase() === "true";
            case InitFunctionType.Function:
                return CheckBoxFormItem.executeInitFunction(text);
            default:
                throw new Error(`Unsupported type: ${type}`);
        }
    }

    private static assertType (type: TemplateFormItemType): void {
        if (type !== TemplateFormItemType.CheckBox) {
            throw new Error(`Unsupported type: ${type}`);
        }
    }
}