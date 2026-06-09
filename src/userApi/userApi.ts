import { NoteFromFormPluginSettings } from "src/pluginSettings";
import { InputOutput, InputOutputImpl } from "./io/inputOutput";
import { App, TFile } from "obsidian";
import { TemplateProcessor } from "src/template/templateProcessor";

export interface IUserApi {
    readonly io: InputOutput;
    throwError(message: string): void;
    renderTemplate(template: TFile, viewModel: Record<string, string>): Promise<void>;
}

export class UserApi implements IUserApi {
    private readonly _templateProcessor: TemplateProcessor;

    public readonly io: InputOutput;

    constructor(settings: NoteFromFormPluginSettings, app: App, templateProcessor: TemplateProcessor) {
        this.io = new InputOutputImpl(settings, app) as InputOutput;
        this._templateProcessor = templateProcessor;
    }

    throwError(message: string): void {
        throw new Error(message);
    }

    async renderTemplate(template: TFile, viewModel: Record<string, string>): Promise<void> {
        await this._templateProcessor.renderTemplate(template, viewModel);
    }
}
