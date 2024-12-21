import { evaluateTextFunction } from "src/helpers";
import { FormDisplay, GetFunctionType, TemplateFormItemType, TemplateFunction, ValidateFunctionType } from "src/template/template";
import { renderMustacheTemplate } from "src/helpers"
import { SettingExtended } from "src/ui/settingExtensions";

export interface FormItem {
    value: any;

    readonly id: string;
    readonly type: TemplateFormItemType;

    assignToForm(contentEl: HTMLElement): void;
    get(view: Record<string, any>): string;
    isValidUserInput(view: Record<string, any>): boolean;
}

export abstract class FormItemBase<TValue> implements FormItem {
    
    value: TValue;

    readonly id: string;
    readonly type: TemplateFormItemType;
    
    protected readonly _title: string;
    protected readonly _description: string;
    protected readonly _placeholder: string;

    private readonly _assignToForm?: (contentEl: HTMLElement) => SettingExtended;
    private readonly _getFunc?: TemplateFunction<GetFunctionType>;
    private readonly _isValidUserInputFunc?: TemplateFunction<ValidateFunctionType>;

    private _contentElement?: SettingExtended;

    protected constructor(id: string, type: TemplateFormItemType, initValue: TValue, getSrc: TemplateFunction<GetFunctionType> | undefined, formDisplay: FormDisplay | undefined) {
        this.id = id;
        this.type = type;
        this.value = initValue;
        this._getFunc = getSrc;
        
        if (formDisplay) {
            this._assignToForm = this.assignToFormImpl;
            this._title = formDisplay.title;
            this._description = formDisplay.description ?? "";
            this._placeholder = formDisplay.placeholder ?? "";
            this._isValidUserInputFunc = formDisplay.isValid;
        }
    }

    assignToForm(contentEl: HTMLElement): void {
        if (this._assignToForm) {
            this._contentElement = this._assignToForm(contentEl);
        }
    }

    get(view: Record<string, any>): string {
        if (!this._getFunc) {
            return this.getFunctionDefault();
        }

        let passException = false;
        const { type, text } = this._getFunc;

        try {
            switch(type) {
                case GetFunctionType.Function:
                    return this.getFunctionFunction(text, view);
                case GetFunctionType.Template:
                    return this.getFunctionTemplate(text, view);
                case GetFunctionType.Value:
                    return this.getFunctionValue(text, view);
                default:
                    passException = true;
                    throw new Error(`Unsupported 'get' function for '${this.id}' form item: ${type}:${text}`);
            }
        } catch(error) {
            if (passException) throw error;

            const message = `Failed to execute 'get' function for '${this.id}' form item: ${error}`;
            throw new Error(message);
        }
    }

    isValidUserInput(view: Record<string, any>): boolean {
        if (this._isValidUserInputFunc) {
            const validationResult = FormItemBase.executeValidateFunc(this._isValidUserInputFunc.text, view);

            if (validationResult !== true) {
                this.setError(<string>validationResult);
                return false;
            }

            this.resetError();
        }

        return true;
    }

    private setError(msg: string): void {
        if (!this._contentElement) return;

        const span = createSpan({
            text: msg,
            cls: "mod-warning",
        });

        const br = createEl("br");

        this._contentElement.descEl.append(br);
        this._contentElement.descEl.append(span);
    }

    private resetError(): void {
        if (!this._contentElement) return;
        this._contentElement?.setDesc(this._description);
    }

    protected abstract assignToFormImpl(contentEl: HTMLElement): SettingExtended;

    protected abstract getFunctionDefault() : string;

    protected getFunctionTemplate(template: string, view: Record<string, any>): string {
        return renderMustacheTemplate(template, view);
    }

    protected getFunctionFunction(functionText: string, view: Record<string, any>) : string {
        return FormItemBase.executeGetFunction(functionText, view);
    }

    protected getFunctionValue(valueText: string, _: Record<string, any>) : string {
        return valueText;
    }

    protected static executeInitFunction<TResult>(funcText: string): TResult {
        const func = evaluateTextFunction<TResult, []>(funcText);
        return func();
    }

    protected static executeGetFunction(funcText: string, view: Record<string, any>) : string {
        const func = evaluateTextFunction<string, [Record<string, any>]>(funcText);
        return func(view);
    }

    private static executeValidateFunc(funcText: string, view: Record<string, any>): boolean | string {
        const func = evaluateTextFunction<boolean | string, [Record<string, any>]>(funcText);
        return func(view);
    }
}