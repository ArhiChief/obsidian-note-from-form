import { InitFunctionType, TemplateFormItem, TemplateFormItemType, TemplateFunction } from "src/template/template";
import { FormItemBase } from "./formItemBase";
import { DateTimeComponent } from "src/ui/dateTimeComponent";
import { moment } from "obsidian";
import { renderMustacheTemplate } from "src/helpers";
import { SettingExtended } from "src/ui/settingExtensions";


const MUSTACHE_TEMPLATE_REGEX = /[{]{2}.+[}]{2}/g;

export class DateTimeFormItem extends FormItemBase<Date> {

    constructor (src: TemplateFormItem) {
        
        DateTimeFormItem.assertType(src.type);

        const initValue : Date = DateTimeFormItem.getInitValue(src.init);
        
        super(src.id, src.type, initValue, src.get, src.form);
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
                throw new Error(`Unsupported type: ${this.type}`);
        }
    }

    private configureComponent(): (component: DateTimeComponent) => any {
        return component => component
            .setValue(this.value)
            .onChange(newVal => this.value = newVal);
    }

    protected getFunctionDefault(): string {
        const val = moment(this.value);
        switch(this.type) {
            case TemplateFormItemType.Date:
                return val.format('L')
            case TemplateFormItemType.Time:
                return val.format('LTS');
            case TemplateFormItemType.DateTime:
                return val.format();
            default:
                throw new Error(`Unsupported type: ${this.type}`);
        }
    }

    protected getFunctionTemplate(template: string, view: Record<string, any>): string {
        if (template.match(MUSTACHE_TEMPLATE_REGEX)) {
            return renderMustacheTemplate(template, view);
        } else {
            return moment(this.value).format(template);
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
                throw new Error(`Unsupported type: ${type}`);
        }
    }
}