import { TemplateFormItem, TemplateFormItemType, TemplateGetFunction, TemplateGetFunctionType, TemplateInitFunction, TemplateInitFunctionType } from "src/template/template";
import { FormItemBase } from "./formItem";
import { SettingExtended } from "src/settingExtensions";

export class NumberFormItem extends FormItemBase<number> {

    private readonly _getSrc?: TemplateGetFunction;

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

        switch (this._getSrc.type) {
            case TemplateGetFunctionType.Template:
                return NumberFormItem.renderMustacheTemplate(this._getSrc.setterText, view);
            case TemplateGetFunctionType.Function:
                return NumberFormItem.executeGetFunction(this._getSrc.setterText, view);
            default:
                throw 1;
        }
    }

    private static getInitValue(src?: TemplateInitFunction): number {
        if (!src) {
            return 0;
        }

        switch(src.type) {
            case TemplateInitFunctionType.String:
                return Number.parseFloat(src.setterText);
            case TemplateInitFunctionType.Function:
                return NumberFormItem.executeInitFunction(src.setterText);
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