import { DateFormItem as DateFormItemTemplate, FormItemType } from "src/template/templateTypes";
import { FormItemBase } from "./formItem";
import { ExtendedSetting } from "src/ui/settingsExtension";
import { DateTimeComponent } from "src/ui/dateTimeComponent";
import { FormItemFunctionProcessor } from "./formItemFunctionProcessor";

const MUSTACHE_TEMPLATE_REGEX = /[{]{2}.+[}]{2}/;

export class DateTimeFormItem extends FormItemBase<Date> {

    constructor(src: DateFormItemTemplate, funtionProcessor: FormItemFunctionProcessor) {
        DateTimeFormItem.assertType(src.type);
        super(src.id, src.type, funtionProcessor, src.init, src.get, src.validate, src.form);
    }

    protected assignToFormImpl(contentEl: HTMLElement): ExtendedSetting {
        const setting = new ExtendedSetting(contentEl)
            .setName(this._title)
            .setDesc(this._description);

        switch(this.type) {
            case 'date':
                setting.addDate(this.configureComponent());
                break;
            case 'time':
                setting.addTime(this.configureComponent());
                break;
            case 'dateTime':
                setting.addDateTime(this.configureComponent());
                break;
            default:
                throw new Error(`Unsupported type: ${this.type}`);
        }

        return setting;
    }

    private configureComponent(): (component: DateTimeComponent) => any {
        return component => component
            .setValue(this.value!)
            .onChange(newVal => this.value = newVal);
    }

    protected getFunctionDefault(): string {
        const val = window.moment(this.value);
        switch(this.type) {
            case 'date':
                return val.format('L')
            case 'time':
                return val.format('LTS');
            case 'dateTime':
                return val.format();
            default:
                throw new Error(`Unsupported type: ${this.type}`);
        }
    }

    protected getTemplateImpl(templateText: string, view: Record<string, any>): string {
        if (MUSTACHE_TEMPLATE_REGEX.test(templateText)) {
            return super.getTemplateImpl(templateText, view);
        }
        return window.moment(this.value).format(templateText);
    }

    protected getInitValueFromString(valStr: string): Date {
        const parsed = new Date(valStr);
            if (isNaN(parsed.getTime())) {
                throw new Error(`Invalid date init value: ${valStr}`);
            }
            return parsed;
    }

    protected getInitValueDefault(): Date {
        return new Date();
    }

    private static assertType(type: FormItemType): void {
        switch (type) {
            case 'date':
            case 'time':
            case 'dateTime':
                return;
            default:
                throw new Error(`Unsupported type: ${type}`);
        }
    }
}
