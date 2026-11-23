import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { createAppI18n } from "../i18n";
import type { YearReturn } from "../lib/market";
import YearlyReturns from "./YearlyReturns.vue";

function mountReturns(returns: YearReturn[], locale: "en" | "pt-PT" = "en") {
	return mount(YearlyReturns, {
		props: { returns },
		global: { plugins: [createAppI18n(locale)] },
	});
}

function pixels(style: string | undefined, property: string): number {
	const match = style?.match(new RegExp(`${property}: (-?[\\d.]+)px`));
	return match ? Number(match[1]) : Number.NaN;
}

function bars(wrapper: ReturnType<typeof mountReturns>) {
	return wrapper.findAll(".bg-chart-1, .bg-chart-4");
}

function zeroLineTop(wrapper: ReturnType<typeof mountReturns>) {
	return pixels(wrapper.get(".bg-line-strong").attributes("style"), "top");
}

describe("YearlyReturns", () => {
	it("draws one column per year with its short year below", () => {
		const wrapper = mountReturns([
			{ year: 2022, percent: -13 },
			{ year: 2023, percent: 18 },
		]);

		expect(bars(wrapper)).toHaveLength(2);
		expect(wrapper.text()).toContain("22");
		expect(wrapper.text()).toContain("23");
	});

	it("puts the zero line at the bottom when every year went up", () => {
		const wrapper = mountReturns([
			{ year: 2022, percent: 5 },
			{ year: 2023, percent: 10 },
		]);

		expect(zeroLineTop(wrapper)).toBe(96);
	});

	it("gives the biggest move the full height so the space is never wasted", () => {
		const wrapper = mountReturns([
			{ year: 2022, percent: 5 },
			{ year: 2023, percent: 10 },
		]);

		const heights = bars(wrapper).map((bar) =>
			pixels(bar.attributes("style"), "height"),
		);
		expect(heights).toEqual([48, 96]);
	});

	it("draws gains above the zero line and losses below it", () => {
		const wrapper = mountReturns([
			{ year: 2022, percent: -25 },
			{ year: 2023, percent: 75 },
		]);
		const [loss, gain] = bars(wrapper);
		const zero = zeroLineTop(wrapper);

		expect(zero).toBe(72);
		expect(gain.classes()).toContain("bg-chart-1");
		expect(pixels(gain.attributes("style"), "top")).toBe(0);
		expect(loss.classes()).toContain("bg-chart-4");
		expect(pixels(loss.attributes("style"), "top")).toBe(zero);
		expect(pixels(loss.attributes("style"), "height")).toBe(24);
	});

	it("still shows a sliver for a flat year", () => {
		const wrapper = mountReturns([
			{ year: 2022, percent: 0 },
			{ year: 2023, percent: 10 },
		]);

		expect(pixels(bars(wrapper)[0].attributes("style"), "height")).toBe(1);
	});

	it("reads each year's change out with its sign", () => {
		const wrapper = mountReturns([{ year: 2022, percent: -13.5 }]);

		expect(wrapper.get(".sr-only").text()).toBe("2022: -13.5%");
	});

	it("formats the change the Portuguese way", () => {
		const wrapper = mountReturns([{ year: 2023, percent: 18.2 }], "pt-PT");

		expect(wrapper.get(".sr-only").text()).toBe("2023: +18,2%");
		expect(wrapper.text()).toContain("Variação em cada ano");
	});
});
