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

export class FormItemsManager {
    
    static async getFormItems(template: NoteTemplate, functionProcessor: FormItemFunctionProcessor, settings: NoteFromFormPluginSettings): Promise<FormItem[]> {
        const fileLocationsSrc = template["file-location"] ?? `v:${settings.templatesFolderLocation}`;
        const result: FormItem[] = [];

        let formItem: FormItem = new FileNameFormItem(functionProcessor, template["file-name"]);
        await formItem.initialize();
        result.push(formItem);

        formItem = new FileLocationFormItem(functionProcessor, fileLocationsSrc);
        await formItem.initialize();
        result.push(formItem);

        for (const item of template["form-items"] ?? []) {
            const itemType = item.type;
            
            switch (itemType) {
                case 'text':
                case 'textArea':
                    formItem = new TextFormItem(item, functionProcessor);
                    break;
                case 'number':
                    formItem = new NumberFormItem(item, functionProcessor);
                    break;
                case 'date':
                case 'time':
                case 'dateTime':
                    formItem = new DateTimeFormItem(item, functionProcessor);
                    break;
                case 'checkbox':
                    formItem = new CheckboxFormItem(item, functionProcessor);
                    break;
                case 'dropdown':
                    formItem = new DropdownFormItem(item, functionProcessor);
                    break;
                default:
                    throw new Error(`Unsupported type: ${itemType}`);
            }

            await formItem.initialize();
            result.push(formItem);
        }

        return result;
    }

    static getViewModel(src: FormItem[]): Record<string, string> {
        const view: Record<string, any> = {};
        const result: Record<string, string> = {};

        // get model needed as source for `get` functions of src
        for(let i = 0; i < src.length; i++) {
            const item = src[i];
            if (item.id === FileNameFormItem.FormFieldId || item.id === FileLocationFormItem.FormFieldId) {
                continue;
            }

            view[item.id] = item.value;
        }

        for(let i = 0; i < src.length; i++) {
            const item = src[i];
            if (item.id === FileNameFormItem.FormFieldId || item.id === FileLocationFormItem.FormFieldId) {
                continue;
            }

            result[item.id] = item.get(view);
        }

        // resolution of 'file-Name' and 'file-Location' should be done after all items from 'for-items' are resolved
        for(let i = 0; i < src.length; i++) {
            const item = src[i];
            if (item.id === FileNameFormItem.FormFieldId || item.id === FileLocationFormItem.FormFieldId) {
                result[item.id] = item.get(result);
            }
        }

        return result;
    }
}