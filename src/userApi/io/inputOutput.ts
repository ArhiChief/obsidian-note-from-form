import { App, normalizePath, TFile, TFolder, Vault } from "obsidian";
import { NoteFromFormPluginSettings } from "src/pluginSettings";

export interface InputOutput {
    readonly templatesDirectory: TFolder;
    readonly defaultOutputDirectory: TFolder;

    createDirectory (path: string): Promise<TFolder>;
    getFolder (path: string): TFolder | null;
    getFile (path: string): TFile | null;
}

export class InputOutputImpl implements InputOutput {
    
    readonly templatesDirectory: TFolder;
    readonly defaultOutputDirectory: TFolder;

    private readonly _vault: Vault;

    constructor(settings: NoteFromFormPluginSettings, app: App) {
        this._vault = app.vault;
        this.templatesDirectory = this.getFolder(settings.templatesFolderLocation)!;
        this.defaultOutputDirectory = this.getFolder(settings.defaultOutputDir)!;
    }

    createDirectory(path: string): Promise<TFolder> {
        return this._vault.createFolder(normalizePath(path));
    }

    getFolder(path: string): TFolder | null {
        return this._vault.getFolderByPath(normalizePath(path))!;
    }

    getFile(path: string): TFile | null {
        return this._vault.getFileByPath(normalizePath(path))!;
    }
}