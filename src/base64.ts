import { Buffer } from "buffer";

export class Base64 {
    static Encode(val: string): string {
        return Buffer
            .from(val, 'binary')
            .toString('base64');
    }

    static Decode(val: string): string {
        return Buffer
            .from(val, 'base64')
            .toString('binary');
    }
}