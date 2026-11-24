import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { h } from "vue";
import { createAppI18n } from "../i18n";
import HorizontalScroller from "./HorizontalScroller.vue";

function mountScroller(locale: "en" | "pt-PT" = "en") {
	return mount(HorizontalScroller, {
		props: { label: "Extra lessons" },
		slots: {
			header: () => h("h2", "Extra lessons"),
			default: () => [1, 2, 3, 4].map((card) => h("article", `Card ${card}`)),
		},
		global: { plugins: [createAppI18n(locale)] },
	});
}

type Wrapper = ReturnType<typeof mountScroller>;

// jsdom does no layout, so the row's size and position are set by hand.
async function layOut(
	wrapper: Wrapper,
	size: { scrollWidth: number; clientWidth: number; scrollLeft: number },
) {
	const row = wrapper.get('[role="region"]');
	for (const [key, value] of Object.entries(size)) {
		Object.defineProperty(row.element, key, { value, configurable: true });
	}
	await row.trigger("scroll");
	return row;
}

function arrow(wrapper: Wrapper, label: string) {
	return wrapper.get(`button[aria-label="${label}"]`);
}

describe("HorizontalScroller", () => {
	it("puts every card in one labelled row that can take focus", () => {
		const wrapper = mountScroller();
		const row = wrapper.get('[role="region"]');

		expect(row.attributes("aria-label")).toBe("Extra lessons");
		expect(row.attributes("tabindex")).toBe("0");
		expect(row.findAll("article")).toHaveLength(4);
	});

	it("hides the arrows when every card fits", async () => {
		const wrapper = mountScroller();

		await layOut(wrapper, {
			scrollWidth: 600,
			clientWidth: 600,
			scrollLeft: 0,
		});

		expect(wrapper.find("button").exists()).toBe(false);
	});

	it("turns off the previous arrow at the start of the row", async () => {
		const wrapper = mountScroller();

		await layOut(wrapper, {
			scrollWidth: 1200,
			clientWidth: 600,
			scrollLeft: 0,
		});

		expect(
			arrow(wrapper, "Show previous").attributes("disabled"),
		).toBeDefined();
		expect(arrow(wrapper, "Show more").attributes("disabled")).toBeUndefined();
	});

	it("turns off the next arrow at the end of the row", async () => {
		const wrapper = mountScroller();

		await layOut(wrapper, {
			scrollWidth: 1200,
			clientWidth: 600,
			scrollLeft: 600,
		});

		expect(
			arrow(wrapper, "Show previous").attributes("disabled"),
		).toBeUndefined();
		expect(arrow(wrapper, "Show more").attributes("disabled")).toBeDefined();
	});

	it("scrolls most of a screen forward or back from the arrows", async () => {
		const wrapper = mountScroller();
		const row = await layOut(wrapper, {
			scrollWidth: 1800,
			clientWidth: 600,
			scrollLeft: 600,
		});
		const scrollBy = vi.fn();
		Object.defineProperty(row.element, "scrollBy", { value: scrollBy });

		await arrow(wrapper, "Show more").trigger("click");
		await arrow(wrapper, "Show previous").trigger("click");

		expect(scrollBy.mock.calls.map(([options]) => options.left)).toEqual([
			480, -480,
		]);
	});

	it("labels the arrows in Portuguese", async () => {
		const wrapper = mountScroller("pt-PT");

		await layOut(wrapper, {
			scrollWidth: 1200,
			clientWidth: 600,
			scrollLeft: 0,
		});

		expect(wrapper.find('button[aria-label="Ver mais"]').exists()).toBe(true);
		expect(wrapper.find('button[aria-label="Ver anteriores"]').exists()).toBe(
			true,
		);
	});
});
