import { DropdownFormItem as DropdownFormItemTemplate, FormItemType, InitFunctionType, ValueString } from "src/template/templateTypes";
import { FormItemBase } from "./formItem";
import { ExtendedSetting } from "src/ui/settingsExtension";
import { FormItemFunctionProcessor } from "./formItemFunctionProcessor";
import { IUserApi } from "src/userApi/userApi";

interface DropdownOption {
    k: string;
    v: string;
}

interface DropdownOptionInput extends DropdownOption {
    s?: boolean;
}

export class DropdownFormItem extends FormItemBase<DropdownOption[]> {
    
    private readonly _title: string;
    private readonly _description: string;

    private _opts: Record<string, string>;
    private _selected: string;

    constructor(src: DropdownFormItemTemplate, funtionProcessor: FormItemFunctionProcessor, userApi: IUserApi) {
        DropdownFormItem.assertType(src.type);
        super(src.id, src.type, funtionProcessor, userApi, src.init, src.get, src.validate, src.form);

        this._opts = {};
        this._selected = "";
        
        this._title = src.form?.title ?? "";
        this._description = src.form?.description ?? "";
    }

    protected getFunctionDefault():string {
        return this.value![0].v;
    }

    protected assignToFormImpl(contentEl: HTMLElement): ExtendedSetting {

        return new ExtendedSetting(contentEl)
            .setName(this._title)
            .setDesc(this._description)
            .addDropdown(dropDown => dropDown
                .addOptions(this._opts)
                .setValue(this._selected)
                .onChange(v => this.value = [{ k: v, v: this._opts[v] }])
            );
    }

    protected getInitValueDefault(): DropdownOption[] {
        throw new Error(`Default value is not supported for '${this.id}' form item`);
    }

    protected getInitValueFromString(valStr: string): DropdownOption[] {
        return JSON.parse(valStr);
    }

    async initialize(): Promise<void> {
        await super.initialize();

        if (this.value!.length === 0) {
            throw new Error(`Init value can't be empty for for '${this.id}' form item`);
        }

        const data = this.value! as DropdownOptionInput[];
        
        data.forEach(item => {
            this._opts[item.k] = item.v;
            if (item.s) {
                this._selected = item.k;
            }
        });
    }

    private static assertType (type: FormItemType): void {
        if (type !== 'dropdown') {
            throw new Error(`Unsupported type: ${type}`);
        }
    }
}