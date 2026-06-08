import { App, Modal, Setting } from "obsidian";
import { FormItem } from "src/form/formItem";
import { TemplateIndexItem } from "src/template/templateIndex";
import { NoteTemplate } from "src/template/templateTypes";

export class InputFormModal extends Modal {

    private readonly _items: FormItem[];
    private readonly _indexedTemplate: TemplateIndexItem;
    private readonly _templateData: NoteTemplate;
    private readonly _callback: (items: FormItem[], indexedTemplate: TemplateIndexItem, templateData: NoteTemplate) => Promise<boolean>;

    private readonly _app: App;

    constructor(app: App, indexedTemplate: TemplateIndexItem, formItems: FormItem[], templateData: NoteTemplate, callback: (items: FormItem[], indexedTemplate: TemplateIndexItem, templateData: NoteTemplate) => Promise<boolean>) {
        super(app);
        this._app = app;
        this._indexedTemplate = indexedTemplate;
        this._items = formItems;
        this._templateData = templateData;
        this._callback = callback;
    }

    onOpen(): void {
        const { contentEl } = this;

        this.setTitle(`New note: ${this._indexedTemplate.label}`);

        for (let i = 0; i < this._items.length; i++) {
            const item: FormItem = this._items[i];

            item.assignToForm(contentEl);
        }

        new Setting(contentEl)
            .addButton(button => button
                .setButtonText("Create")
                .setCta()
                .onClick(async () => {
                    if (await this._callback(this._items, this._indexedTemplate, this._templateData)) {
                        this.close();
                    }
                })
            );
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }
}