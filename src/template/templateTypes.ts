// ── String-typed value wrappers ──

/** String prefixed with `t:` — a Mustache template, e.g. `"t:Hello {{name}}"` */
export type TemplateString = `t:${string}`;

/** String prefixed with `v:` — a literal value, e.g. `"v:42"` */
export type ValueString = `v:${string}`;

/** String prefixed with `f:` — an inline async function, e.g. `"f:async () => 'default'"` */
export type FuncStringType = `f:async ${string}`;

/** String prefixed with `ref:` — a reference to a named function, e.g. `"ref:myFunc"` */
export type FuncRefType = `ref:${string}`;

/** String prefixed with `ref:` — a reference to a named function in a file, e.g. `"ref:/path/to/file.md:myFunc"` */
export type FuncFileRefType = `ref:${string}:${string}`;

/** An init function: inline function, function reference, or file function reference */
export type InitFunctionType = FuncStringType | FuncRefType | FuncFileRefType;

/** A get function: inline function with view param, function reference, or file function reference */
export type GetFunctionType = FuncStringType | FuncRefType | FuncFileRefType;

/** A validate function: inline function with view param, function reference, or file function reference */
export type ValidateFunctionType = FuncStringType | FuncRefType | FuncFileRefType;

/** A beforeCreate function: inline function with view param, function reference, or file function reference */
export type BeforeCreateFunctionType = FuncStringType | FuncRefType | FuncFileRefType;

// ── Form item types ──

export type FormItemType = 'text' | 'textArea' | 'number' | 'date' | 'time' | 'dateTime' | 'checkbox' | 'dropdown';

export interface FormItemForm {
    title: string;
    description?: string;
}

export interface TextFormItemForm extends FormItemForm {
    placeholder?: string;
}

export interface BaseFormItem {
    id: string;
    type: FormItemType;
    form?: FormItemForm;
    get?: GetFunctionType | TemplateString | ValueString;
    init?: InitFunctionType | ValueString;
    validate?: ValidateFunctionType;
}

export interface TextFormItem extends BaseFormItem {
    type: 'text' | 'textArea';
    form?: TextFormItemForm;
}

export interface NumberFormItem extends BaseFormItem {
    type: 'number';
}

export interface DateFormItem extends BaseFormItem {
    type: 'date' | 'time' | 'dateTime';
}

export interface CheckboxFormItem extends BaseFormItem {
    type: 'checkbox';
}

export interface DropdownFormItem extends BaseFormItem {
    type: 'dropdown';
}

export type FormItem = TextFormItem | NumberFormItem | DateFormItem | CheckboxFormItem | DropdownFormItem;

// ── Top-level template ──

export interface NoteTemplate {
    'file-name'?: TemplateString | ValueString | GetFunctionType;
    'file-location'?: TemplateString | GetFunctionType | ValueString;
    'form-items'?: FormItem[];
    'beforeCreate'?: BeforeCreateFunctionType;
}
