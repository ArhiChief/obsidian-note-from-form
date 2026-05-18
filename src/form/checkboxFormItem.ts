import { Setting } from "obsidian";
import { CheckboxFormItem as CheckboxFormItemTemplate, InitFunctionString, ValueString, FormItemType } from "src/template/templateTypes";
import { FormItemBase } from "./formItem";

export class CheckboxFormItem extends FormItemBase<boolean> {

    constructor(src: CheckboxFormItemTemplate) {
        CheckboxFormItem.assertType(src.type);

        const initValue = CheckboxFormItem.getInitValue(src.init);

        super(src.id, src.type, initValue, src.get, src.form);
    }

    protected assignToFormImpl(contentEl: HTMLElement): void {
        new Setting(contentEl)
            .setName(this._title)
            .setDesc(this._description)
            .addToggle(toggle => toggle
                .setValue(this.value)
                .onChange(newVal => this.value = newVal)
            );
    }

    protected getFunctionDefault(): string {
        return String(this.value);
    }

    private static getInitValue(src?: InitFunctionString | ValueString): boolean {
        if (!src) {
            return false;
        }

        if (src.startsWith('f:')) {
            return FormItemBase.executeInitFunction<boolean>(src.slice(2));
        } else if (src.startsWith('v:')) {
            return src.slice(2).toLowerCase() === 'true';
        } else {
            throw new Error(`Unsupported init value: ${src}`);
        }
    }

    private static assertType(type: FormItemType): void {
        if (type !== 'checkbox') {
            throw new Error(`Unsupported type: ${type}`);
        }
    }
}
