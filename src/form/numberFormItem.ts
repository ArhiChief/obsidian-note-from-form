import { NumberFormItem as NumberFormItemTemplate, FormItemType } from "src/template/templateTypes";
import { FormItemBase } from "./formItem";
import { ExtendedSetting } from "src/ui/settingsExtension";
import { FormItemFunctionProcessor } from "./formItemFunctionProcessor";

export class NumberFormItem extends FormItemBase<number> {

    constructor(src: NumberFormItemTemplate, funtionProcessor: FormItemFunctionProcessor) {
        NumberFormItem.assertType(src.type);
        super(src.id, src.type, funtionProcessor, src.init, src.get, src.validate, src.form);
    }

    protected assignToFormImpl(contentEl: HTMLElement): ExtendedSetting {
        return new ExtendedSetting(contentEl)
            .setName(this._title)
            .setDesc(this._description)
            .addNumber(comp => comp
                .setValue(this.value!)
                .onChange(newVal => {
                    const parsed = Number(newVal);
                    if (!isNaN(parsed)) {
                        this.value = parsed;
                    }
                })
            );
    }

    protected getFunctionDefault(): string {
        return String(this.value!);
    }

    protected getInitValueFromString(valStr: string): number {
        const parsed = Number(valStr);
            if (isNaN(parsed)) {
                throw new Error(`Invalid number init value: ${valStr}`);
            }
            return parsed;
    }

    protected getInitValueDefault(): number {
        return 0;
    }

    private static assertType(type: FormItemType): void {
        if (type !== 'number') {
            throw new Error(`Unsupported type: ${type}`);
        }
    }
}
