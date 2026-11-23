import {
	enableAutoUnmount,
	flushPromises,
	type VueWrapper,
} from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type Component, defineComponent, h } from "vue";
import { RouterView } from "vue-router";
import { AUTO_SAVE_DELAY_MS } from "../lib/use-saved-plan";
import {
	demoUser,
	fakeAppApi,
	jsonResponse,
	storeSessionFor,
} from "../test/fake-api";
import { answerConfirmDialog, mountAt } from "../test/mount";
import SimulatorView from "./SimulatorView.vue";

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
			deposits: [],
			returnSource: "manual",
			yearlyReturns: [],
			historyYears: 0,
		},
	],
};

// An open page keeps its auto save timer, which must not fire into the next test.
enableAutoUnmount(afterEach);

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

// Only the timers are faked, so promises and flushPromises keep working.
function holdAutoSave() {
	vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
}

async function waitForAutoSave() {
	await vi.advanceTimersByTimeAsync(AUTO_SAVE_DELAY_MS);
	await flushPromises();
}

function recordInput(wrapper: VueWrapper, field: "monthly" | "rate") {
	return wrapper
		.get("article")
		.findAll('input[type="number"]')[field === "monthly" ? 0 : 1];
}

// The results below have sections of their own, without record cards.
function recordGroups(wrapper: VueWrapper) {
	return wrapper
		.findAll("section section")
		.filter((section) => section.find("article").exists());
}

describe("SimulatorView", () => {
	it("points to the register when nothing is recorded", async () => {
		fakeAppApi();
		const { wrapper } = await mountSimulator();

		expect(wrapper.text()).toContain("You have nothing recorded yet.");
		expect(wrapper.find('a[href="/register"]').exists()).toBe(true);
		expect(wrapper.text()).not.toContain("Final value");
	});

	it("projects the savings recorded in the register", async () => {
		fakeAppApi({
			portfolio: {
				...savedPortfolio,
				holdings: [],
				savings: [
					{
						id: "s1",
						name: "Certificates",
						type: "savingsCertificates",
						initial: 2000,
						monthly: 0,
						annualReturnPercent: 0,
					},
				],
			},
		});
		const { wrapper } = await mountSimulator();

		expect(wrapper.text()).toContain("Certificates");
		expect(wrapper.text()).toContain("€2,000.00");
	});

	it("brings in each record with only the deposit and return to change", async () => {
		fakeAppApi({ portfolio: savedPortfolio });
		const { wrapper } = await mountSimulator();

		const card = wrapper.get("article");

		expect(card.text()).toContain("Savings plan");
		expect(card.text()).toContain("Current value€1,000.00");
		expect(card.text()).toContain("Monthly deposit");
		expect(card.findAll("input")).toHaveLength(2);
	});

	it("projects a bigger monthly deposit without touching the value", async () => {
		fakeAppApi({ portfolio: savedPortfolio });
		const { wrapper } = await mountSimulator();

		await wrapper.get('article input[type="number"]').setValue("100");

		// 1000 today plus 100 a month for 10 years, with no return.
		expect(wrapper.text()).toContain("€13,000.00");
		expect(wrapper.get("article").text()).toContain("Current value€1,000.00");
	});

	it("projects the return the user types in", async () => {
		fakeAppApi({ portfolio: savedPortfolio });
		const { wrapper } = await mountSimulator();

		await wrapper.findAll('article input[type="number"]')[1].setValue("10");

		// 1000 growing 10% a year for 10 years.
		expect(wrapper.text()).toContain("€2,593.74");
	});

	it("saves the simulated deposit by itself without adding a real one", async () => {
		const { saved } = fakeAppApi({ portfolio: savedPortfolio });
		const { wrapper } = await mountSimulator();
		holdAutoSave();

		await recordInput(wrapper, "monthly").setValue("100");
		expect(wrapper.text()).toContain("Saving...");
		await waitForAutoSave();

		expect(saved).toHaveLength(1);
		expect(saved[0]).toMatchObject({
			portfolio: { holdings: [{ initial: 1000, monthly: 100, deposits: [] }] },
		});
		expect(wrapper.text()).toContain("Settings saved.");
	});

	it("takes a bigger simulated deposit out of what the budget leaves free", async () => {
		fakeAppApi({
			portfolio: savedPortfolio,
			budget: { salary: 1000, categories: [], expenses: [] },
		});
		const { wrapper } = await mountSimulator();
		await wrapper.get('article input[type="number"]').setValue("300");

		await click(wrapper, "Add by hand");

		expect(wrapper.text()).toContain("€600.00 a month still free");
	});

	it("shows a nametag and the same rate as TANB, TANL and TAE", async () => {
		fakeAppApi({
			portfolio: {
				...savedPortfolio,
				holdings: [],
				savings: [
					{
						id: "s1",
						name: "Certificates",
						nametag: "Rainy day",
						type: "savingsCertificates",
						interest: "compoundMonthly",
						rateBasis: "tanb",
						initial: 1000,
						monthly: 0,
						annualReturnPercent: 12,
					},
				],
			},
		});
		const { wrapper } = await mountSimulator();

		const card = wrapper.get("article");

		expect(card.get("h4").text()).toBe("Rainy day");
		expect(card.text()).toContain("TANB per year");
		expect(card.text()).toContain("TANB 12.00% · TANL 8.64% · TAE 12.68%");
	});

	it("tries another rate without moving the real value", async () => {
		const lastYear = `${new Date().getFullYear() - 1}-01-01`;
		const { saved } = fakeAppApi({
			portfolio: {
				...savedPortfolio,
				holdings: [],
				savings: [
					{
						id: "s1",
						name: "Certificates",
						type: "savingsCertificates",
						interest: "simple",
						rateBasis: "tanl",
						initial: 1000,
						monthly: 0,
						annualReturnPercent: 0,
						contractRatePercent: 0,
						startDate: lastYear,
					},
				],
			},
		});
		const { wrapper } = await mountSimulator();

		await wrapper.findAll('article input[type="number"]')[1].setValue("50");

		expect(wrapper.get("article").text()).toContain("Current value€1,000.00");
		expect(saved).toHaveLength(0);
	});

	it("splits the records into investments and savings", async () => {
		fakeAppApi({
			portfolio: {
				...savedPortfolio,
				savings: [
					{
						id: "s1",
						name: "Certificates",
						type: "savingsCertificates",
						initial: 2000,
						monthly: 0,
						annualReturnPercent: 0,
					},
				],
			},
		});
		const { wrapper } = await mountSimulator();

		const groups = recordGroups(wrapper);

		expect(groups.map((group) => group.get("h3").text())).toEqual([
			"Investments",
			"Savings",
		]);
		expect(groups[0].text()).toContain("Savings plan");
		expect(groups[0].text()).toContain("€1,000.00");
		expect(groups[1].text()).toContain("Certificates");
		expect(groups[1].text()).toContain("€2,000.00");
		expect(groups[0].text()).not.toContain("Certificates");
	});

	it("hides a group with nothing in it", async () => {
		fakeAppApi({ portfolio: savedPortfolio });
		const { wrapper } = await mountSimulator();

		expect(
			recordGroups(wrapper).map((group) => group.get("h3").text()),
		).toEqual(["Investments"]);
	});

	it("names the groups in Portuguese", async () => {
		fakeAppApi({
			portfolio: {
				...savedPortfolio,
				savings: [
					{ id: "s1", name: "PPR", type: "ppr", initial: 100, monthly: 0 },
				],
			},
		});
		const { wrapper } = await mountSimulator("pt-PT");

		expect(
			recordGroups(wrapper).map((group) => group.get("h3").text()),
		).toEqual(["Investimentos", "Poupanças"]);
	});

	it("tries a new investment without saving it to the register", async () => {
		const { saved } = fakeAppApi({ portfolio: savedPortfolio });
		const { wrapper } = await mountSimulator();
		holdAutoSave();

		await click(wrapper, "Add by hand");

		expect(wrapper.text()).toContain("Is it worth it?");
		expect(wrapper.text()).toContain("New investment");
		await waitForAutoSave();
		expect(saved).toHaveLength(0);
	});

	it("says a new investment fits when the budget has room", async () => {
		fakeAppApi({
			portfolio: savedPortfolio,
			budget: { salary: 1000, categories: [], expenses: [] },
		});
		const { wrapper } = await mountSimulator();

		await click(wrapper, "Add by hand");

		expect(wrapper.text()).toContain("Fits your budget");
		expect(wrapper.text()).toContain("€900.00 a month still free");
	});

	it("says a new investment does not fit a tight budget", async () => {
		fakeAppApi({
			portfolio: savedPortfolio,
			budget: { salary: 50, categories: [], expenses: [] },
		});
		const { wrapper } = await mountSimulator();

		await click(wrapper, "Add by hand");

		expect(wrapper.text()).toContain("Does not fit your budget");
		expect(wrapper.text()).toContain("€50.00 a month short");
	});

	it("asks for a budget when there is no salary to compare with", async () => {
		fakeAppApi({ portfolio: savedPortfolio });
		const { wrapper } = await mountSimulator();

		await click(wrapper, "Add by hand");

		expect(wrapper.text()).toContain("Your budget is missing");
	});

	it("keeps the trial until its removal is confirmed", async () => {
		fakeAppApi({ portfolio: savedPortfolio });
		const { wrapper } = await mountSimulator();
		await click(wrapper, "Add by hand");
		const remove = 'button[aria-label="Remove New investment"]';

		await wrapper.get(remove).trigger("click");
		await flushPromises();
		expect(wrapper.text()).toContain(
			"Remove New investment from the simulation?",
		);
		await answerConfirmDialog(wrapper, "cancel");
		expect(wrapper.find(remove).exists()).toBe(true);

		await wrapper.get(remove).trigger("click");
		await flushPromises();
		await answerConfirmDialog(wrapper, "confirm");
		expect(wrapper.find(remove).exists()).toBe(false);
	});

	it("explains an empty trial amount instead of projecting it as zero", async () => {
		fakeAppApi({ portfolio: savedPortfolio });
		const { wrapper } = await mountSimulator();
		await click(wrapper, "Add by hand");

		await wrapper.findAll('article input[type="number"]')[0].setValue("");

		expect(wrapper.text()).toContain(
			"Amounts invested have to be numbers of zero or more.",
		);
		expect(wrapper.text()).not.toContain("Is it worth it?");
	});

	it("shows the badges of the investing lessons", async () => {
		fakeAppApi();
		const { wrapper } = await mountSimulator();

		expect(wrapper.text()).toContain("What you are applying here");
		expect(wrapper.text()).toContain("Compound Interest");
		expect(wrapper.text()).toContain("Prudent Investor");
	});

	it("shows the saved portfolio with its projection", async () => {
		fakeAppApi({ portfolio: savedPortfolio });
		const { wrapper } = await mountSimulator();

		expect(wrapper.text()).toContain("Savings plan");
		expect(wrapper.text()).toContain("In 10 years");
		expect(wrapper.text()).toContain("€1,000.00");
	});

	it("explains a failed load and loads again on retry", async () => {
		const { fetchMock } = fakeAppApi();
		fetchMock.mockImplementationOnce(async () => jsonResponse({}, 500));
		const { wrapper } = await mountSimulator();

		expect(wrapper.text()).toContain("Could not load your portfolio.");

		await click(wrapper, "Try again");

		expect(wrapper.text()).toContain("You have nothing recorded yet.");
	});

	it("sends one save for a burst of quick changes", async () => {
		const { saved } = fakeAppApi({ portfolio: savedPortfolio });
		const { wrapper } = await mountSimulator();
		holdAutoSave();

		await recordInput(wrapper, "rate").setValue("1");
		await recordInput(wrapper, "rate").setValue("12");
		await waitForAutoSave();

		expect(saved).toHaveLength(1);
		expect(saved[0]).toMatchObject({
			portfolio: { holdings: [{ annualReturnPercent: 12 }] },
		});
	});

	it("saves nothing right after loading", async () => {
		const { saved } = fakeAppApi({ portfolio: savedPortfolio });
		holdAutoSave();
		await mountSimulator();
		await waitForAutoSave();

		expect(saved).toEqual([]);
	});

	it("does not store a rate while the field is empty", async () => {
		const { saved } = fakeAppApi({ portfolio: savedPortfolio });
		const { wrapper } = await mountSimulator();
		holdAutoSave();

		await recordInput(wrapper, "rate").setValue("");
		await waitForAutoSave();

		expect(saved).toEqual([]);
		expect(wrapper.text()).toContain("You have unsaved changes");
	});

	it("saves the real portfolio while the what-if investment is invalid", async () => {
		const { saved } = fakeAppApi({ portfolio: savedPortfolio });
		const { wrapper } = await mountSimulator();
		holdAutoSave();
		await click(wrapper, "Add by hand");
		const trialCard = wrapper
			.findAll("article")
			.find((article) => article.text().includes("New investment"));

		await trialCard?.get('input[type="number"]').setValue("");
		await recordInput(wrapper, "monthly").setValue("100");
		await waitForAutoSave();

		expect(saved).toHaveLength(1);
		expect(JSON.stringify(saved[0])).not.toContain("New investment");
	});

	it("keeps the last results on the page while a rate is retyped", async () => {
		fakeAppApi({ portfolio: savedPortfolio });
		const { wrapper } = await mountSimulator();
		await recordInput(wrapper, "rate").setValue("10");

		await recordInput(wrapper, "rate").setValue("");

		expect(wrapper.text()).toContain(
			"The return has to be a number above -100%.",
		);
		expect(wrapper.text()).toContain("€2,593.74");
	});

	it("shows the new results once the rate is typed again", async () => {
		fakeAppApi({ portfolio: savedPortfolio });
		const { wrapper } = await mountSimulator();
		await recordInput(wrapper, "rate").setValue("");

		await recordInput(wrapper, "rate").setValue("10");

		expect(wrapper.find('[role="alert"]').exists()).toBe(false);
		expect(wrapper.text()).toContain("€2,593.74");
	});

	it("shows a clear error and saves again on retry", async () => {
		const { fetchMock, saved } = fakeAppApi({ portfolio: savedPortfolio });
		const { wrapper } = await mountSimulator();
		holdAutoSave();
		fetchMock.mockImplementationOnce(async () => jsonResponse({}, 500));

		await click(wrapper, "30 years");
		await waitForAutoSave();
		expect(wrapper.text()).toContain(
			"Could not save your portfolio. Try again.",
		);

		await click(wrapper, "Try again");

		expect(saved).toHaveLength(1);
		expect(saved[0]).toMatchObject({ portfolio: { years: 30 } });
		expect(wrapper.text()).toContain("Settings saved.");
	});

	it("says the settings are saved in Portuguese", async () => {
		fakeAppApi({ portfolio: savedPortfolio });
		const { wrapper } = await mountSimulator("pt-PT");
		holdAutoSave();

		await recordInput(wrapper, "monthly").setValue("100");
		await waitForAutoSave();

		expect(wrapper.text()).toContain("Definições guardadas.");
	});

	it("saves a pending change when leaving, without asking", async () => {
		const { saved } = fakeAppApi({ portfolio: savedPortfolio });
		const { wrapper, router } = await mountSimulator("en", RoutedPage);
		holdAutoSave();

		await click(wrapper, "30 years");
		await router.push("/dashboard");
		await flushPromises();

		expect(saved).toHaveLength(1);
		expect(saved[0]).toMatchObject({ portfolio: { years: 30 } });
		expect(router.currentRoute.value.path).toBe("/dashboard");
	});

	it("leaves straight away when there is nothing to save", async () => {
		fakeAppApi({ portfolio: savedPortfolio });
		const { wrapper, router } = await mountSimulator("en", RoutedPage);

		await router.push("/dashboard");
		await flushPromises();

		expect(router.currentRoute.value.path).toBe("/dashboard");
		expect(wrapper.text()).not.toContain("Leave without saving?");
	});

	it("stays on the page when leaving with an invalid value is cancelled", async () => {
		fakeAppApi({ portfolio: savedPortfolio });
		const { wrapper, router } = await mountSimulator("en", RoutedPage);
		await recordInput(wrapper, "rate").setValue("");

		const leaving = router.push("/dashboard");
		await flushPromises();
		expect(wrapper.text()).toContain("Leave without saving?");
		await answerConfirmDialog(wrapper, "cancel");
		await leaving;

		expect(router.currentRoute.value.path).toBe("/simulator");
	});

	it("leaves without saving an invalid value once the user confirms", async () => {
		const { saved } = fakeAppApi({ portfolio: savedPortfolio });
		const { wrapper, router } = await mountSimulator("en", RoutedPage);
		await recordInput(wrapper, "rate").setValue("");

		const leaving = router.push("/dashboard");
		await flushPromises();
		await answerConfirmDialog(wrapper, "confirm");
		await leaving;

		expect(router.currentRoute.value.path).toBe("/dashboard");
		expect(saved).toHaveLength(0);
	});

	it("projects again over the period the user picks", async () => {
		fakeAppApi({
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
		fakeAppApi({ portfolio: savedPortfolio });
		const { wrapper } = await mountSimulator();

		await click(wrapper, "Show table");

		expect(wrapper.findAll("tbody tr")).toHaveLength(11);
		expect(
			buttonWithText(wrapper, "Hide table").attributes("aria-expanded"),
		).toBe("true");
	});

	it("speaks Portuguese and formats euros the Portuguese way", async () => {
		fakeAppApi({ portfolio: savedPortfolio });
		const { wrapper } = await mountSimulator("pt-PT");

		expect(wrapper.text()).toContain("Projeta o teu investimento.");
		expect(wrapper.text()).toContain("Daqui a 10 anos");
		expect(wrapper.text()).toMatch(/1000,00\s€/);
	});
});
