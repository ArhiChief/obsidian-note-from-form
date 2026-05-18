import { Setting } from "obsidian";
import { NumberFormItem as NumberFormItemTemplate, InitFunctionString, ValueString, FormItemType } from "src/template/templateTypes";
import { FormItemBase } from "./formItem";

export class NumberFormItem extends FormItemBase<number> {

    constructor(src: NumberFormItemTemplate) {
        NumberFormItem.assertType(src.type);

        const initValue = NumberFormItem.getInitValue(src.init);

        super(src.id, src.type, initValue, src.get, src.form);
    }

    protected assignToFormImpl(contentEl: HTMLElement): void {
        new Setting(contentEl)
            .setName(this._title)
            .setDesc(this._description)
            .addText(text => text
                .setValue(String(this.value))
                .onChange(newVal => {
                    const parsed = Number(newVal);
                    if (!isNaN(parsed)) {
                        this.value = parsed;
                    }
                })
            );
    }

    protected getFunctionDefault(): string {
        return String(this.value);
    }

    private static getInitValue(src?: InitFunctionString | ValueString): number {
        if (!src) {
            return 0;
        }

        if (src.startsWith('f:')) {
            return FormItemBase.executeInitFunction<number>(src.slice(2));
        } else if (src.startsWith('v:')) {
            const parsed = Number(src.slice(2));
            if (isNaN(parsed)) {
                throw new Error(`Invalid number init value: ${src}`);
            }
            return parsed;
        } else {
            throw new Error(`Unsupported init value: ${src}`);
        }
    }

    private static assertType(type: FormItemType): void {
        if (type !== 'number') {
            throw new Error(`Unsupported type: ${type}`);
        }
    }
}
