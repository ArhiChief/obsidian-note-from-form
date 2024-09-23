// @ts-ignore - not sure how to build a proper typescript def yet
import * as Mustache from 'mustache'

Mustache.escape = function(text:string) {return text;};

export class TemplateProcessor {
    static renderMustacheTemplate(template: string, view: Record<string, any>): string {
        return Mustache.render(template, view);
    }
}