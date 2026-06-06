import { normalizePath } from "obsidian";
import { FormItemBase } from "./formItem";
import { FormItemForm, GetFunctionType, TemplateString, ValueString } from "src/template/templateTypes";
import { ExtendedSetting } from "src/ui/settingsExtension";
import { FormItemFunctionProcessor } from "./formItemFunctionProcessor";
import { IUserApi } from "src/userApi/userApi";

// https://docs.obsidian.md/Plugins/User+interface/Modals#Select+from+list+of+suggestions
abstract class FileInfoFormItem extends FormItemBase<string> {

    private readonly _placeholder: string;
    private readonly _title: string;
    private readonly _description: string;

    protected constructor (
        id: string, 
        title: string,
        description: string,
        placeholder: string,
        funtionProcessor: FormItemFunctionProcessor,
        userApi: IUserApi,
        getFunc?: GetFunctionType | TemplateString | ValueString) {

        let formDisplay: FormItemForm | undefined = undefined;
        
        if (!getFunc) {
            formDisplay = {
                title: title,
                description: description,
            };
        }

        super(id, 'text', funtionProcessor, userApi, undefined, getFunc, undefined, formDisplay);
        this._title = title;
        this._description = description;
        this._placeholder = placeholder;
    }

    protected getInitValueFromString(valStr: string): string {
        return valStr;
    }

    protected getInitValueDefault(): string {
        return "";
    }
    
    protected assignToFormImpl(contentEl: HTMLElement): ExtendedSetting {
        return new ExtendedSetting(contentEl)
            .setName(this._title)
            .setDesc(this._description)
            .addText(text => text
                .setPlaceholder(this._placeholder)
                .setValue(this.value!)
                .onChange(newVal => this.value = newVal)
            );
    }

    async get(view: Record<string, any>): Promise<string> {
        const result = await super.get(view);
        return normalizePath(result);
    }

    protected getFunctionDefault(): string {
        return this.value!;
    }
}

export class FileNameFormItem extends FileInfoFormItem {

    public static readonly FormFieldId: string = "file-name";

    private static readonly _description: string = "Name of created note";
    private static readonly _placeholder: string = "My Fancy Note";
    private static readonly _title: string = "File name";

    constructor (funtionProcessor: FormItemFunctionProcessor, userApi: IUserApi, getFunc?: GetFunctionType | TemplateString | ValueString) {
        super(
            FileNameFormItem.FormFieldId, 
            FileNameFormItem._title, 
            FileNameFormItem._description, 
            FileNameFormItem._placeholder, 
            funtionProcessor, 
            userApi, 
            getFunc
        );
    }
}

export class FileLocationFormItem extends FileInfoFormItem {

    public static readonly FormFieldId: string = "file-location";

    private static readonly _description: string = "Folder where note will be placed";
    private static readonly _placeholder: string = "/some/path/";
    private static readonly _title: string = "File location";

    constructor (funtionProcessor: FormItemFunctionProcessor, userApi: IUserApi,  getFunc?: GetFunctionType | TemplateString | ValueString) {
        super(
            FileLocationFormItem.FormFieldId, 
            FileLocationFormItem._title, 
            FileLocationFormItem._description, 
            FileLocationFormItem._placeholder, 
            funtionProcessor, 
            userApi, 
            getFunc
        );
    }
}