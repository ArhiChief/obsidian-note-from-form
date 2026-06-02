import { NoteTemplate } from "src/template/templateTypes";
import { FormItem } from "./formItem";
import { FileLocationFormItem, FileNameFormItem } from "./fileFormItem";
import { TextFormItem } from "./textFormItem";
import { NumberFormItem } from "./numberFormItem";
import { DateFormItem } from "./dateFormItem";
import { CheckboxFormItem } from "./checkboxFormItem";
import { DropdownFormItem } from "./dropdownFormItem";

export class FormItemsManager {
    static getFormItems(template: NoteTemplate): FormItem[] {
        const result: FormItem[] = [
            new FileNameFormItem(template["file-name"]),
            new FileLocationFormItem(template["file-location"]),
        ];

        for (const item of template["form-items"] ?? []) {
            const itemType = item.type;

            switch (itemType) {
                case 'text':
                case 'textArea':
                    result.push(new TextFormItem(item));
                    break;
                case 'number':
                    result.push(new NumberFormItem(item));
                    break;
                case 'date':
                case 'time':
                case 'dateTime':
                    result.push(new DateFormItem(item));
                    break;
                case 'checkbox':
                    result.push(new CheckboxFormItem(item));
                    break;
                case 'dropdown':
                    result.push(new DropdownFormItem(item));
                    break;
                default:
                    throw new Error(`Unsupported type: ${itemType}`);
            }
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