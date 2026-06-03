import { DropdownFormItem as DropdownFormItemTemplate, FormItemType, InitFunctionString, ValueString } from "src/template/templateTypes";
import { FormItemBase } from "./formItem";
import { ExtendedSetting } from "src/ui/settingsExtension";

interface DropdownOption {
    k: string;
    v: string;
}

interface DropdownOptionInput extends DropdownOption {
    s?: boolean;
}

interface InitResult {
    opts: Record<string, string>;
    selected: string;
}

export class DropdownFormItem extends FormItemBase<DropdownOption[]> {
    
    private readonly _opts: Record<string, string>;
    private readonly _selected: string;

    constructor(src: DropdownFormItemTemplate) {
        DropdownFormItem.assertType(src.type);

        const {opts, selected} = DropdownFormItem.initSource(src.id, src.init);
        const initValue: DropdownOption[] = [{
            k: selected,
            v: opts[selected],
        }];

        super(src.id, src.type, initValue, src.get, src.form);
        
        this._opts = opts;
        this._selected = selected;
    }

    protected getFunctionDefault():string {
        return this.value[0].v;
    }

    protected assignToFormImpl(contentEl: HTMLElement): void {

        new ExtendedSetting(contentEl)
            .setName(this._title)
            .setDesc(this._description)
            .addDropdown(dropDown => dropDown
                .addOptions(this._opts)
                .setValue(this._selected)
                .onChange(v => this.value = [{ k: v, v: this._opts[v] }])
            );
    }

    private static initSource(id: string, src?:  InitFunctionString | ValueString): InitResult {
        if (!src) {
            throw new Error(`Default value is not supported for '${id}' form item`);
        }

        let data: DropdownOptionInput[];
        if (src.startsWith('f:')) {
            data = FormItemBase.executeInitFunction<DropdownOptionInput[]>(src.slice(2));
        } else if (src.startsWith('v:')) {
            data = JSON.parse(src.slice(2));
        } else {
            throw new Error(`Invalid init value: ${src}`);
        }

        if (data.length === 0) {
            throw new Error(`Init value can't be empty for for '${id}' form item`);
        }

        let result: InitResult = {
            opts: {},
            selected: data[0].k,
        };

        data.forEach(item => {
            result.opts[item.k] = item.v;
            if (item.s) {
                result.selected = item.k;
            }
        });

        return result;
    }

    private static assertType (type: FormItemType): void {
        if (type !== 'dropdown') {
            throw new Error(`Unsupported type: ${type}`);
        }
    }
}