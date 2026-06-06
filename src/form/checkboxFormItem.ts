import { CheckboxFormItem as CheckboxFormItemTemplate, FormItemType } from "src/template/templateTypes";
import { FormItemBase } from "./formItem";
import { ExtendedSetting } from "src/ui/settingsExtension";
import { FormItemFunctionProcessor } from "./formItemFunctionProcessor";
import { IUserApi } from "src/userApi/userApi";

export class CheckboxFormItem extends FormItemBase<boolean> {

    private readonly _title: string;
    private readonly _description: string;

    constructor(src: CheckboxFormItemTemplate, funtionProcessor: FormItemFunctionProcessor, userApi: IUserApi) {
        CheckboxFormItem.assertType(src.type);
        super(src.id, src.type, funtionProcessor, userApi, src.init, src.get, src.validate, src.form);
        
        this._title = src.form?.title ?? "";
        this._description = src.form?.description ?? "";
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
