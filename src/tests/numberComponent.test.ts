import { NumberComponent } from "../ui/numberComponent";

// ── helpers ──

function createMockControlEl() {
    const inputEl: any = {
        value: "",
        addEventListener: jest.fn(),
    };
    const controlEl: any = {
        createEl: jest.fn().mockReturnValue(inputEl),
    };
    return { controlEl, inputEl };
}

// ── tests ──

describe("NumberComponent", () => {

    describe("constructor", () => {
        test("creates an input element with type number", () => {
            const { controlEl } = createMockControlEl();
            new NumberComponent(controlEl);

            expect(controlEl.createEl).toHaveBeenCalledWith("input", expect.objectContaining({
                type: "number",
                attr: { type: "number" },
            }));
        });

        test("registers a change event listener", () => {
            const { controlEl, inputEl } = createMockControlEl();
            new NumberComponent(controlEl);

            expect(inputEl.addEventListener).toHaveBeenCalledWith("change", expect.any(Function));
        });
    });

    describe("setValue", () => {
        test("sets the input value to the string representation", () => {
            const { controlEl, inputEl } = createMockControlEl();
            const component = new NumberComponent(controlEl);

            component.setValue(42);

            expect(inputEl.value).toBe("42");
        });

        test("returns this for chaining", () => {
            const { controlEl } = createMockControlEl();
            const component = new NumberComponent(controlEl);

            const result = component.setValue(0);

            expect(result).toBe(component);
        });

        test("handles negative numbers", () => {
            const { controlEl, inputEl } = createMockControlEl();
            const component = new NumberComponent(controlEl);

            component.setValue(-10);

            expect(inputEl.value).toBe("-10");
        });

        test("handles floating point numbers", () => {
            const { controlEl, inputEl } = createMockControlEl();
            const component = new NumberComponent(controlEl);

            component.setValue(3.14);

            expect(inputEl.value).toBe("3.14");
        });
    });

    describe("getValue", () => {
        test("returns the parsed float from input value", () => {
            const { controlEl, inputEl } = createMockControlEl();
            const component = new NumberComponent(controlEl);

            inputEl.value = "42.5";

            expect(component.getValue()).toBe(42.5);
        });

        test("returns NaN for empty input", () => {
            const { controlEl, inputEl } = createMockControlEl();
            const component = new NumberComponent(controlEl);

            inputEl.value = "";

            expect(component.getValue()).toBeNaN();
        });
    });

    describe("onChange", () => {
        test("stores callback and returns this for chaining", () => {
            const { controlEl } = createMockControlEl();
            const component = new NumberComponent(controlEl);
            const cb = jest.fn();

            const result = component.onChange(cb);

            expect(result).toBe(component);
        });
    });

    describe("onChanged", () => {
        test("calls onChange callback with current numeric value", () => {
            const { controlEl, inputEl } = createMockControlEl();
            const component = new NumberComponent(controlEl);
            const cb = jest.fn();
            component.onChange(cb);

            inputEl.value = "99";
            component.onChanged(new Event("change"));

            expect(cb).toHaveBeenCalledWith(99);
        });

        test("does nothing when no callback is set", () => {
            const { controlEl } = createMockControlEl();
            const component = new NumberComponent(controlEl);

            expect(() => component.onChanged(new Event("change"))).not.toThrow();
        });
    });
});
