export interface Template {
    name: string;
    
    // content of template that can be pasted into output. Encoded as base64 to avoid problem of storing inside JSON
    text: string;

    fileName?: TemplateFunction<GetFunctionType>;
    fileLocation?: TemplateFunction<GetFunctionType>;

    formItems: TemplateFormItem[];
}

export interface TemplateFormItem {
    id: string;
    type: TemplateFormItemType;
    init?: TemplateFunction<InitFunctionType>;
    get?: TemplateFunction<GetFunctionType>;
    form?: FormDisplay;
}

export interface FormDisplay {
    title: string;
    description?: string;
    placeholder?: string;
}

export enum TemplateFormItemType {
    Text = 'text',
    TextArea = 'textArea',
    Date = 'date',
    Time = 'time',
    DateTime = 'dateTime',
    Number = 'number',
}

export interface TemplateFunction<TFunctionType> {
    type: TFunctionType,
    text: string,
}

export enum InitFunctionType {
    Value = 'v',
    Function = 'f',
}

export enum GetFunctionType {
    Function = 'f',
    Template = 't',
    Value = 'v',
}

export interface TemplateInput {
    "file-name"?: string;
    "file-location"?: string;
    "form-items": TemplateInputFormItem[];
}

export interface TemplateInputFormItem {
    id: string;
    type: TemplateFormItemType;
    init?: string;
    get?: string;
    form?: TemplateInputForm;
}

export interface TemplateInputForm {
    title: string;
    description?: string;
    placeholder?: string;
}