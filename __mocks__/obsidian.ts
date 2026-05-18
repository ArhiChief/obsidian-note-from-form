class TAbstractFile {
    path: string = '';
    name: string = '';
    parent: any = null;
    vault: any = null;
}

class TFile extends TAbstractFile {
    basename: string = '';
    extension: string = '';
    stat: any = {};
}

class TFolder extends TAbstractFile {
    children: TAbstractFile[] = [];
}

class ValueComponent {
    // stub base class
}

class TextComponent {
    setPlaceholder(p: string) { return this; }
    setValue(v: string) { return this; }
    onChange(cb: any) { return this; }
}

class TextAreaComponent {
    setPlaceholder(p: string) { return this; }
    setValue(v: string) { return this; }
    onChange(cb: any) { return this; }
}

class Modal {
    app: any;
    contentEl: any;
    constructor(app: any) {
        this.app = app;
        this.contentEl = {
            createEl: jest.fn().mockReturnValue({
                createEl: jest.fn(),
                addEventListener: jest.fn(),
            }),
            empty: jest.fn(),
        };
    }
    open() {}
    close() {}
}

function moment(date: any) {
    const d = new Date(date);
    return {
        format(fmt: string) {
            const pad = (n: number) => n.toString().padStart(2, '0');
            const yyyy = d.getFullYear().toString();
            const MM = pad(d.getMonth() + 1);
            const DD = pad(d.getDate());
            const HH = pad(d.getHours());
            const mm = pad(d.getMinutes());
            const ss = pad(d.getSeconds());
            return fmt
                .replace('yyyy', yyyy)
                .replace('MM', MM)
                .replace('DD', DD)
                .replace('HH', HH)
                .replace('mm', mm)
                .replace('ss', ss);
        },
    };
}

module.exports = {
    App: class {},
    PluginSettingTab: class {
        app: any;
        containerEl: any;
        constructor(app: any, plugin: any) {
            this.app = app;
            this.containerEl = { empty: jest.fn() };
        }
    },
    Setting: class {
        containerEl: any;
        controlEl: any;
        descEl: any;
        components: any[];
        _name: any;
        _desc: any;
        constructor(containerEl: any) {
            this.containerEl = containerEl;
            this.controlEl = {
                createEl: jest.fn().mockReturnValue({
                    value: '',
                    addEventListener: jest.fn(),
                }),
            };
            this.descEl = { toggleClass: jest.fn() };
            this.components = [];
        }
        setName(name: any) { this._name = name; return this; }
        setDesc(desc: any) { this._desc = desc; return this; }
        addText(cb: any) {
            const comp = { setPlaceholder: jest.fn().mockReturnThis(), setValue: jest.fn().mockReturnThis(), onChange: jest.fn().mockReturnThis() };
            if (cb) cb(comp);
            return this;
        }
        addTextArea(cb: any) {
            const comp = { setPlaceholder: jest.fn().mockReturnThis(), setValue: jest.fn().mockReturnThis(), onChange: jest.fn().mockReturnThis() };
            if (cb) cb(comp);
            return this;
        }
        addToggle(cb: any) {
            const comp = { setValue: jest.fn().mockReturnThis(), onChange: jest.fn().mockReturnThis() };
            if (cb) cb(comp);
            return this;
        }
        addDropdown(cb: any) {
            const comp = { addOptions: jest.fn().mockReturnThis(), setValue: jest.fn().mockReturnThis(), onChange: jest.fn().mockReturnThis() };
            if (cb) cb(comp);
            return this;
        }
        addButton(cb: any) {
            const button = {
                setButtonText: jest.fn().mockReturnThis(),
                setCta: jest.fn().mockReturnThis(),
                onClick: jest.fn().mockReturnThis(),
            };
            cb(button);
            return this;
        }
    },
    Modal,
    ValueComponent,
    TextComponent,
    TextAreaComponent,
    moment,
    TAbstractFile,
    TFile,
    TFolder,
    normalizePath(path: string) {
        // Strip trailing slashes, normalize backslashes
        return path.replace(/\\/g, '/').replace(/\/+$/, '');
    },
};
