import { App, Modal, Notice, setIcon } from "obsidian";
import { SettingExtended } from "./settingExtensions";


class MessageBoxModal extends Modal {

    private readonly _header: string;
    private readonly _message: string;

    constructor(app: App, header: string, message: string) {
        super(app);
        this._header = header;
        this._message = message;
    }

    onOpen(): void {
        const { contentEl } = this;

        contentEl.createEl("h3", { text: this._header });
        new SettingExtended(contentEl)
            .setDisabled(true)
            .setDesc(this._message);

        new SettingExtended(contentEl)
            .setHeading()
            .addButton(btn => {
                btn.setButtonText("Ok");
                btn.onClick(_ => this.close());
            });
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }
}

export function showMessageBox(app: App, header: string, message: string): void {
    new MessageBoxModal(app, header, message).open();    
}
