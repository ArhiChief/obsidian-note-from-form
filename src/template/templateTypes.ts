// ── String-typed value wrappers ──

/** String prefixed with `t:` — a Mustache template, e.g. `"t:Hello {{name}}"` */
export type TemplateString = `t:${string}`;

/** String prefixed with `v:` — a literal value, e.g. `"v:42"` */
export type ValueString = `v:${string}`;

/** String prefixed with `f:` — an init function (no params), e.g. `"f:() => 'default'"` */
export type InitFunctionString = `f:${string}`;

/** String prefixed with `f:` — a get function receiving `view`, e.g. `"f:(view) => view.name"` */
export type GetFunctionString = `f:${string}`;

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
    get?: GetFunctionString | TemplateString | ValueString;
    init?: InitFunctionString | ValueString;
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
    'file-name'?: TemplateString | ValueString | GetFunctionString;
    'file-location'?: TemplateString | GetFunctionString | ValueString;
    'form-items'?: FormItem[];
}
