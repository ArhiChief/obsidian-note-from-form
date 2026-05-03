import { App, normalizePath, TAbstractFile, TFile, TFolder } from 'obsidian';
import { NoteFromFormPluginSettings } from '../pluginSettings';

export class TemplateIndex {
    private items: TFile[] = [];

    constructor(
        private app: App,
        private settings: NoteFromFormPluginSettings,
    ) {}

    getItems(): TFile[] {
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
        await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
            const hasTemplateProperty = this.settings.templatePropertyName in frontmatter;
            const alreadyIndexed = this.items.some(f => f.path === file.path);

            if (hasTemplateProperty && !alreadyIndexed) {
                this.items.push(file);
            } else if (!hasTemplateProperty && alreadyIndexed) {
                this.items = this.items.filter(f => f.path !== file.path);
            }
        });
    }

    async rebuild() {
        this.items = [];
        const templatesFolder = this.settings.templatesFolderLocation;
        if (templatesFolder.length === 0) return;

        const folder = this.app.vault.getFolderByPath(normalizePath(templatesFolder));
        if (!folder) return;

        const files = this.getFilesRecursively(folder);
        for (const file of files) {
            await this.update(file);
        }
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
}
