import { NoteFromFormPluginSettings } from "src/pluginSettings";
import { InputOutput, InputOutputImpl } from "./io/inputOutput";
import { App } from "obsidian";

export interface IUserApi {
    readonly io: InputOutput;
}

export class UserApi implements IUserApi {
    public readonly io: InputOutput;

    constructor(settings: NoteFromFormPluginSettings, app: App) {
        this.io = new InputOutputImpl(settings, app);
    }
}
