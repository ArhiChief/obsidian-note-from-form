import { App, FileManager, normalizePath, TAbstractFile, TFile, TFolder, Vault } from 'obsidian';
import { NoteFromFormPluginSettings } from '../pluginSettings';

export interface TemplateIndexItem {
    file: TFile;
    label: string;
}

export class TemplateIndex {
    private items: TemplateIndexItem[] = [];
    private vault: Vault;
    private fileManager: FileManager;
    private onIndexChanged: () => void;

    constructor(
        app: App,
        private settings: NoteFromFormPluginSettings,
        onIndexChanged: () => void,
    ) {
        this.vault = app.vault;
        this.fileManager = app.fileManager;
        this.onIndexChanged = onIndexChanged;
    }

    getItems(): TemplateIndexItem[] {
        return this.items;
    }

    onVaultChange(file: TAbstractFile) {
        if (!(file instanceof TFile)) return;

        if (this.isInTemplatesFolder(file)) {
            this.update(file);
        }
    }

    private isInTemplatesFolder(file: TFile): boolean {
        const templatesFolder = this.settings.templatesFolderLocation;
        if (templatesFolder.length === 0) return false;

        const normalizedFolder = normalizePath(templatesFolder);
        return file.path.startsWith(normalizedFolder + '/');
    }

    async update(file: TFile) {
        await this.fileManager.processFrontMatter(file, (frontmatter) => {
            const hasTemplateProperty = this.settings.templatePropertyName in frontmatter;
            const alreadyIndexed = this.items.some(item => item.file.path === file.path);

            if (hasTemplateProperty && !alreadyIndexed) {
                this.items.push({ file, label: this.buildLabel(file.path) });
            } else if (!hasTemplateProperty && alreadyIndexed) {
                this.items = this.items.filter(item => item.file.path !== file.path);
            }
        });
    }

    async rebuild() {
        this.items = [];
        const templatesFolder = this.settings.templatesFolderLocation;
        if (templatesFolder.length === 0) return;

        const folder = this.vault.getFolderByPath(normalizePath(templatesFolder));
        if (!folder) return;

        const files = this.getFilesRecursively(folder);
        for (const file of files) {
            await this.update(file);
        }

        this.onIndexChanged();
    }

    private getFilesRecursively(folder: TFolder): TFile[] {
        const files: TFile[] = [];
        for (const child of folder.children) {
            if (child instanceof TFile) {
                files.push(child);
            } else if (child instanceof TFolder) {
                files.push(...this.getFilesRecursively(child));
            }
        }
        return files;
    }

    private buildLabel(filePath: string): string {
        const templatesFolder = this.settings.templatesFolderLocation;
        const relativePath = filePath.startsWith(templatesFolder + '/')
            ? filePath.slice(templatesFolder.length + 1)
            : filePath;

        const parts = relativePath.replace(/\.md$/, '').split('/');
        if (parts.length === 1) return parts[0];
        return parts.join('/');
    }
}
