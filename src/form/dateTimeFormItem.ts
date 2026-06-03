import { DateFormItem as DateFormItemTemplate, InitFunctionString, ValueString, FormItemType } from "src/template/templateTypes";
import { FormItemBase } from "./formItem";
import { ExtendedSetting } from "src/ui/settingsExtension";
import { DateTimeComponent } from "src/ui/dateTimeComponent";

const MUSTACHE_TEMPLATE_REGEX = /[{]{2}.+[}]{2}/;

export class DateTimeFormItem extends FormItemBase<Date> {

    constructor(src: DateFormItemTemplate) {
        DateTimeFormItem.assertType(src.type);

        const initValue = DateTimeFormItem.getInitValue(src.init);

        super(src.id, src.type, initValue, src.get, src.form);
    }

    protected assignToFormImpl(contentEl: HTMLElement): void {
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

    }

    private configureComponent(): (component: DateTimeComponent) => any {
        return component => component
            .setValue(this.value)
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

    private static getInitValue(src?: InitFunctionString | ValueString): Date {
        if (!src) {
            return new Date();
        }

        if (src.startsWith('f:')) {
            return FormItemBase.executeInitFunction<Date>(src.slice(2));
        } else if (src.startsWith('v:')) {
            const parsed = new Date(src.slice(2));
            if (isNaN(parsed.getTime())) {
                throw new Error(`Invalid date init value: ${src}`);
            }
            return parsed;
        } else {
            throw new Error(`Unsupported init value: ${src}`);
        }
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
