import { FormItemFunctionProcessor } from "../form/formItemFunctionProcessor";
import { TFile } from "obsidian";

// ── helpers ──

function createMockFile(path: string): TFile {
    const file = new TFile();
    file.path = path;
    return file;
}

function createMockApp(overrides: {
    cachedRead?: jest.Mock;
    getFileByPath?: jest.Mock;
} = {}) {
    return {
        vault: {
            cachedRead: overrides.cachedRead ?? jest.fn(),
            getFileByPath: overrides.getFileByPath ?? jest.fn(),
        },
        metadataCache: {
            getFileCache: jest.fn(),
        },
    } as any;
}

function createProcessor(overrides: {
    fileContent?: string;
    externalFile?: TFile | null;
    templateFile?: TFile;
    templatePropertyName?: string;
} = {}) {
    const templateFile = overrides.templateFile ?? createMockFile("templates/my-template.md");
    const externalFile = overrides.externalFile;

    const cachedRead = jest.fn().mockResolvedValue(overrides.fileContent ?? "");
    const getFileByPath = jest.fn().mockReturnValue(externalFile ?? null);

    const app = createMockApp({ cachedRead, getFileByPath });
    const template = { file: templateFile, label: "My Template" };
    const settings = {
        templatesFolderLocation: "templates",
        templatePropertyName: overrides.templatePropertyName ?? "note-from-form",
        defaultOutputDir: "",
    };

    const processor = new FormItemFunctionProcessor(template, app, settings);
    return { processor, cachedRead, getFileByPath };
}

function codeBlock(tag: string, funcName: string, body: string): string {
    return "```js:" + tag + ":" + funcName + "\n" + body + "\n```";
}

// ── tests ──

describe("FormItemFunctionProcessor", () => {

    // ─── renderMustacheTemplate ───

    describe("renderMustacheTemplate", () => {
        test("renders template with view data", () => {
            const { processor } = createProcessor();
            const result = processor.renderMustacheTemplate("Hello {{name}}", { name: "World" });
            expect(result).toBe("Hello World");
        });

        test("returns template as-is when no placeholders", () => {
            const { processor } = createProcessor();
            const result = processor.renderMustacheTemplate("plain text", {});
            expect(result).toBe("plain text");
        });

        test("does not escape HTML", () => {
            const { processor } = createProcessor();
            const result = processor.renderMustacheTemplate("{{val}}", { val: "<b>bold</b>" });
            expect(result).toBe("<b>bold</b>");
        });
    });

    // ─── executeFunction ───

    describe("executeFunction", () => {
        test("evaluates arrow function", () => {
            const { processor } = createProcessor();
            const result = processor.executeFunction<number>("() => 42");
            expect(result).toBe(42);
        });

        test("evaluates function expression", () => {
            const { processor } = createProcessor();
            const result = processor.executeFunction<string>("function() { return 'hello'; }");
            expect(result).toBe("hello");
        });

        test("throws for invalid function text", () => {
            const { processor } = createProcessor();
            expect(() => processor.executeFunction("not a function")).toThrow();
        });
    });

    // ─── executeFunctionWithParam ───

    describe("executeFunctionWithParam", () => {
        test("passes arguments to arrow function", () => {
            const { processor } = createProcessor();
            const result = processor.executeFunctionWithParam<string, [Record<string, any>]>(
                "(view) => view.name", { name: "test" }
            );
            expect(result).toBe("test");
        });

        test("passes arguments to function expression", () => {
            const { processor } = createProcessor();
            const result = processor.executeFunctionWithParam<number, [number, number]>(
                "function(a, b) { return a + b; }", 3, 4
            );
            expect(result).toBe(7);
        });
    });

    // ─── executeRefFunction ───

    describe("executeRefFunction", () => {
        test("reads function from current template file by name", async () => {
            const templateFile = createMockFile("templates/my-template.md");
            const body = "() => 'from-template'";
            const fileContent = codeBlock("note-from-form", "myInit", body);

            const { processor, cachedRead } = createProcessor({
                templateFile,
                fileContent,
            });

            const result = await processor.executeRefFunction<string>("myInit");
            expect(cachedRead).toHaveBeenCalledWith(templateFile);
            expect(result).toBe("from-template");
        });

        test("reads function from external file by path:name", async () => {
            const externalFile = createMockFile("utils/helpers.md");
            const body = "() => 99";
            const fileContent = codeBlock("note-from-form", "getNum", body);

            const { processor, cachedRead, getFileByPath } = createProcessor({
                externalFile,
                fileContent,
            });

            const result = await processor.executeRefFunction<number>("utils/helpers.md:getNum");
            expect(getFileByPath).toHaveBeenCalledWith("utils/helpers.md");
            expect(cachedRead).toHaveBeenCalledWith(externalFile);
            expect(result).toBe(99);
        });

        test("throws when external file is not found", async () => {
            const { processor } = createProcessor({ externalFile: null, fileContent: "" });
            await expect(processor.executeRefFunction("missing/file.md:func"))
                .rejects.toThrow("File not found for reference");
        });

        test("throws when function is not found in file", async () => {
            const templateFile = createMockFile("templates/tpl.md");
            const { processor } = createProcessor({
                templateFile,
                fileContent: "some content without code blocks",
            });

            await expect(processor.executeRefFunction("nonExistent"))
                .rejects.toThrow("Function 'nonExistent' not found in file");
        });

        test("throws for invalid ref format with multiple colons", async () => {
            const { processor } = createProcessor();
            await expect(processor.executeRefFunction("a:b:c"))
                .rejects.toThrow("Invalid reference format");
        });
    });

    // ─── executeRefFunctionWithParam ───

    describe("executeRefFunctionWithParam", () => {
        test("passes arguments to referenced function", async () => {
            const templateFile = createMockFile("templates/tpl.md");
            const body = "(view) => view.x + 1";
            const fileContent = codeBlock("note-from-form", "compute", body);

            const { processor } = createProcessor({
                templateFile,
                fileContent,
            });

            const result = await processor.executeRefFunctionWithParam<number, [Record<string, any>]>(
                "compute", { x: 10 }
            );
            expect(result).toBe(11);
        });
    });

    // ─── getFunctionText (via executeRefFunction) ───

    describe("getFunctionText regex matching", () => {
        test("matches code block with custom templatePropertyName", async () => {
            const templateFile = createMockFile("tpl.md");
            const body = "() => 'custom'";
            const fileContent = codeBlock("my-form", "init", body);

            const { processor } = createProcessor({
                templateFile,
                templatePropertyName: "my-form",
                fileContent,
            });

            const result = await processor.executeRefFunction<string>("init");
            expect(result).toBe("custom");
        });

        test("ignores code blocks with wrong tag", async () => {
            const templateFile = createMockFile("tpl.md");
            const fileContent = codeBlock("other-plugin", "init", "() => 'wrong'");

            const { processor } = createProcessor({
                templateFile,
                fileContent,
            });

            await expect(processor.executeRefFunction("init"))
                .rejects.toThrow("Function 'init' not found in file");
        });

        test("ignores code blocks with wrong function name", async () => {
            const templateFile = createMockFile("tpl.md");
            const fileContent = codeBlock("note-from-form", "other", "() => 'wrong'");

            const { processor } = createProcessor({
                templateFile,
                fileContent,
            });

            await expect(processor.executeRefFunction("myFunc"))
                .rejects.toThrow("Function 'myFunc' not found in file");
        });

        test("extracts multiline function body", async () => {
            const templateFile = createMockFile("tpl.md");
            const body = "function() {\n    const x = 1;\n    return x + 1;\n}";
            const fileContent = codeBlock("note-from-form", "calc", body);

            const { processor } = createProcessor({
                templateFile,
                fileContent,
            });

            const result = await processor.executeRefFunction<number>("calc");
            expect(result).toBe(2);
        });

        test("matches correct block among multiple blocks", async () => {
            const templateFile = createMockFile("tpl.md");
            const fileContent = [
                codeBlock("note-from-form", "first", "() => 'one'"),
                "",
                codeBlock("note-from-form", "second", "() => 'two'"),
            ].join("\n");

            const { processor } = createProcessor({
                templateFile,
                fileContent,
            });

            const result1 = await processor.executeRefFunction<string>("first");
            expect(result1).toBe("one");
        });

        test("matches block surrounded by other markdown", async () => {
            const templateFile = createMockFile("tpl.md");
            const body = "() => true";
            const fileContent = [
                "# My Template",
                "",
                "Some description here.",
                "",
                codeBlock("note-from-form", "isActive", body),
                "",
                "More text after.",
            ].join("\n");

            const { processor } = createProcessor({
                templateFile,
                fileContent,
            });

            const result = await processor.executeRefFunction<boolean>("isActive");
            expect(result).toBe(true);
        });
    });
});
