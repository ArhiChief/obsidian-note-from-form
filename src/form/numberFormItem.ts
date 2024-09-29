import { GetFunctionType, InitFunctionType, TemplateFormItem, TemplateFormItemType, TemplateFunction } from "src/template/template";
import { FormItemBase } from "./formItemBase";
import { SettingExtended } from "src/ui/settingExtensions";
import { renderMustacheTemplate } from "src/helpers";


export class NumberFormItem extends FormItemBase<number> {

    private readonly _getSrc?: TemplateFunction<GetFunctionType>;

    constructor(src: TemplateFormItem) {
        NumberFormItem.assertType(src.type);

        const initValue = NumberFormItem.getInitValue(src.init);

        super(src.id, src.type, initValue, src.form);

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

    protected getImpl(view: Record<string, any>): string {
        if (!this._getSrc) {
            return this.value.toString();
        }

        const { type, text } = this._getSrc;
        switch (type) {
            case GetFunctionType.Template:
                return renderMustacheTemplate(text, view);
            case GetFunctionType.Function:
                return NumberFormItem.executeGetFunction(text, view);
            case GetFunctionType.Value:
                return text;
            default:
                throw 1;
        }
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
                throw 1;
        }
    }

    private static assertType(type: TemplateFormItemType) {
        if (type !== TemplateFormItemType.Number) {
            throw 1;
        }
    }
}