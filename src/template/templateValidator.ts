import Ajv2020 from "ajv/dist/2020";
import ajvErrors from "ajv-errors";
import ajvKeywords from "ajv-keywords";
import schema from "./schema.json";

const ajv = new Ajv2020({ allErrors: true });
ajvErrors(ajv);
ajvKeywords(ajv, ["uniqueItemProperties"]);

const validate = ajv.compile(schema);

export function validateTemplate(data: unknown): { valid: boolean; errors: string[] } {
    const valid = validate(data);
    if (valid) {
        return { valid: true, errors: [] };
    }
    const errors = (validate.errors ?? []).map(err => {
        if (err.keyword === "errorMessage") {
            return `${err.instancePath}: ${err.message}`;
        }
        return `${err.instancePath || "/"}: ${err.message}`;
    });
    return { valid: false, errors };
}
