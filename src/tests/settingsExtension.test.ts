import { ExtendedSetting } from "../ui/settingsExtension";
import { DateTimeComponent, DateTimeType } from "../ui/dateTimeComponent";
import { NumberComponent } from "../ui/numberComponent";

// ── tests ──

describe("ExtendedSetting", () => {

    function createSetting(): ExtendedSetting {
        const containerEl: any = {
            createEl: jest.fn().mockReturnValue({
                value: "",
                addEventListener: jest.fn(),
            }),
        };
        return new ExtendedSetting(containerEl);
    }

    describe("addDateTime", () => {
        test("passes a DateTimeComponent to the callback", () => {
            const setting = createSetting();
            const cb = jest.fn();

            setting.addDateTime(cb);

            expect(cb).toHaveBeenCalledWith(expect.any(DateTimeComponent));
        });

        test("pushes component to components array", () => {
            const setting = createSetting();

            setting.addDateTime(() => {});

            expect(setting.components.length).toBe(1);
            expect(setting.components[0]).toBeInstanceOf(DateTimeComponent);
        });

        test("returns this for chaining", () => {
            const setting = createSetting();

            const result = setting.addDateTime(() => {});

            expect(result).toBe(setting);
        });
    });

    describe("addDate", () => {
        test("passes a DateTimeComponent to the callback", () => {
            const setting = createSetting();
            const cb = jest.fn();

            setting.addDate(cb);

            expect(cb).toHaveBeenCalledWith(expect.any(DateTimeComponent));
        });

        test("pushes component to components array", () => {
            const setting = createSetting();

            setting.addDate(() => {});

            expect(setting.components.length).toBe(1);
        });

        test("returns this for chaining", () => {
            const setting = createSetting();

            const result = setting.addDate(() => {});

            expect(result).toBe(setting);
        });
    });

    describe("addTime", () => {
        test("passes a DateTimeComponent to the callback", () => {
            const setting = createSetting();
            const cb = jest.fn();

            setting.addTime(cb);

            expect(cb).toHaveBeenCalledWith(expect.any(DateTimeComponent));
        });

        test("pushes component to components array", () => {
            const setting = createSetting();

            setting.addTime(() => {});

            expect(setting.components.length).toBe(1);
        });

        test("returns this for chaining", () => {
            const setting = createSetting();

            const result = setting.addTime(() => {});

            expect(result).toBe(setting);
        });
    });

    describe("addNumber", () => {
        test("passes a NumberComponent to the callback", () => {
            const setting = createSetting();
            const cb = jest.fn();

            setting.addNumber(cb);

            expect(cb).toHaveBeenCalledWith(expect.any(NumberComponent));
        });

        test("pushes component to components array", () => {
            const setting = createSetting();

            setting.addNumber(() => {});

            expect(setting.components.length).toBe(1);
            expect(setting.components[0]).toBeInstanceOf(NumberComponent);
        });

        test("returns this for chaining", () => {
            const setting = createSetting();

            const result = setting.addNumber(() => {});

            expect(result).toBe(setting);
        });
    });

    describe("multiple components", () => {
        test("accumulates components when adding multiple items", () => {
            const setting = createSetting();

            setting
                .addDateTime(() => {})
                .addDate(() => {})
                .addTime(() => {})
                .addNumber(() => {});

            expect(setting.components.length).toBe(4);
        });
    });
});
