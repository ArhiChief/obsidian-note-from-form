import { App, Modal, Setting } from "obsidian";
import { FormItem } from "src/form/formItem";

export class InputFormModal extends Modal {

    private readonly _items: FormItem[];
    private readonly _title: string;
    private readonly _callback: () => Promise<void>;

    constructor(app: App, title: string, formItems: FormItem[], callback: () => Promise<void>) {
        super(app);
        this._title = title;
        this._items = formItems;
        this._callback = callback;
    }

    onOpen(): void {
        const { contentEl } = this;

        contentEl.createEl("h1", { text: `New note: ${this._title}` });

        for (let i = 0; i < this._items.length; i++) {
            const item: FormItem = this._items[i];

            item.assignToForm(contentEl);
        }

        new Setting(contentEl)
            .addButton(button => button
                .setButtonText("Create")
                .setCta()
                .onClick(async () => {
                    await this._callback();
                    this.close();
                })
            );
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }
}