import { FormItemForm, FormItemType, GetFunctionType, InitFunctionType, TemplateString, ValidateFunctionType, ValueString } from "src/template/templateTypes";
import { FormItemFunctionProcessor } from './formItemFunctionProcessor';
import { ExtendedSetting } from 'src/ui/settingsExtension';
import { IUserApi } from "src/userApi/userApi";

interface ValidateResult {
    isValid: boolean;
    errMsg?: string;
}

export interface FormItem {
    value: any;

    readonly id: string;
    readonly type: FormItemType;

    assignToForm(contentEl: HTMLElement): void;
    get(view: Record<string, any>): Promise<string>;
    initialize(): Promise<void>;
    validate(view: Record<string, any>): Promise<boolean>;
}

export abstract class FormItemBase<TValue> implements FormItem {

    value: TValue | undefined;

    readonly id: string;
    readonly type: FormItemType;

    private readonly _assignToForm?: (contentEl: HTMLElement) => ExtendedSetting;
    private readonly _getFunc?: GetFunctionType | TemplateString | ValueString;
    private readonly _initFunc?: InitFunctionType | ValueString;
    private readonly _validateFunc?: ValidateFunctionType;
    private readonly _funtionProcessor: FormItemFunctionProcessor; 
    private readonly _userApi: IUserApi;

    private _element? : ExtendedSetting;

    protected constructor(
        id: string, 
        type: FormItemType, 
        funtionProcessor: FormItemFunctionProcessor,
        userApi: IUserApi,
        initFunc?: InitFunctionType | ValueString, 
        getFunc?: GetFunctionType | TemplateString | ValueString, 
        validateFunc?: ValidateFunctionType,
        formDisplay?: FormItemForm
    ) {
        this.id = id;
        this.type = type;
        this._initFunc = initFunc;
        this._getFunc = getFunc;
        this._validateFunc = validateFunc;
        this._funtionProcessor = funtionProcessor;
        this._userApi = userApi;

        if (formDisplay) {
            this._assignToForm = this.assignToFormImpl;
        }
    }

    async initialize(): Promise<void> {
        if (this._initFunc) {
            if (this._initFunc.startsWith('f:')) {
                this.value = await this._funtionProcessor.executeFunction<TValue, []>(this._initFunc.slice(2));
            } else if (this._initFunc.startsWith('ref:')) {
                this.value = await this._funtionProcessor.executeRefFunction<TValue, []>(this._initFunc.slice(4));
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
            this._element = this._assignToForm(contentEl);
        }
    }

    async get(view: Record<string, any>): Promise<string> {
        if (!this._getFunc) {
            return this.getFunctionDefault();
        }

        if (this._getFunc.startsWith("f:")) {
             return await this._funtionProcessor.executeFunction<string, [Record<string, any>]>(this._getFunc.slice(2), view);
        } else if (this._getFunc.startsWith("ref:")) {
            return await this._funtionProcessor.executeRefFunction<string, [Record<string, any>]>(this._getFunc.slice(4), view);
        } else if (this._getFunc.startsWith("t:")) {
            return this.getTemplateImpl(this._getFunc.slice(2), view);
        } else if (this._getFunc.startsWith("v:")) {
            return this.getValueImpl(this._getFunc.slice(2), view);
        }

        throw new Error(`Invalid get function string: ${this._getFunc}`);
    }

    async validate(view: Record<string, any>): Promise<boolean> {
        if (!this._validateFunc || !this._element) {
            return true;
        }

        let validationResult: ValidateResult;

        if (this._validateFunc.startsWith('f:')) {
            validationResult = await this._funtionProcessor.executeFunction<ValidateResult, [Record<string, any>]>(this._validateFunc.slice(2), view);
        } else if (this._validateFunc.startsWith('ref:')) {
            validationResult = await this._funtionProcessor.executeRefFunction<ValidateResult, [Record<string, any>]>(this._validateFunc.slice(4), view);
        } else {
            throw new Error(`Unsupported validate function: ${this._validateFunc}`);
        }

        this._element.clearError();
        if (!validationResult.isValid) {
            this._element.setError(validationResult.errMsg!);
        }
        return validationResult.isValid;
    }

    protected abstract assignToFormImpl(contentEl: HTMLElement): ExtendedSetting;

    protected abstract getFunctionDefault() : string;

    protected getTemplateImpl(templateText: string, view: Record<string, any>): string {
        return this._funtionProcessor.renderMustacheTemplate(templateText, view);
    }

    protected getValueImpl(valueText: string, _: Record<string, any>) : string {
        return valueText;
    }
}