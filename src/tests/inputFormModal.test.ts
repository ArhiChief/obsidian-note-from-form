import { InputFormModal } from "../ui/inputFormModal";
import { FormItem } from "../form/formItem";
import { TemplateIndexItem } from "../template/templateIndex";

// ── mocks ──

let capturedButtonOnClick: (() => Promise<void>) | null = null;

jest.mock("obsidian", () => {
    return {
        App: class {},
        Modal: class {
            app: any;
            contentEl: any;
            constructor(app: any) {
                this.app = app;
                this.contentEl = {
                    createEl: jest.fn(),
                    empty: jest.fn(),
                };
            }
            open() {}
            close() {}
        },
        Setting: jest.fn().mockImplementation(function (this: any) {
            this.addButton = jest.fn().mockImplementation((cb: any) => {
                const button: Record<string, jest.Mock> = {
                    setButtonText: jest.fn().mockReturnThis(),
                    setCta: jest.fn().mockReturnThis(),
                    onClick: jest.fn().mockImplementation((handler: any) => {
                        capturedButtonOnClick = handler;
                        return button;
                    }),
                };
                cb(button);
                return this;
            });
            return this;
        }),
    };
});

jest.mock("src/main", () => {
    return class MockPlugin {};
});

// ── helpers ──

function createMockFormItem(id: string): FormItem {
    return {
        id,
        type: "text",
        value: "",
        assignToForm: jest.fn(),
        get: jest.fn().mockReturnValue(""),
    };
}

function createModal(items: FormItem[] = [], title = "Test", callback?: jest.Mock) {
    const app = {} as any;
    const cb = callback ?? jest.fn().mockResolvedValue(undefined);
    const indexedTemplate = { file: {} as any, label: title } as TemplateIndexItem;
    const modal = new InputFormModal(app, indexedTemplate, items, cb);
    return { modal, callback: cb };
}

// ── tests ──

describe("InputFormModal", () => {

    beforeEach(() => {
        capturedButtonOnClick = null;
    });

    describe("onOpen", () => {
        test("creates a heading with the template title", () => {
            const { modal } = createModal([], "My Template");
            modal.onOpen();

            expect((modal as any).contentEl.createEl).toHaveBeenCalledWith("h1", {
                text: "New note: My Template",
            });
        });

        test("calls assignToForm on each form item", () => {
            const items = [createMockFormItem("a"), createMockFormItem("b")];
            const { modal } = createModal(items);

            modal.onOpen();

            for (const item of items) {
                expect(item.assignToForm).toHaveBeenCalledWith((modal as any).contentEl);
            }
        });

        test("creates a Setting with a Create button", () => {
            const { modal } = createModal();
            modal.onOpen();

            const { Setting } = require("obsidian");
            expect(Setting).toHaveBeenCalled();
        });

        test("Create button invokes callback and closes modal", async () => {
            const closeSpy = jest.spyOn(InputFormModal.prototype, "close").mockImplementation(() => {});
            const cb = jest.fn().mockResolvedValue(undefined);
            const { modal } = createModal([], "Test", cb);

            modal.onOpen();

            expect(capturedButtonOnClick).not.toBeNull();
            await capturedButtonOnClick!();

            expect(cb).toHaveBeenCalled();
            expect(closeSpy).toHaveBeenCalled();

            closeSpy.mockRestore();
        });
    });

    describe("onClose", () => {
        test("empties the content element", () => {
            const { modal } = createModal();
            modal.onClose();

            expect((modal as any).contentEl.empty).toHaveBeenCalled();
        });
    });
});
