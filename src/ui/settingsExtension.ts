import { Setting } from "obsidian";
import { DateTimeComponent, DateTimeType } from "./dateTimeComponent";
import { NumberComponent } from "./numberComponent";

export class ExtendedSetting extends Setting {
    private addDateTimeComponent(cb: (component: DateTimeComponent) => any, type: DateTimeType): this {
        const component = new DateTimeComponent(this.controlEl, type);
        this.components.push(component);
        cb(component);
        return this;
    }

    addDateTime(cb: (component: DateTimeComponent) => any): this {
        return this.addDateTimeComponent(cb, DateTimeType.DateTime);
    }

    addDate(cb: (component: DateTimeComponent) => any): this {
        return this.addDateTimeComponent(cb, DateTimeType.Date);
    }

    addTime(cb: (component: DateTimeComponent) => any): this {
        return this.addDateTimeComponent(cb, DateTimeType.Time);
    }

    addNumber(cb: (component: NumberComponent) => any): this {
        const component = new NumberComponent(this.controlEl);
        this.components.push(component);
        cb(component);
        return this;
    }

    private originDesc: string | null = null;
    setError(errMsg: string): this {
        if (!this.originDesc) {
            this.originDesc = this.descEl.innerText;
        }

        this.descEl.toggleClass('nff-error-desc', true);
        this.setDesc(errMsg);

        return this;
    }

    clearError(): this {
        this.descEl.toggleClass('nff-error-desc', false);
        
        if (this.originDesc) {
            this.setDesc(this.originDesc);
            this.originDesc = null;
        }

        return this;
    }
}