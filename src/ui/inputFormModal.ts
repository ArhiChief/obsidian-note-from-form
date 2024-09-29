import { App, Modal } from "obsidian";
import { FormItem } from "../form/formItemBase";
import { SettingExtended } from "src/ui/settingExtensions";


export class InputFormModal extends Modal {

    private readonly _items: FormItem[];
    private readonly _title: string;
    private readonly _callback: () => Promise<void>;

    constructor(app: App, title: string, formItems: FormItem[], cb: () => Promise<void>) {
        super(app);

        this._items = formItems;
        this._title = title;
        this._callback = cb;
    }

    onOpen(): void {
        const { contentEl } = this;

        contentEl.createEl("h1", { text: `New Note: ${this._title}` });

        for (let i = 0; i < this._items.length; i++) {
            const item: FormItem = this._items[i];

            item.assignToForm(contentEl);
        }

        new SettingExtended(contentEl)
            .addButton(btn => btn
                .setButtonText("Create")
                .setCta()
                .onClick(async _ =>{
                     this.close();
                     await this._callback();
                })
            );
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }
}