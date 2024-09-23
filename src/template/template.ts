export interface Template {
    name: string;
    
    // content of template that can be pasted into output. Encoded as base64 to avoid problem of storing inside JSON
    text: string;

    fileName?: TemplateGetFunction
    fileLocation?: TemplateGetFunction;

    formItems: TemplateFormItem[];
}

export interface TemplateFormItem {
    id: string;
    type: TemplateFormItemType;
    init?: TemplateInitFunction;
    get?: TemplateGetFunction;
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

export interface TemplateInitFunction {
    type: TemplateInitFunctionType,
    setterText: string,
}

export interface TemplateGetFunction {
    type: TemplateGetFunctionType,
    setterText: string,
}

export enum TemplateInitFunctionType {
    String = 's',
    Function = 'f',
}

export enum TemplateGetFunctionType {
    Template = 't',
    Function = 'f',
}

export interface TemplateInput {
    "file-name"?: string;
    "file-location"?: string;
    "form-items": TemplateInputFormItem[];
};

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