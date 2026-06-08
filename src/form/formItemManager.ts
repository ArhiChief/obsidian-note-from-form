import { NoteTemplate } from "src/template/templateTypes";
import { FormItem } from "./formItem";
import { FileLocationFormItem, FileNameFormItem } from "./fileFormItem";
import { TextFormItem } from "./textFormItem";
import { NumberFormItem } from "./numberFormItem";
import { DateTimeFormItem } from "./dateTimeFormItem";
import { CheckboxFormItem } from "./checkboxFormItem";
import { DropdownFormItem } from "./dropdownFormItem";
import { NoteFromFormPluginSettings } from "src/pluginSettings";
import { FormItemFunctionProcessor } from "./formItemFunctionProcessor";
import { IUserApi } from "src/userApi/userApi";

export class FormItemsManager {
    
    static async getFormItems(template: NoteTemplate, functionProcessor: FormItemFunctionProcessor, settings: NoteFromFormPluginSettings, userApi: IUserApi): Promise<FormItem[]> {
        const fileLocationsSrc = template["file-location"] ?? `v:${settings.templatesFolderLocation}`;
        const result: FormItem[] = [];

        let formItem: FormItem = new FileNameFormItem(functionProcessor, userApi, template["file-name"]);
        await formItem.initialize();
        result.push(formItem);

        formItem = new FileLocationFormItem(functionProcessor, userApi, fileLocationsSrc);
        await formItem.initialize();
        result.push(formItem);

        for (const item of template["form-items"] ?? []) {
            const itemType = item.type;
            
            switch (itemType) {
                case 'text':
                case 'textArea':
                    formItem = new TextFormItem(item, functionProcessor, userApi);
                    break;
                case 'number':
                    formItem = new NumberFormItem(item, functionProcessor, userApi);
                    break;
                case 'date':
                case 'time':
                case 'dateTime':
                    formItem = new DateTimeFormItem(item, functionProcessor, userApi);
                    break;
                case 'checkbox':
                    formItem = new CheckboxFormItem(item, functionProcessor, userApi);
                    break;
                case 'dropdown':
                    formItem = new DropdownFormItem(item, functionProcessor, userApi);
                    break;
                default:
                    throw new Error(`Unsupported type: ${itemType}`);
            }

            await formItem.initialize();
            result.push(formItem);
        }

        return result;
    }

    static getRawViewModel(src: FormItem[]): Record<string, any> {
        const view: Record<string, any> = {};
        for(let i = 0; i < src.length; i++) {
            const item = src[i];
            if (item.id === FileNameFormItem.FormFieldId || item.id === FileLocationFormItem.FormFieldId) {
                continue;
            }

            view[item.id] = item.value;
        }
        return view;
    }

    static async getViewModel(src: FormItem[]): Promise<Record<string, string>> {
        
        const view: Record<string, string> = {};

        // get model needed as source for `get` functions of src
        const rawView = FormItemsManager.getRawViewModel(src);

        for(let i = 0; i < src.length; i++) {
            const item = src[i];
            if (item.id === FileNameFormItem.FormFieldId || item.id === FileLocationFormItem.FormFieldId) {
                continue;
            }

            view[item.id] = await item.get(rawView);
        }

        // resolution of 'file-Name' and 'file-Location' should be done after all items from 'for-items' are resolved
        for(let i = 0; i < src.length; i++) {
            const item = src[i];
            if (item.id === FileNameFormItem.FormFieldId || item.id === FileLocationFormItem.FormFieldId) {
                view[item.id] = await item.get(view);
            }
        }

        return view;
    }

    static async validateItems(items: FormItem[], view: Record<string, any>): Promise<boolean> {
        let isValid = true;
        for (const item of items) {
            const itemValid = await item.validate(view);
            isValid = isValid && itemValid;
        }
        return isValid;       
    }

    static async beforeCreate(template: NoteTemplate, functionProcessor: FormItemFunctionProcessor, userApi: IUserApi, view: Record<string, string>): Promise<void> { 
        if (template.beforeCreate) {
            if (template.beforeCreate.startsWith('f:')) {
                await functionProcessor.executeFunction<void, [Record<string, string>, IUserApi]>(template.beforeCreate.slice(2), view, userApi);
            } else if (template.beforeCreate.startsWith('ref:')) {
                await functionProcessor.executeRefFunction<void, [Record<string, string>, IUserApi]>(template.beforeCreate.slice(4), view, userApi);
            } else {
                throw new Error(`Unsupported beforeCreate function: ${template.beforeCreate}`);
            }
        }
    }
}