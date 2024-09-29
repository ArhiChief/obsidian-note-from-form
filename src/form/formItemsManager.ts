import { Template, TemplateFormItemType } from "src/template/template";
import { FormItem } from "./formItemBase";
import { FileLocationFormItem, FileNameFormItem } from "./fileInfoFormItem";
import { TextFormItem } from "./textFormItem";
import { DateTimeFormItem } from "./dateTimeFormItem";
import { NumberFormItem } from "./numberFormItem";
import { nameof } from "src/helpers";


export class FormItemsManager {
    static getFormItems(template: Template): FormItem[] {
        const result: FormItem[] = [
            new FileNameFormItem(template.fileName),
            new FileLocationFormItem(template.fileLocation),
        ];

        for (let i = 0; i < template.formItems.length; i++) {
            const formItemSrc = template.formItems[i];

            switch (formItemSrc.type) {
                case TemplateFormItemType.Text:
                case TemplateFormItemType.TextArea:
                    result.push(new TextFormItem(formItemSrc));
                    break;
                case TemplateFormItemType.Date:
                case TemplateFormItemType.Time:
                case TemplateFormItemType.DateTime:
                    result.push(new DateTimeFormItem(formItemSrc));
                    break;
                case TemplateFormItemType.Number:
                    result.push(new NumberFormItem(formItemSrc));
                    break;
                default:
                    throw new Error(`Not supported type: ${formItemSrc.type}`);
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
            if (item.id === nameof<Template>("fileName") || item.id === nameof<Template>("fileLocation")) {
                continue;
            }

            view[item.id] = item.value;
        }

        for(let i = 0; i < src.length; i++) {
            const item = src[i];
            if (item.id === nameof<Template>("fileName") || item.id === nameof<Template>("fileLocation")) {
                continue;
            }

            result[item.id] = item.get(view);
        }

        // resolution of 'fileName' and 'fileLocation' should be done after all items from 'for-items' are resolved
        for(let i = 0; i < src.length; i++) {
            const item = src[i];
            if (item.id === nameof<Template>("fileName") || item.id === nameof<Template>("fileLocation")) {
                result[item.id] = item.get(result);
            }
        }

        return result;
    }
}