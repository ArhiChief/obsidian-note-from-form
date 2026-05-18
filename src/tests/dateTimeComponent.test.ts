import { DateTimeComponent, DateTimeType } from "../ui/dateTimeComponent";

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

describe("DateTimeComponent", () => {

    describe("constructor", () => {
        test("creates an input element with the correct type", () => {
            const { controlEl } = createMockControlEl();
            new DateTimeComponent(controlEl, DateTimeType.Date);

            expect(controlEl.createEl).toHaveBeenCalledWith("input", expect.objectContaining({
                type: DateTimeType.Date,
                attr: { type: DateTimeType.Date },
            }));
        });

        test("registers a change event listener", () => {
            const { controlEl, inputEl } = createMockControlEl();
            new DateTimeComponent(controlEl, DateTimeType.Date);

            expect(inputEl.addEventListener).toHaveBeenCalledWith("change", expect.any(Function));
        });
    });

    describe("setValue", () => {
        test("formats Date type as yyyy-MM-DD", () => {
            const { controlEl, inputEl } = createMockControlEl();
            const component = new DateTimeComponent(controlEl, DateTimeType.Date);

            const result = component.setValue(new Date(2025, 0, 15));

            expect(inputEl.value).toMatch(/2025-01-15/);
            expect(result).toBe(component);
        });

        test("formats Time type as HH:mm:ss", () => {
            const { controlEl, inputEl } = createMockControlEl();
            const component = new DateTimeComponent(controlEl, DateTimeType.Time);

            component.setValue(new Date(2025, 0, 15, 14, 30, 45));

            expect(inputEl.value).toBe("14:30:45");
        });

        test("formats DateTime type as yyyy-MM-DDTHH:mm:ss", () => {
            const { controlEl, inputEl } = createMockControlEl();
            const component = new DateTimeComponent(controlEl, DateTimeType.DateTime);

            component.setValue(new Date(2025, 0, 15, 14, 30, 45));

            expect(inputEl.value).toBe("2025-01-15T14:30:45");
        });

        test("returns this for chaining", () => {
            const { controlEl } = createMockControlEl();
            const component = new DateTimeComponent(controlEl, DateTimeType.Date);

            const result = component.setValue(new Date());

            expect(result).toBe(component);
        });
    });

    describe("getValue", () => {
        test("returns a Date parsed from the input value", () => {
            const { controlEl, inputEl } = createMockControlEl();
            const component = new DateTimeComponent(controlEl, DateTimeType.Date);

            inputEl.value = "2025-01-15";
            const result = component.getValue();

            expect(result).toBeInstanceOf(Date);
            expect(result.getFullYear()).toBe(2025);
        });
    });

    describe("onChange", () => {
        test("stores callback and returns this for chaining", () => {
            const { controlEl } = createMockControlEl();
            const component = new DateTimeComponent(controlEl, DateTimeType.Date);
            const cb = jest.fn();

            const result = component.onChange(cb);

            expect(result).toBe(component);
        });
    });

    describe("onChanged", () => {
        test("calls onChange callback with current value", () => {
            const { controlEl, inputEl } = createMockControlEl();
            const component = new DateTimeComponent(controlEl, DateTimeType.Date);
            const cb = jest.fn();
            component.onChange(cb);

            inputEl.value = "2025-06-01";
            component.onChanged(new Event("change"));

            expect(cb).toHaveBeenCalledWith(expect.any(Date));
        });

        test("does nothing when no callback is set", () => {
            const { controlEl } = createMockControlEl();
            const component = new DateTimeComponent(controlEl, DateTimeType.Date);

            expect(() => component.onChanged(new Event("change"))).not.toThrow();
        });
    });
});

describe("DateTimeType", () => {
    test("DateTime maps to datetime-local", () => {
        expect(DateTimeType.DateTime).toBe("datetime-local");
    });

    test("Date maps to date", () => {
        expect(DateTimeType.Date).toBe("date");
    });

    test("Time maps to time", () => {
        expect(DateTimeType.Time).toBe("time");
    });
});
