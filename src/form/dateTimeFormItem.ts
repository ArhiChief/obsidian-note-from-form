
import { TemplateFormItem, TemplateFormItemType, TemplateGetFunction, TemplateGetFunctionType, TemplateInitFunction, TemplateInitFunctionType } from "src/template/template";
import { FormItemBase } from "./formItem";
import { SettingExtended } from "src/settingExtensions";
import { DateTimeComponent } from "src/dateTimeComponent";
import { moment } from "obsidian";

const MUSTACHE_TEMPLATE_REGEX = /[{]{2}.+[}]{2}/g;

export class DateTimeFormItem extends FormItemBase<Date> {

    private readonly _getSrc?: TemplateGetFunction;

    constructor (src: TemplateFormItem) {
        DateTimeFormItem.assertType(src.type);

        const initValue : Date = DateTimeFormItem.getInitValue(src.init);

        super(src.id, src.type, initValue, src.form);
    }

    protected assignToFormImpl(contentEl: HTMLElement): void {

        const setting = new SettingExtended(contentEl)
            .setName(this._title)
            .setDesc(this._description);

        switch(this.type) {
            case TemplateFormItemType.Date:
                setting.addDate(this.configureComponent());
                break;
            case TemplateFormItemType.Time:
                setting.addTime(this.configureComponent());
                break;
            case TemplateFormItemType.DateTime:
                setting.addDateTime(this.configureComponent());
                break;
            default:
                throw 1;
        }
    }

    private configureComponent(): (component: DateTimeComponent) => any {
        return component => component
            .setValue(this.value)
            .onChange(newVal => this.value = newVal);
    }

    protected getImpl(view: Record<string, any>): string {
        if (!this._getSrc) {
            const val = moment(this.value);
            switch(this.type) {
                case TemplateFormItemType.Date:
                    return val.format('L')
                case TemplateFormItemType.Time:
                    return val.format('LTS');
                case TemplateFormItemType.DateTime:
                    return val.format();
                default:
                    throw 1;
            }
        }

        switch(this._getSrc.type) {
            case TemplateGetFunctionType.Template:
                if (this._getSrc.setterText.match(MUSTACHE_TEMPLATE_REGEX)) {
                    return DateTimeFormItem.renderMustacheTemplate(this._getSrc.setterText, view);
                } else {
                    return moment(this.value).format(this._getSrc.setterText);
                }
            case TemplateGetFunctionType.Function:
                return DateTimeFormItem.executeGetFunction(this._getSrc.setterText, view);
            default:
                throw 1;
        }
    }

    private static getInitValue(src?: TemplateInitFunction): Date {
        if (!src) {
            return new Date(Date.now());
        }

        switch (src.type) {
            case TemplateInitFunctionType.String:
                return new Date(src.setterText);
            case TemplateInitFunctionType.Function:
                return DateTimeFormItem.executeInitFunction(src.setterText);
            default:
                throw 1;
        }
    }

    private static assertType (type: TemplateFormItemType) {
        switch (type) {
            case TemplateFormItemType.Date:
            case TemplateFormItemType.Time:
            case TemplateFormItemType.DateTime:
                return;
            default:
                throw 1;
        }
    }
}