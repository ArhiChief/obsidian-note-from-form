import { App, normalizePath, TAbstractFile, TFile, TFolder, Vault } from "obsidian";
import { NoteFromFormPluginSettings } from "src/pluginSettings";

export interface InputOutput {
    readonly templatesDirectory: TFolder;
    readonly defaultOutputDirectory: TFolder;

    createDirectory (path: string): Promise<TFolder>;
    createFile (path: string, content: string): Promise<TFile>;

    getDirectory (path: string): TFolder | null;
    getFile (path: string): TFile | null;

    isDirectory (folder: TAbstractFile): boolean;
    isFile (file: TAbstractFile): boolean;
}

export class InputOutputImpl implements InputOutput {
    
    readonly templatesDirectory: TFolder;
    readonly defaultOutputDirectory: TFolder;

    private readonly _vault: Vault;

    constructor(settings: NoteFromFormPluginSettings, app: App) {
        this._vault = app.vault;
        this.templatesDirectory = this.getDirectory(normalizePath(settings.templatesFolderLocation))!;
        this.defaultOutputDirectory = this.getDirectory(normalizePath(settings.defaultOutputDir))!;
    }

    async createDirectory(path: string): Promise<TFolder> {
        return await this._vault.createFolder(normalizePath(path));
    }

    async createFile(path: string, content: string): Promise<TFile> {
        return await this._vault.create(normalizePath(path), content);
    }

    getDirectory(path: string): TFolder | null {
        return this._vault.getFolderByPath(normalizePath(path))!;
    }

    getFile(path: string): TFile | null {
        return this._vault.getFileByPath(normalizePath(path))!;
    }

    isDirectory(folder: TAbstractFile): boolean {
        return folder instanceof TFolder;
    }

    isFile(file: TAbstractFile): boolean {
        return file instanceof TFile;
    }
}