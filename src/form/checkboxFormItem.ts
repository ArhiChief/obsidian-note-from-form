import { CheckboxFormItem as CheckboxFormItemTemplate, FormItemType } from "src/template/templateTypes";
import { FormItemBase } from "./formItem";
import { ExtendedSetting } from "src/ui/settingsExtension";
import { FormItemFunctionProcessor } from "./formItemFunctionProcessor";

export class CheckboxFormItem extends FormItemBase<boolean> {

    constructor(src: CheckboxFormItemTemplate, funtionProcessor: FormItemFunctionProcessor) {
        CheckboxFormItem.assertType(src.type);
        super(src.id, src.type, funtionProcessor, src.init, src.get, src.validate, src.form);
    }

    protected assignToFormImpl(contentEl: HTMLElement): ExtendedSetting {
        return new ExtendedSetting(contentEl)
            .setName(this._title)
            .setDesc(this._description)
            .addToggle(toggle => toggle
                .setValue(this.value!)
                .onChange(newVal => this.value = newVal)
            );
    }

    protected getFunctionDefault(): string {
        return String(this.value!);
    }

    protected getInitValueFromString(valStr: string): boolean {
        return valStr.toLowerCase() === 'true';
    }

    protected getInitValueDefault(): boolean {
        return false;
    }

    private static assertType(type: FormItemType): void {
        if (type !== 'checkbox') {
            throw new Error(`Unsupported type: ${type}`);
        }
    }
}
