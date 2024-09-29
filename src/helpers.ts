import { Buffer } from "buffer";
import * as Mustache from 'mustache'


Mustache.escape = function(text:string) { return text; };

export const nameof = <T>(name: Extract<keyof T, string>): string => name;
export const base64Encode = (val: string): string => Buffer.from(val, 'binary').toString('base64');
export const base64Decode = (val: string): string => Buffer.from(val, 'base64').toString('binary');
export const renderMustacheTemplate = (template: string, view: Record<string, any>): string => Mustache.render(template, view);
export const evaluateTextFunction = <TResult, TParam extends Array<any>>(funcText: string): (...p: TParam) => TResult => eval(`(${funcText})`);