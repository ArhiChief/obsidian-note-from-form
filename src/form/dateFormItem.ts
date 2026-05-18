import { Setting } from "obsidian";
import { DateFormItem as DateFormItemTemplate, InitFunctionString, ValueString, FormItemType } from "src/template/templateTypes";
import { FormItemBase } from "./formItem";
import moment from "moment";

export class DateFormItem extends FormItemBase<Date> {

    constructor(src: DateFormItemTemplate) {
        DateFormItem.assertType(src.type);

        const initValue = DateFormItem.getInitValue(src.init);

        super(src.id, src.type, initValue, src.get, src.form);
    }

    protected assignToFormImpl(contentEl: HTMLElement): void {
        new Setting(contentEl)
            .setName(this._title)
            .setDesc(this._description)
            .addText(text => text
                .setPlaceholder(this.getPlaceholder())
                .setValue(this.formatValue())
                .onChange(newVal => {
                    const parsed = new Date(newVal);
                    if (!isNaN(parsed.getTime())) {
                        this.value = parsed;
                    }
                })
            );
    }

    protected getFunctionDefault(): string {
        const val = moment(this.value);
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

    private formatValue(): string {
        if (!this.value || isNaN(this.value.getTime())) return '';

        switch (this.type) {
            case 'date': return this.value.toISOString().slice(0, 10);
            case 'time': return this.value.toISOString().slice(11, 19);
            case 'dateTime': return this.value.toISOString().slice(0, 19);
            default: return this.value.toISOString();
        }
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
