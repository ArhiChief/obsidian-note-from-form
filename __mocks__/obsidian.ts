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
        descEl: any;
        _name: any;
        _desc: any;
        constructor(containerEl: any) {
            this.containerEl = containerEl;
            this.descEl = { toggleClass: jest.fn() };
        }
        setName(name: any) { this._name = name; return this; }
        setDesc(desc: any) { this._desc = desc; return this; }
        addText(cb: any) { return this; }
    },
    TAbstractFile,
    TFile,
    TFolder,
    normalizePath(path: string) {
        // Strip trailing slashes, normalize backslashes
        return path.replace(/\\/g, '/').replace(/\/+$/, '');
    },
};
