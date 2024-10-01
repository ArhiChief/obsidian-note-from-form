import { InitFunctionType, TemplateFormItem, TemplateFormItemType, TemplateFunction } from "src/template/template";
import { FormItemBase } from "./formItemBase";
import { SettingExtended } from "src/ui/settingExtensions";

interface DropDownItem {
    k: string;
    v: string;
}

interface DropDownItemInput extends DropDownItem {
    s?: boolean;
}

interface InitResult {
    opts: Record<string, string>;
    selected: string;
}

abstract class DropDownFormItemBase extends FormItemBase<DropDownItem[]> {
    
    private readonly _multi: boolean;
    private readonly _opts: Record<string, string>;
    private readonly _selected: string;

    constructor(src: TemplateFormItem, multi: boolean) {
        
        DropDownFormItemBase.assertType(src.type);

        const {opts, selected} = DropDownFormItemBase.initSource(src.id, src.init);
        const initValue: DropDownItem[] = [{
            k: selected,
            v: opts[selected],
        }];

        super(src.id, src.type, initValue, src.get, src.form);
        
        this._opts = opts;
        this._selected = selected;

        this._multi = multi;
    }

    protected assignToFormImpl(contentEl: HTMLElement): void {

        new SettingExtended(contentEl)
            .setName(this._title)
            .setDesc(this._description)
            .addDropdown(dropDown => dropDown
                .addOptions(this._opts)
                .setValue(this._selected)
                .onChange(v => this.value = [{ k: v, v: this._opts[v] }])
            );
    }

    protected getFunctionDefault():string {
        return this.value[0].v;
    }

    private static initSource(id: string, src?: TemplateFunction<InitFunctionType>): InitResult {
        if (!src) {
            throw new Error(`Default value is not supported for '${id}' form item`);
        }

        const { type, text } = src;
        let data: DropDownItemInput[];
        switch(type) {
            case InitFunctionType.Value:
                data = JSON.parse(text);
                break;
            case InitFunctionType.Function:
                data = FormItemBase.executeInitFunction(text);
                break;
            default:
                throw new Error(`Unsupported type: ${type}`);
        }

        if (data.length === 0) {
            throw new Error(`Init value can't be empty for for '${id}' form item`);
        }

        let result: InitResult = {
            opts: {},
            selected: "",
        };

        data.forEach(item => {
            result.opts[item.k] = item.v;
            if (!result.selected && item.s) {
                result.selected = item.k;
            }
        });

        result.selected ??= data[0].k;

        return result;
    }

    private static assertType (type: TemplateFormItemType): void {
        switch (type) {
            case TemplateFormItemType.DropDown:
            case TemplateFormItemType.DropDownMulti:
                return;
            default:
                throw new Error(`Unsupported type: ${type}`);
        }
    }
}

export class DropDownFormItem extends DropDownFormItemBase {
    constructor(src: TemplateFormItem) {
        super(src, false);
    }
}