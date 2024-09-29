import { GetFunctionType, InitFunctionType, TemplateFormItem, TemplateFormItemType, TemplateFunction } from "src/template/template";
import { FormItemBase } from "./formItemBase";
import { DateTimeComponent } from "src/ui/dateTimeComponent";
import { moment } from "obsidian";
import { renderMustacheTemplate } from "src/helpers";
import { SettingExtended } from "src/ui/settingExtensions";


const MUSTACHE_TEMPLATE_REGEX = /[{]{2}.+[}]{2}/g;

export class DateTimeFormItem extends FormItemBase<Date> {

    private readonly _getSrc?: TemplateFunction<GetFunctionType>;

    constructor (src: TemplateFormItem) {
        DateTimeFormItem.assertType(src.type);

        const initValue : Date = DateTimeFormItem.getInitValue(src.init);

        super(src.id, src.type, initValue, src.form);

        this._getSrc = src.get;
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

        const { type, text } = this._getSrc;
        switch(type) {
            case GetFunctionType.Template:
                if (text.match(MUSTACHE_TEMPLATE_REGEX)) {
                    return renderMustacheTemplate(text, view);
                } else {
                    return moment(this.value).format(text);
                }
            case GetFunctionType.Function:
                return DateTimeFormItem.executeGetFunction(text, view);
            case GetFunctionType.Value:
                return text;
            default:
                throw 1;
        }
    }

    private static getInitValue(src?: TemplateFunction<InitFunctionType>): Date {
        if (!src) {
            return new Date(Date.now());
        }

        const { type, text } = src;
        switch (type) {
            case InitFunctionType.Value:
                return new Date(text);
            case InitFunctionType.Function:
                return DateTimeFormItem.executeInitFunction(text);
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