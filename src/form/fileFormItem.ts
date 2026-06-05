import { normalizePath } from "obsidian";
import { FormItemBase } from "./formItem";
import { FormItemForm, GetFunctionType, TemplateString, ValueString } from "src/template/templateTypes";
import { ExtendedSetting } from "src/ui/settingsExtension";
import { FormItemFunctionProcessor } from "./formItemFunctionProcessor";

// https://docs.obsidian.md/Plugins/User+interface/Modals#Select+from+list+of+suggestions
abstract class FileInfoFormItem extends FormItemBase<string> {

    private readonly _placeholder: string;

    protected constructor (
        id: string, 
        title: string,
        description: string,
        placeholder: string,
        funtionProcessor: FormItemFunctionProcessor,
        getFunc?: GetFunctionType | TemplateString | ValueString) {

        let formDisplay: FormItemForm | undefined = undefined;
        
        if (!getFunc) {
            formDisplay = {
                title: title,
                description: description,
            };
        }

        super(id, 'text', funtionProcessor, undefined, getFunc, formDisplay);
        this._placeholder = placeholder;
    }

    protected getInitValueFromString(valStr: string): string {
        return valStr;
    }

    protected getInitValueDefault(): string {
        return "";
    }
    
    protected assignToFormImpl(contentEl: HTMLElement): void {
        new ExtendedSetting(contentEl)
            .setName(this._title)
            .setDesc(this._description)
            .addText(text => text
                .setPlaceholder(this._placeholder)
                .setValue(this.value!)
                .onChange(newVal => this.value = newVal)
            );
    }

    get(view: Record<string, any>): string {
        const result = super.get(view);
        return normalizePath(result);
    }

    protected getFunctionDefault(): string {
        return this.value!;
    }
}

export class FileNameFormItem extends FileInfoFormItem {

    public static readonly FormFieldId: string = "file-name";

    private static readonly _title: string = "Name of created note";
    private static readonly _placeholder: string = "My Fancy Note";

    constructor (funtionProcessor: FormItemFunctionProcessor, getFunc?: GetFunctionType | TemplateString | ValueString) {
        super(FileNameFormItem.FormFieldId, "File name", FileNameFormItem._title, FileNameFormItem._placeholder, funtionProcessor, getFunc);
    }
}

export class FileLocationFormItem extends FileInfoFormItem {

    public static readonly FormFieldId: string = "file-location";

    private static readonly _title: string = "Folder where note will be placed";
    private static readonly _placeholder: string = "/some/path/";

    constructor (funtionProcessor: FormItemFunctionProcessor, getFunc?: GetFunctionType | TemplateString | ValueString) {
        super(FileLocationFormItem.FormFieldId, "File location", FileLocationFormItem._title, FileLocationFormItem._placeholder, funtionProcessor, getFunc);
    }
}