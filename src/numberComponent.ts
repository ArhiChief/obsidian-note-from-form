import { ValueComponent } from "obsidian";

export class NumberComponent extends ValueComponent<number> {

    private readonly _inputEl: HTMLInputElement;
    private _onChange?: (value: number) => any;

    constructor(controlEl: HTMLElement) {
        super();

        const elInfo: DomElementInfo = {
            type: "number",
            attr:  { type: "number" },
            placeholder: "Empty"
        };

        this._inputEl = controlEl.createEl("input", elInfo);
        this._inputEl.addEventListener('change', e => this.onChanged(e));
    }

    setValue(value: number): this {
        this._inputEl.value = value.toString();
        return this;
    }

    onChange(callback: (value: number) => any): this {
        this._onChange = callback;
        return this;
    }

    getValue(): number {
        return Number.parseFloat(this._inputEl.value);
    }

    onChanged(ev: Event) {
        if (this._onChange) {
            this._onChange(this.getValue());
        }
    }
}