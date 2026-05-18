import { NoteTemplate } from "src/template/templateTypes";
import { FormItem } from "./formItem";
import { FileLocationFormItem, FileNameFormItem } from "./fileFormItem";

export class FormItemsManager {
    static getFormItems(template: NoteTemplate): FormItem[] {
        const result: FormItem[] = [
            new FileNameFormItem(template["file-name"]),
            new FileLocationFormItem(template["file-location"]),
        ];

        return result;
    }

    
}