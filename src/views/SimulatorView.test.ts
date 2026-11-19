import { flushPromises, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type Component, defineComponent, h } from "vue";
import { RouterView } from "vue-router";
import {
	chartBody,
	demoUser,
	fakeSimulatorApi,
	jsonResponse,
	searchBody,
	storeSessionFor,
} from "../test/fake-api";
import { answerConfirmDialog, mountAt } from "../test/mount";
import SimulatorView from "./SimulatorView.vue";

const STEADY_GROWTH = { 2019: 8, 2020: 8, 2021: 8, 2022: 8, 2023: 8 };

const savedPortfolio = {
	years: 10,
	inflationPercent: 2,
	holdings: [
		{
			id: "h1",
			symbol: null,
			name: "Savings plan",
			kind: null,
			initial: 1000,
			monthly: 0,
			annualReturnPercent: 0,
			returnSource: "manual",
			yearlyReturns: [],
			historyYears: 0,
		},
	],
};

beforeEach(() => {
	storeSessionFor(demoUser);
});

afterEach(() => {
	localStorage.clear();
	vi.unstubAllGlobals();
	vi.useRealTimers();
});

// Leave guards only run for a page rendered by RouterView, as it is in App.vue.
const RoutedPage = defineComponent({ render: () => h(RouterView) });

async function mountSimulator(
	locale: "en" | "pt-PT" = "en",
	page: Component = SimulatorView,
) {
	const mounted = await mountAt("/simulator", page, locale);
	await flushPromises();
	return mounted;
}

function buttonWithText(wrapper: VueWrapper, text: string) {
	const button = wrapper
		.findAll("button")
		.find((candidate) => candidate.text().includes(text));
	if (!button) throw new Error(`No button with the text "${text}"`);
	return button;
}

async function click(wrapper: VueWrapper, text: string) {
	await buttonWithText(wrapper, text).trigger("click");
	await flushPromises();
}

describe("SimulatorView", () => {
	it("invites the user to add a first investment", async () => {
		fakeSimulatorApi();
		const { wrapper } = await mountSimulator();

		expect(wrapper.text()).toContain("You have no investments yet.");
		expect(wrapper.text()).not.toContain("Final value");
	});

	it("shows the saved portfolio with its projection", async () => {
		fakeSimulatorApi({ portfolio: savedPortfolio });
		const { wrapper } = await mountSimulator();

		expect(wrapper.text()).toContain("Savings plan");
		expect(wrapper.text()).toContain("In 10 years");
		expect(wrapper.text()).toContain("€1,000.00");
	});

	it("explains a failed load and loads again on retry", async () => {
		const { fetchMock } = fakeSimulatorApi();
		fetchMock.mockImplementationOnce(async () => jsonResponse({}, 500));
		const { wrapper } = await mountSimulator();

		expect(wrapper.text()).toContain("Could not load your portfolio.");

		await click(wrapper, "Try again");

		expect(wrapper.text()).toContain("You have no investments yet.");
	});

	it("projects an investment added by hand with the default amounts", async () => {
		fakeSimulatorApi();
		const { wrapper } = await mountSimulator();

		await click(wrapper, "Add by hand");

		expect(wrapper.text()).toContain("Investment 1");
		expect(wrapper.text()).toContain("Your estimate");
		// 1000 at the start plus 100 a month for 20 years.
		expect(wrapper.text()).toContain("€25,000.00");
		expect(wrapper.text()).toContain("Final value");
		expect(wrapper.text()).toContain("Above inflation");
		expect(wrapper.text()).toContain("Pessimistic");
	});

	it("uses the real past growth of a popular ETF", async () => {
		fakeSimulatorApi({
			charts: { "VWCE.DE": chartBody("VWCE.DE", STEADY_GROWTH) },
		});
		const { wrapper } = await mountSimulator();

		await click(wrapper, "Vanguard FTSE All-World");

		expect(wrapper.text()).toContain("Real average of the last 4 years");
		expect(wrapper.text()).toContain("Change in each year");
		const returnField = wrapper.findAll<HTMLInputElement>(
			'input[type="number"]',
		)[3];
		expect(returnField.element.value).toBe("8");
	});

	it("still adds a ticker and asks for a return when the market is down", async () => {
		fakeSimulatorApi({ marketDown: true });
		const { wrapper } = await mountSimulator();

		await click(wrapper, "Bitcoin");

		expect(wrapper.text()).toContain(
			"We could not fetch the history of Bitcoin. Type the return you expect.",
		);
		expect(wrapper.text()).toContain("No history, type your estimate");
	});

	it("finds a ticker by searching and adds the one picked", async () => {
		vi.useFakeTimers();
		fakeSimulatorApi({
			search: searchBody([
				{ symbol: "AAPL", longname: "Apple Inc.", quoteType: "EQUITY" },
			]),
			charts: { AAPL: chartBody("AAPL", STEADY_GROWTH, "Apple Inc.") },
		});
		const { wrapper } = await mountSimulator();

		await wrapper.get('input[type="search"]').setValue("apple");
		await vi.advanceTimersByTimeAsync(400);
		await flushPromises();
		await click(wrapper, "Apple Inc.");

		expect(wrapper.findAll("article h3").map((title) => title.text())).toEqual([
			"Apple Inc.",
		]);
	});

	it("lists every match from a long search in a list that scrolls", async () => {
		vi.useFakeTimers();
		const matches = Array.from({ length: 12 }, (_, index) => ({
			symbol: `ETF${index}`,
			longname: `Fund number ${index}`,
			quoteType: "ETF",
		}));
		fakeSimulatorApi({ search: searchBody(matches) });
		const { wrapper } = await mountSimulator();

		await wrapper.get('input[type="search"]').setValue("fund");
		await vi.advanceTimersByTimeAsync(400);
		await flushPromises();

		const list = wrapper.get("ul.popover");
		expect(list.findAll("li")).toHaveLength(12);
		expect(list.classes()).toContain("overflow-y-auto");
	});

	it("does nothing to a holding until the removal is confirmed", async () => {
		fakeSimulatorApi({ portfolio: savedPortfolio });
		const { wrapper } = await mountSimulator();

		await wrapper
			.get('button[aria-label="Remove Savings plan"]')
			.trigger("click");
		await flushPromises();

		expect(wrapper.text()).toContain("Remove Savings plan?");
		expect(wrapper.findAll("article h3")).toHaveLength(1);
	});

	it("keeps the holding when the removal is cancelled", async () => {
		fakeSimulatorApi({ portfolio: savedPortfolio });
		const { wrapper } = await mountSimulator();

		await wrapper
			.get('button[aria-label="Remove Savings plan"]')
			.trigger("click");
		await flushPromises();
		await answerConfirmDialog(wrapper, "cancel");

		expect(wrapper.findAll("article h3")).toHaveLength(1);
	});

	it("removes the holding once the removal is confirmed", async () => {
		fakeSimulatorApi({ portfolio: savedPortfolio });
		const { wrapper } = await mountSimulator();

		await wrapper
			.get('button[aria-label="Remove Savings plan"]')
			.trigger("click");
		await flushPromises();
		await answerConfirmDialog(wrapper, "confirm");

		expect(wrapper.findAll("article h3")).toHaveLength(0);
		expect(wrapper.text()).toContain("You have no investments yet.");
	});

	it("explains an empty amount instead of projecting it as zero", async () => {
		fakeSimulatorApi({ portfolio: savedPortfolio });
		const { wrapper } = await mountSimulator();

		await wrapper.findAll('input[type="number"]')[1].setValue("");

		expect(wrapper.text()).toContain(
			"Amounts invested have to be numbers of zero or more.",
		);
		expect(wrapper.text()).not.toContain("Final value");
	});

	it("only lets the user save once something changed", async () => {
		const { saved } = fakeSimulatorApi({ portfolio: savedPortfolio });
		const { wrapper } = await mountSimulator();
		const saveButton = () => buttonWithText(wrapper, "Save portfolio");

		expect(saveButton().attributes("disabled")).toBeDefined();

		await click(wrapper, "30 years");
		expect(saveButton().attributes("disabled")).toBeUndefined();

		await click(wrapper, "Save portfolio");

		expect(saved).toHaveLength(1);
		expect(saved[0]).toMatchObject({ portfolio: { years: 30 } });
		expect(wrapper.text()).toContain("Portfolio saved.");
	});

	it("shows a clear error and keeps the changes when saving fails", async () => {
		fakeSimulatorApi({ portfolio: savedPortfolio, saveFails: true });
		const { wrapper } = await mountSimulator();
		await click(wrapper, "30 years");

		await click(wrapper, "Save portfolio");

		expect(wrapper.text()).toContain(
			"Could not save your portfolio. Try again.",
		);
		expect(
			buttonWithText(wrapper, "Save portfolio").attributes("disabled"),
		).toBeUndefined();
	});

	it("leaves straight away when there is nothing to save", async () => {
		fakeSimulatorApi({ portfolio: savedPortfolio });
		const { wrapper, router } = await mountSimulator("en", RoutedPage);

		await router.push("/dashboard");
		await flushPromises();

		expect(router.currentRoute.value.path).toBe("/dashboard");
		expect(wrapper.text()).not.toContain("Leave without saving?");
	});

	it("stays on the page when leaving with unsaved changes is cancelled", async () => {
		fakeSimulatorApi({ portfolio: savedPortfolio });
		const { wrapper, router } = await mountSimulator("en", RoutedPage);
		await click(wrapper, "30 years");

		const leaving = router.push("/dashboard");
		await flushPromises();
		expect(wrapper.text()).toContain("Leave without saving?");
		await answerConfirmDialog(wrapper, "cancel");
		await leaving;

		expect(router.currentRoute.value.path).toBe("/simulator");
	});

	it("leaves without saving once the user confirms", async () => {
		const { saved } = fakeSimulatorApi({ portfolio: savedPortfolio });
		const { wrapper, router } = await mountSimulator("en", RoutedPage);
		await click(wrapper, "30 years");

		const leaving = router.push("/dashboard");
		await flushPromises();
		await answerConfirmDialog(wrapper, "confirm");
		await leaving;

		expect(router.currentRoute.value.path).toBe("/dashboard");
		expect(saved).toHaveLength(0);
	});

	it("projects again over the period the user picks", async () => {
		fakeSimulatorApi({
			portfolio: {
				...savedPortfolio,
				holdings: [{ ...savedPortfolio.holdings[0], monthly: 100 }],
			},
		});
		const { wrapper } = await mountSimulator();
		expect(wrapper.text()).toContain("In 10 years");

		await click(wrapper, "30 years");

		expect(wrapper.text()).toContain("In 30 years");
		// 1000 at the start plus 100 a month for 30 years, with no return.
		expect(wrapper.text()).toContain("€37,000.00");
	});

	it("shows every year in a table for readers who prefer one", async () => {
		fakeSimulatorApi({ portfolio: savedPortfolio });
		const { wrapper } = await mountSimulator();

		await click(wrapper, "Show table");

		expect(wrapper.findAll("tbody tr")).toHaveLength(11);
		expect(
			buttonWithText(wrapper, "Hide table").attributes("aria-expanded"),
		).toBe("true");
	});

	it("speaks Portuguese and formats euros the Portuguese way", async () => {
		fakeSimulatorApi({ portfolio: savedPortfolio });
		const { wrapper } = await mountSimulator("pt-PT");

		expect(wrapper.text()).toContain("Projeta o teu investimento.");
		expect(wrapper.text()).toContain("Daqui a 10 anos");
		expect(wrapper.text()).toMatch(/1000,00\s€/);
	});
});
