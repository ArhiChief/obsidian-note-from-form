import { GetFunctionType, InitFunctionType, TemplateFormItem, TemplateFormItemType, TemplateFunction } from "src/template/template";
import { FormItemBase } from "./formItemBase";
import { SettingExtended } from "src/ui/settingExtensions";


export class NumberFormItem extends FormItemBase<number> {

    private readonly _getSrc?: TemplateFunction<GetFunctionType>;

    constructor(src: TemplateFormItem) {
        NumberFormItem.assertType(src.type);

        const initValue = NumberFormItem.getInitValue(src.init);

        super(src.id, src.type, initValue, src.get, src.form);

        this._getSrc = src.get;
    }
    
    protected assignToFormImpl(contentEl: HTMLElement): void {
        new SettingExtended(contentEl)
            .setName(this._title)
            .setDesc(this._description)
            .addNumber(comp => comp
                .setValue(this.value)
                .onChange(newVal => this.value = newVal)
            );
    }

    protected getFunctionDefault(): string {
        return this.value.toString();
    }

    private static getInitValue(src?: TemplateFunction<InitFunctionType>): number {
        if (!src) {
            return 0;
        }

        const { type, text } = src;
        switch(type) {
            case InitFunctionType.Value:
                return Number.parseFloat(text);
            case InitFunctionType.Function:
                return NumberFormItem.executeInitFunction(text);
            default:
                throw new Error(`Unsupported type: ${type}`);
        }
    }

    private static assertType(type: TemplateFormItemType) {
        if (type !== TemplateFormItemType.Number) {
            throw new Error(`Unsupported type: ${type}`);
        }
    }
}