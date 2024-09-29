import { evaluateTextFunction } from "src/helpers";
import { FormDisplay, TemplateFormItemType } from "src/template/template";


export interface FormItem {
    value: any;

    readonly id: string;
    readonly type: TemplateFormItemType;

    assignToForm(contentEl: HTMLElement): void;
    get(view: Record<string, any>): string;
}

export abstract class FormItemBase<TValue> implements FormItem {
    
    value: TValue;

    readonly id: string;
    readonly type: TemplateFormItemType;
    
    protected readonly _title: string;
    protected readonly _description: string;
    protected readonly _placeholder: string;

    private readonly _assignToForm: (contentEl: HTMLElement) => void | undefined;

    protected constructor(id: string, type: TemplateFormItemType, initValue: TValue, formDisplay?: FormDisplay) {
        this.id = id;
        this.type = type;
        this.value = initValue;

        if (formDisplay) {
            this.assignToForm = this.assignToFormImpl;
            this._title = formDisplay.title;
            this._description = formDisplay.description ?? "";
            this._placeholder = formDisplay.placeholder ?? "";
        }
    }

    assignToForm(contentEl: HTMLElement): void {
        if (this._assignToForm) {
            this._assignToForm(contentEl);
        }
    }

    get(view: Record<string, any>): string {
        return this.getImpl(view);
    }

    protected abstract assignToFormImpl(contentEl: HTMLElement): void;
    protected abstract getImpl(view: Record<string, any>): string;

    protected static executeInitFunction<TResult>(funcText: string): TResult {
        const func = evaluateTextFunction<TResult, []>(funcText);
        return func();
    }

    protected static executeGetFunction(funcText: string, view: Record<string, any>) : string {
        const func = evaluateTextFunction<string, [Record<string, any>]>(funcText);
        return func(view);
    }
}