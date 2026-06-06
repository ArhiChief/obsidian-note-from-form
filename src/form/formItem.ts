import Mustache from 'mustache';
import { FormItemForm, FormItemType, GetFunctionType, InitFunctionType, TemplateString, ValueString } from "src/template/templateTypes";
import { FormItemFunctionProcessor } from './formItemFunctionProcessor';

export interface FormItem {
    value: any;

    readonly id: string;
    readonly type: FormItemType;

    assignToForm(contentEl: HTMLElement): void;
    get(view: Record<string, any>): string;
    initialize(): Promise<void>;
}

export abstract class FormItemBase<TValue> implements FormItem {

    value: TValue | undefined;

    readonly id: string;
    readonly type: FormItemType;

    private readonly _assignToForm?: (contentEl: HTMLElement) => void;
    private readonly _getFunc?: GetFunctionType | TemplateString | ValueString;
    private readonly _initFunc?: InitFunctionType | ValueString;

    protected readonly _title: string;
    protected readonly _description: string;
    protected readonly _funtionProcessor: FormItemFunctionProcessor; 

    protected constructor(
        id: string, 
        type: FormItemType, 
        funtionProcessor: FormItemFunctionProcessor,
        initFunc?: InitFunctionType | ValueString, 
        getFunc?: GetFunctionType | TemplateString | ValueString, 
        formDisplay?: FormItemForm
    ) {
        this.id = id;
        this.type = type;
        this._initFunc = initFunc;
        this._getFunc = getFunc;
        this._funtionProcessor = funtionProcessor;

        this._title = "";
        this._description = "";

        if (formDisplay) {
            this.assignToForm = this.assignToFormImpl;
            this._title = formDisplay.title;
            this._description = formDisplay.description ?? "";
        }
    }

    async initialize(): Promise<void> {
        if (this._initFunc) {
            if (this._initFunc.startsWith('f:')) {
                this.value = this._funtionProcessor.executeFunction<TValue>(this._initFunc.slice(2));
            } else if (this._initFunc.startsWith('ref:')) {
                this.value = await this._funtionProcessor.executeRefFunction<TValue>(this._initFunc.slice(4));
            } else if (this._initFunc.startsWith('v:')) {
                this.value = this.getInitValueFromString(this._initFunc.slice(2));
            } else {
                throw new Error(`Unsupported init function: ${this._initFunc}`);
            }
        } else {
            this.value = this.getInitValueDefault();
        }
    }

    protected abstract getInitValueFromString(valStr: string): TValue;
    protected abstract getInitValueDefault(): TValue;

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
        return Mustache.render(templateText, view, {}, { escape: (val: string) => val });
    }

    protected getFunctionImpl(functionText: string, view: Record<string, any>) : string {
        const func = eval(`(${functionText})`) as (view: Record<string, any>) => string;
        return func(view);
    }

    protected getValueImpl(valueText: string, _: Record<string, any>) : string {
        return valueText;
    }
}