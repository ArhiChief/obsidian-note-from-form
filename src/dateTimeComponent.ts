import { ValueComponent, moment } from "obsidian";


export enum DateTimeType {
    DateTime = "datetime-local",
    Date = "date",
    Time = "time", 
}

/**
 * This is custom component that adds support for input of date and time.
 * 
 * Obsidian support render of dates & time by using `input` HTML element with special properties.
 * For example, consider add `date` property to note.
 */
export class DateTimeComponent extends ValueComponent<Date> {
    
    private _type: DateTimeType;
    private readonly _inputEl: HTMLInputElement;
    private _onChange?: (value: Date) => any;

    constructor(controlEl: HTMLElement, type: DateTimeType) {
        super();

        const elInfo: DomElementInfo = {
            cls: "metadata-input metadata-input-text mod-date",
            type: type,
            attr:  { type: type },
            placeholder: "Empty"
        };

        this._type = type;
        this._inputEl = controlEl.createEl("input", elInfo);
        this._inputEl.addEventListener('change', e => this.onChanged(e));
    }

    // to be able to display different parts of date and time we need to pass formatted string.
    // that might need to be tested on systems with different locales
    setValue(value: Date): this {
        let format: string;
        
        switch (this._type) {
            case DateTimeType.Date:
                format = "yyyy-MM-DD";
                break;
            case DateTimeType.Time:
                format = "HH:mm:ss"
                break;
            case DateTimeType.DateTime:
                format = "yyyy-MM-DDTHH:mm:ss"
                break;
        }

        const val = moment(value).format(format);

        this._inputEl.value = val;

        return this;
    }

    onChange(callback: (value: Date) => any): this {
        this._onChange = callback;
        return this;
    }

    getValue(): Date {
        return new Date(this._inputEl.value);
    }

    onChanged(ev: Event) {
        if (this._onChange) {
            this._onChange(this.getValue());
        }
    }
}