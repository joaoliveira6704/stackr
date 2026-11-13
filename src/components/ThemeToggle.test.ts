import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { createAppI18n } from "../i18n";
import { useTheme } from "../lib/use-theme";
import ThemeToggle from "./ThemeToggle.vue";

afterEach(() => {
	useTheme().setTheme("light");
	localStorage.clear();
});

function mountToggle(locale: "pt" | "en" = "en") {
	return mount(ThemeToggle, {
		global: { plugins: [createAppI18n(locale)] },
	});
}

describe("ThemeToggle", () => {
	it("switches to dark mode and back", async () => {
		useTheme().setTheme("light");
		const wrapper = mountToggle();

		await wrapper.get("button").trigger("click");
		expect(document.documentElement.classList.contains("dark")).toBe(true);
		expect(localStorage.getItem("stackr.theme")).toBe("dark");

		await wrapper.get("button").trigger("click");
		expect(document.documentElement.classList.contains("dark")).toBe(false);
	});

	it("describes what a click will do", async () => {
		useTheme().setTheme("light");
		const wrapper = mountToggle();

		expect(wrapper.get("button").attributes("aria-label")).toBe(
			"Switch to dark mode",
		);
		await wrapper.get("button").trigger("click");
		expect(wrapper.get("button").attributes("aria-label")).toBe(
			"Switch to light mode",
		);
	});

	it("labels the button in Portuguese", () => {
		useTheme().setTheme("light");
		const wrapper = mountToggle("pt");

		expect(wrapper.get("button").attributes("aria-label")).toBe(
			"Mudar para modo escuro",
		);
	});
});
