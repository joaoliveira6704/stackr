import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import LanguageSwitcher from "../components/LanguageSwitcher.vue";
import { en } from "./en";
import { createAppI18n, DEFAULT_LOCALE, getSavedLocale } from "./index";
import { pt } from "./pt";

afterEach(() => {
	localStorage.clear();
});

function keysOf(messages: object, prefix = ""): string[] {
	return Object.entries(messages).flatMap(([key, value]) =>
		typeof value === "object"
			? keysOf(value, `${prefix}${key}.`)
			: [`${prefix}${key}`],
	);
}

describe("locale", () => {
	it("defaults to Portuguese", () => {
		expect(DEFAULT_LOCALE).toBe("pt");
		expect(getSavedLocale()).toBe("pt");
	});

	it("remembers a saved language", () => {
		localStorage.setItem("stackr.locale", "en");

		expect(getSavedLocale()).toBe("en");
	});

	it("falls back to Portuguese when the saved language is not supported", () => {
		localStorage.setItem("stackr.locale", "fr");

		expect(getSavedLocale()).toBe("pt");
	});

	it("has the same keys in English and Portuguese", () => {
		expect(keysOf(en).sort()).toEqual(keysOf(pt).sort());
	});
});

describe("LanguageSwitcher", () => {
	it("switches to English and remembers the choice", async () => {
		const i18n = createAppI18n("pt");
		const wrapper = mount(LanguageSwitcher, { global: { plugins: [i18n] } });

		const english = wrapper.findAll("button").find((b) => b.text() === "en");
		await english?.trigger("click");

		expect(i18n.global.locale.value).toBe("en");
		expect(localStorage.getItem("stackr.locale")).toBe("en");
		expect(document.documentElement.lang).toBe("en");
	});

	it("marks the active language as pressed", () => {
		const wrapper = mount(LanguageSwitcher, {
			global: { plugins: [createAppI18n("pt")] },
		});

		const pressed = wrapper.find('[aria-pressed="true"]');
		expect(pressed.text()).toBe("pt");
	});
});
