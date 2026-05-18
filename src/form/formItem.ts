import { FormItemForm, FormItemType, GetFunctionString, TemplateString, ValueString } from "src/template/templateTypes";

export interface FormItem {
    value: any;

    readonly id: string;
    readonly type: FormItemType;

    assignToForm(contentEl: HTMLElement): void;
    get(view: Record<string, any>): string;
}

export abstract class FormItemBase<TValue> implements FormItem {

    value: TValue;

    readonly id: string;
    readonly type: FormItemType;

    private readonly _assignToForm?: (contentEl: HTMLElement) => void;
    private readonly _getFunc?: GetFunctionString | TemplateString | ValueString;

    protected readonly _title: string;
    protected readonly _description: string;


    protected constructor(
        id: string, 
        type: FormItemType, 
        initValue: TValue, 
        getFunc?: GetFunctionString | TemplateString | ValueString, 
        formDisplay?: FormItemForm
    ) {
        this.id = id;
        this.type = type;
        this.value = initValue;
        this._getFunc = getFunc;

        this._title = "";
        this._description = "";

        if (formDisplay) {
            this.assignToForm = this.assignToFormImpl;
            this._title = formDisplay.title;
            this._description = formDisplay.description ?? "";
        }
    }

    assignToForm(contentEl: HTMLElement): void {
        if (this._assignToForm) {
            this._assignToForm(contentEl);
        }
    }

    get(view: Record<string, any>): string {
        if (!this._getFunc) {
            return this.getFunctionDefault();
        }

        if (this._getFunc.startsWith("f:")) {
            return this.getFunctionImpl(this._getFunc.slice(2), view);
        } else if (this._getFunc.startsWith("t:")) {
            return this.getTemplateImpl(this._getFunc.slice(2), view);
        } else if (this._getFunc.startsWith("v:")) {
            return this.getValueImpl(this._getFunc.slice(2), view);
        }

        throw new Error(`Invalid get function string: ${this._getFunc}`);
    }

    protected abstract assignToFormImpl(contentEl: HTMLElement): void;

    protected abstract getFunctionDefault() : string;

    protected getTemplateImpl(templateText: string, view: Record<string, any>): string {
        return "a";
    }

    protected getFunctionImpl(functionText: string, view: Record<string, any>) : string {
        return "b";
    }

    protected getValueImpl(valueText: string, _: Record<string, any>) : string {
        return valueText;
    }

    protected static executeInitFunction<TResult>(funcText: string): TResult {
        const func = eval(`(${funcText})`) as () => TResult;
        return func();
    }
}