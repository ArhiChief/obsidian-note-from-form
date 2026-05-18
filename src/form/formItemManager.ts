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
            switch (item.type) {
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
                    throw new Error(`Unsupported type: ${item.type}`);
            }
        }

        return result;
    }

    
}