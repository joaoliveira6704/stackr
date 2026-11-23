import {
	type DOMWrapper,
	enableAutoUnmount,
	flushPromises,
	type VueWrapper,
} from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { dateKey } from "../lib/budget";
import { AUTO_SAVE_DELAY_MS } from "../lib/use-saved-plan";
import {
	chartBody,
	demoUser,
	fakeAppApi,
	jsonResponse,
	quoteBody,
	searchBody,
	storeSessionFor,
} from "../test/fake-api";
import { answerConfirmDialog, mountAt } from "../test/mount";
import RegisterView from "./RegisterView.vue";

const STEADY_GROWTH = { 2019: 8, 2020: 8, 2021: 8, 2022: 8, 2023: 8 };
const today = dateKey(new Date());

const savedPortfolio = {
	years: 10,
	inflationPercent: 2,
	holdings: [
		{
			id: "h1",
			symbol: null,
			name: "Index fund",
			kind: null,
			initial: 1000,
			monthly: 50,
			annualReturnPercent: 5,
			deposits: [],
			returnSource: "manual",
			yearlyReturns: [],
			historyYears: 0,
		},
	],
	savings: [
		{
			id: "s1",
			name: "Retirement",
			type: "ppr",
			interest: "compoundMonthly",
			initial: 2000.5,
			monthly: 75.25,
			annualReturnPercent: 3,
			deposits: [{ id: "d1", amount: 120.25, date: today }],
		},
	],
};

// A page left mounted would auto save into the fake API of the next test.
enableAutoUnmount(afterEach);

beforeEach(() => {
	storeSessionFor(demoUser);
});

afterEach(() => {
	localStorage.clear();
	vi.unstubAllGlobals();
	vi.useRealTimers();
});

async function mountRegister(locale: "en" | "pt-PT" = "en") {
	const mounted = await mountAt("/register", RegisterView, locale);
	await flushPromises();
	return mounted;
}

async function click(wrapper: VueWrapper, text: string) {
	const button = wrapper
		.findAll("button")
		.find((candidate) => candidate.text().includes(text));
	if (!button) throw new Error(`No button with the text "${text}"`);
	await button.trigger("click");
	await flushPromises();
}

async function finishAutoSave() {
	await vi.advanceTimersByTimeAsync(AUTO_SAVE_DELAY_MS);
	await flushPromises();
}

async function submitDialog(
	wrapper: VueWrapper,
	amount: string,
	name?: string,
) {
	const dialog = wrapper.get('[role="dialog"]');
	if (name) await dialog.get('input[type="text"]').setValue(name);
	// The amount is always the last number in the dialog.
	await dialog.findAll('input[type="number"]').at(-1)?.setValue(amount);
	await dialog.get("form").trigger("submit");
	await flushPromises();
}

// The statistics are articles too, and only a record has a form.
function recordCards(wrapper: VueWrapper) {
	return wrapper
		.findAll("article")
		.filter((article) => article.find("form").exists());
}

async function pickOption(
	dialog: Pick<DOMWrapper<Element>, "findAll">,
	label: string,
) {
	const button = dialog
		.findAll("button[aria-pressed]")
		.find((candidate) => candidate.text() === label);
	if (!button) throw new Error(`No option with the text "${label}"`);
	await button.trigger("click");
}

async function submitPurchase(
	wrapper: VueWrapper,
	amount: string,
	shares: string,
) {
	const dialog = wrapper.get('[role="dialog"]');
	const [amountField, sharesField] = dialog.findAll('input[type="number"]');
	await amountField.setValue(amount);
	await sharesField.setValue(shares);
	await dialog.get("form").trigger("submit");
	await flushPromises();
}

async function addToCard(wrapper: VueWrapper, index: number, amount: string) {
	const card = recordCards(wrapper)[index];
	await card.get('input[type="number"]').setValue(amount);
	await card.get("form").trigger("submit");
	await flushPromises();
}

describe("RegisterView", () => {
	it("invites the user to record a first investment and saving", async () => {
		fakeAppApi();
		const { wrapper } = await mountRegister();

		expect(wrapper.text()).toContain("You have no investments yet.");
		expect(wrapper.text()).toContain("You have no savings recorded yet.");
	});

	it("adds up what is recorded and what was added this month", async () => {
		fakeAppApi({ portfolio: savedPortfolio });
		const { wrapper } = await mountRegister();

		expect(wrapper.text()).toContain("Recorded value€3,000.50");
		expect(wrapper.text()).toContain("Added this month€120.25");
	});

	it("explains a failed load and loads again on retry", async () => {
		const { fetchMock } = fakeAppApi();
		fetchMock.mockImplementationOnce(async () => jsonResponse({}, 500));
		const { wrapper } = await mountRegister();

		expect(wrapper.text()).toContain("Could not load your portfolio.");

		await click(wrapper, "Try again");

		expect(wrapper.text()).toContain("You have no investments yet.");
	});

	it("asks how much the user already has before recording a ticker", async () => {
		fakeAppApi({ charts: { "VWCE.DE": chartBody("VWCE.DE", STEADY_GROWTH) } });
		const { wrapper } = await mountRegister();

		await click(wrapper, "Vanguard FTSE All-World");
		expect(recordCards(wrapper)).toHaveLength(0);
		await submitPurchase(wrapper, "750", "5");

		expect(recordCards(wrapper)[0].text()).toContain("€750.00");
	});

	it("still records a ticker when the market is down", async () => {
		fakeAppApi({ marketDown: true });
		const { wrapper } = await mountRegister();

		await click(wrapper, "Bitcoin");
		await submitPurchase(wrapper, "100", "0.001");

		expect(wrapper.text()).toContain(
			"We could not fetch the history of Bitcoin. Set its return in the simulator.",
		);
	});

	it("finds a ticker by searching and records the one picked", async () => {
		vi.useFakeTimers();
		fakeAppApi({
			search: searchBody([
				{ symbol: "AAPL", longname: "Apple Inc.", quoteType: "EQUITY" },
			]),
			charts: { AAPL: chartBody("AAPL", STEADY_GROWTH, "Apple Inc.") },
		});
		const { wrapper } = await mountRegister();

		await wrapper.get('input[type="search"]').setValue("apple");
		await vi.advanceTimersByTimeAsync(400);
		await flushPromises();
		await click(wrapper, "Apple Inc.");
		await submitPurchase(wrapper, "500", "2");

		expect(recordCards(wrapper).map((card) => card.get("h3").text())).toEqual([
			"Apple Inc.",
		]);
	});

	it("records a saving with its type, interest and starting amount", async () => {
		vi.useFakeTimers();
		const { saved } = fakeAppApi();
		const { wrapper } = await mountRegister();

		await click(wrapper, "New saving");
		const newDialog = wrapper.get('[role="dialog"]');
		await newDialog.get("select").setValue("savingsCertificates");
		await pickOption(newDialog, "Compounded quarterly");
		await submitDialog(wrapper, "3000", "Certificates");
		await finishAutoSave();

		expect(saved.at(-1)).toMatchObject({
			portfolio: {
				savings: [
					{
						name: "Certificates",
						type: "savingsCertificates",
						interest: "compoundQuarterly",
						initial: 3000,
						monthly: 0,
					},
				],
			},
		});
	});

	it("keeps the dialog open and explains a missing amount", async () => {
		fakeAppApi();
		const { wrapper } = await mountRegister();

		await click(wrapper, "New saving");
		await submitDialog(wrapper, "", "Certificates");

		expect(wrapper.find('[role="dialog"]').exists()).toBe(true);
		expect(wrapper.text()).toContain("Say how much you already have");
	});

	it("keeps the dialog open and explains a missing name", async () => {
		fakeAppApi();
		const { wrapper } = await mountRegister();

		await click(wrapper, "New saving");
		await submitDialog(wrapper, "100");

		expect(wrapper.text()).toContain("Give this record a name.");
	});

	it("offers every type of saving", async () => {
		fakeAppApi();
		const { wrapper } = await mountRegister();
		await click(wrapper, "New saving");

		const options = wrapper
			.get('[role="dialog"]')
			.findAll("select")[0]
			.findAll("option")
			.map((option) => option.text());

		expect(options).toEqual([
			"Savings account",
			"Term deposit",
			"Savings Certificates",
			"Treasury Certificates",
			"Bonds",
			"Retirement savings plan (PPR)",
			"Pension fund",
			"Other",
		]);
	});

	it("offers no return or monthly field on a record", async () => {
		fakeAppApi({ portfolio: savedPortfolio });
		const { wrapper } = await mountRegister();

		for (const card of recordCards(wrapper)) {
			expect(card.findAll('input[type="number"]')).toHaveLength(1);
			expect(card.text()).not.toContain("Per month");
			expect(card.text()).not.toContain("Return per year");
		}
	});

	it("adds an amount to the investment and to the portfolio total", async () => {
		fakeAppApi({ portfolio: savedPortfolio });
		const { wrapper } = await mountRegister();

		await addToCard(wrapper, 0, "250.50");

		expect(recordCards(wrapper)[0].text()).toContain("€1,250.50");
		expect(wrapper.text()).toContain("Recorded value€3,251.00");
		expect(wrapper.text()).toContain("Added this month€370.75");
	});

	it("adds an amount to the saving and updates its statistics", async () => {
		fakeAppApi({ portfolio: savedPortfolio });
		const { wrapper } = await mountRegister();

		await addToCard(wrapper, 1, "100");

		expect(recordCards(wrapper)[1].text()).toContain("€2,100.50");
		expect(wrapper.text()).toContain("In 2 additions");
	});

	it("saves an added amount by itself", async () => {
		vi.useFakeTimers();
		const { saved } = fakeAppApi({ portfolio: savedPortfolio });
		const { wrapper } = await mountRegister();

		await addToCard(wrapper, 0, "100");
		expect(saved).toHaveLength(0);
		await finishAutoSave();

		expect(saved).toHaveLength(1);
		expect(wrapper.text()).toContain("Register saved.");
	});

	it.each(["0", "-5", ""])("refuses to add the amount '%s'", async (amount) => {
		const { saved } = fakeAppApi({ portfolio: savedPortfolio });
		const { wrapper } = await mountRegister();

		await addToCard(wrapper, 0, amount);

		expect(wrapper.text()).toContain(
			"The amount to add has to be more than zero.",
		);
		expect(recordCards(wrapper)[0].text()).toContain("€1,000.00");
		expect(saved).toHaveLength(0);
	});

	it("adds through a round button that only shows a plus", async () => {
		fakeAppApi({ portfolio: savedPortfolio });
		const { wrapper } = await mountRegister();

		const button = recordCards(wrapper)[0].get('form button[type="submit"]');

		expect(button.classes()).toContain("btn-icon");
		expect(button.text()).toBe("");
		expect(button.attributes("aria-label")).toBe("Add to Index fund");
		expect(recordCards(wrapper)[0].text()).toContain("Amount invested");
	});

	it("gives a card a nametag and an icon, and saves them", async () => {
		vi.useFakeTimers();
		const { saved } = fakeAppApi({ portfolio: savedPortfolio });
		const { wrapper } = await mountRegister();

		await wrapper.get('button[aria-label="Edit Index fund"]').trigger("click");
		const dialog = wrapper.get('[role="dialog"]');
		await dialog.get('input[type="text"]').setValue("My house");
		await dialog.get('button[aria-label="Home"]').trigger("click");
		await dialog.get("form").trigger("submit");
		await finishAutoSave();

		expect(recordCards(wrapper)[0].get("h3").text()).toBe("My house");
		expect(recordCards(wrapper)[0].text()).toContain("Index fund");
		expect(saved.at(-1)).toMatchObject({
			portfolio: {
				holdings: [{ name: "Index fund", nametag: "My house", icon: "home" }],
			},
		});
	});

	it("goes back to the real name when the nametag is deleted", async () => {
		const tagged = {
			...savedPortfolio,
			holdings: [{ ...savedPortfolio.holdings[0], nametag: "My house" }],
		};
		fakeAppApi({ portfolio: tagged });
		const { wrapper } = await mountRegister();

		await wrapper.get('button[aria-label="Edit My house"]').trigger("click");
		const dialog = wrapper.get('[role="dialog"]');
		await dialog.get('input[type="text"]').setValue("");
		await dialog.get("form").trigger("submit");
		await flushPromises();

		expect(recordCards(wrapper)[0].get("h3").text()).toBe("Index fund");
	});

	it("changes nothing when the edit is cancelled", async () => {
		fakeAppApi({ portfolio: savedPortfolio });
		const { wrapper } = await mountRegister();

		await wrapper.get('button[aria-label="Edit Index fund"]').trigger("click");
		const dialog = wrapper.get('[role="dialog"]');
		await dialog.get('input[type="text"]').setValue("Changed");
		await click(wrapper, "Cancel");

		expect(recordCards(wrapper)[0].get("h3").text()).toBe("Index fund");
	});

	it("edits the interest, rate type and rate evolution of a saving", async () => {
		vi.useFakeTimers();
		const { saved } = fakeAppApi({ portfolio: savedPortfolio });
		const { wrapper } = await mountRegister();

		await wrapper.get('button[aria-label="Edit Retirement"]').trigger("click");
		const dialog = wrapper.get('[role="dialog"]');
		await pickOption(dialog, "Simple interest");
		await pickOption(dialog, "TAE / APY (effective)");
		await pickOption(dialog, "Rising");
		await dialog.get("form").trigger("submit");
		await finishAutoSave();

		expect(saved.at(-1)).toMatchObject({
			portfolio: {
				savings: [
					{ interest: "simple", rateBasis: "tae", ratePath: "stepped" },
				],
			},
		});
		expect(recordCards(wrapper)[1].text()).toContain("Simple interest");
		expect(recordCards(wrapper)[1].text()).toContain("TAE");
		expect(recordCards(wrapper)[1].text()).toContain("Rising");
	});

	it("asks for the rate type and evolution when creating a saving", async () => {
		vi.useFakeTimers();
		const { saved } = fakeAppApi();
		const { wrapper } = await mountRegister();

		await click(wrapper, "New saving");
		const newDialog = wrapper.get('[role="dialog"]');
		await pickOption(newDialog, "TANL (net)");
		await pickOption(newDialog, "Variable or indexed");
		await submitDialog(wrapper, "100", "Certificates");
		await finishAutoSave();

		expect(saved.at(-1)).toMatchObject({
			portfolio: { savings: [{ rateBasis: "tanl", ratePath: "variable" }] },
		});
	});

	it("grows the card with the interest earned since the start date", async () => {
		const lastYear = `${Number(today.slice(0, 4)) - 1}${today.slice(4)}`;
		fakeAppApi({
			portfolio: {
				...savedPortfolio,
				holdings: [],
				savings: [
					{
						...savedPortfolio.savings[0],
						interest: "simple",
						rateBasis: "tanl",
						initial: 1000,
						deposits: [],
						contractRatePercent: 10,
						startDate: lastYear,
					},
				],
			},
		});
		const { wrapper } = await mountRegister();

		const card = recordCards(wrapper)[0];

		expect(card.text()).toMatch(/Current value€1,10\d\.\d\d/);
		expect(card.text()).toContain("€1,000.00 deposited +");
		expect(wrapper.text()).toContain("Interest so far");
	});

	it("asks for a start date on a saving that has none", async () => {
		fakeAppApi({ portfolio: savedPortfolio });
		const { wrapper } = await mountRegister();

		expect(recordCards(wrapper)[1].text()).toContain(
			"Set the start date to count interest",
		);
		expect(recordCards(wrapper)[1].text()).toContain("€2,000.50");
	});

	it("records the real rate and start date of a new saving", async () => {
		vi.useFakeTimers();
		const { saved } = fakeAppApi();
		const { wrapper } = await mountRegister();

		await click(wrapper, "New saving");
		const dialog = wrapper.get('[role="dialog"]');
		await dialog.findAll('input[type="number"]')[0].setValue("3.5");
		await dialog.get('input[type="date"]').setValue("2025-01-15");
		await submitDialog(wrapper, "1000", "Certificates");
		await finishAutoSave();

		expect(saved.at(-1)).toMatchObject({
			portfolio: {
				savings: [
					{
						contractRatePercent: 3.5,
						annualReturnPercent: 3.5,
						startDate: "2025-01-15",
						initial: 1000,
					},
				],
			},
		});
	});

	it("refuses a start date in the future", async () => {
		fakeAppApi();
		const { wrapper } = await mountRegister();

		await click(wrapper, "New saving");
		await wrapper
			.get('[role="dialog"] input[type="date"]')
			.setValue("2999-01-01");
		await submitDialog(wrapper, "100", "Certificates");

		expect(wrapper.text()).toContain("The start date cannot be in the future.");
		expect(recordCards(wrapper)).toHaveLength(0);
	});

	it("asks for the extra values of a rising and a mixed rate", async () => {
		fakeAppApi();
		const { wrapper } = await mountRegister();
		await click(wrapper, "New saving");
		const dialog = wrapper.get('[role="dialog"]');

		await pickOption(dialog, "Rising");
		expect(dialog.text()).toContain("Rises each year");

		await pickOption(dialog, "Mixed");
		expect(dialog.text()).toContain("Years at the first rate");
		expect(dialog.text()).toContain("Rate after that");
	});

	const trackedPortfolio = {
		...savedPortfolio,
		savings: [],
		holdings: [
			{
				...savedPortfolio.holdings[0],
				id: "h2",
				symbol: "VWCE.DE",
				name: "Vanguard",
				kind: "etf",
				initial: 500,
				shares: 4,
			},
		],
	};

	it("follows the market price and shows the gain", async () => {
		fakeAppApi({
			portfolio: trackedPortfolio,
			charts: { "VWCE.DE": quoteBody("VWCE.DE", 140) },
		});
		const { wrapper } = await mountRegister();
		await flushPromises();

		const card = recordCards(wrapper)[0];

		expect(card.text()).toContain("Current value€560.00");
		expect(card.text()).toContain("€500.00 invested · 4 shares");
		expect(card.text()).toContain("+€60.00 (+12%)");
		expect(card.text()).toContain("Estimated value · price from");
		expect(wrapper.text()).toContain("Your investment portfolio");
	});

	it("says when there is no market price", async () => {
		fakeAppApi({ portfolio: trackedPortfolio, marketDown: true });
		const { wrapper } = await mountRegister();
		await flushPromises();

		expect(recordCards(wrapper)[0].text()).toContain(
			"No market price, showing the amount invested",
		);
		expect(recordCards(wrapper)[0].text()).toContain("€500.00");
	});

	it("requires the shares when buying more of a ticker", async () => {
		const { saved } = fakeAppApi({
			portfolio: trackedPortfolio,
			marketDown: true,
		});
		const { wrapper } = await mountRegister();
		await flushPromises();

		await addToCard(wrapper, 0, "100");

		expect(wrapper.text()).toContain("Say how many shares you bought");
		expect(recordCards(wrapper)[0].text()).toContain("€500.00 invested");
		expect(saved).toHaveLength(0);
	});

	it("adds the amount and shares of a new purchase", async () => {
		fakeAppApi({ portfolio: trackedPortfolio, marketDown: true });
		const { wrapper } = await mountRegister();
		await flushPromises();
		const card = recordCards(wrapper)[0];
		const [amount, shares] = card.findAll('input[type="number"]');

		await amount.setValue("100");
		await shares.setValue("0.75");
		await card.get("form").trigger("submit");
		await flushPromises();

		expect(recordCards(wrapper)[0].text()).toContain(
			"€600.00 invested · 4.75 shares",
		);
	});

	it("refuses a new ticker without its shares", async () => {
		fakeAppApi({ marketDown: true });
		const { wrapper } = await mountRegister();

		await click(wrapper, "Bitcoin");
		await submitPurchase(wrapper, "100", "");

		expect(wrapper.find('[role="dialog"]').exists()).toBe(true);
		expect(wrapper.text()).toContain("Say how many shares you bought");
		expect(recordCards(wrapper)).toHaveLength(0);
	});

	it("asks an older ticker for its shares before it can buy more", async () => {
		const older = {
			...trackedPortfolio,
			holdings: [{ ...trackedPortfolio.holdings[0], shares: 0 }],
		};
		fakeAppApi({ portfolio: older, marketDown: true });
		const { wrapper } = await mountRegister();
		await flushPromises();

		const card = recordCards(wrapper);

		expect(wrapper.text()).toContain(
			"Say how many shares you hold to track the value",
		);
		expect(card).toHaveLength(0);
	});

	it("offers APY as the same option as TAE", async () => {
		fakeAppApi();
		const { wrapper } = await mountRegister();
		await click(wrapper, "New saving");

		const dialog = wrapper.get('[role="dialog"]');
		await pickOption(dialog, "TAE / APY (effective)");

		const apy = dialog
			.findAll("button[aria-pressed]")
			.find((button) => button.text() === "TAE / APY (effective)");

		expect(apy?.attributes("aria-pressed")).toBe("true");
		expect(dialog.text()).toContain("TAE / APY per year");
	});

	it("records the start date of a new investment and shows it", async () => {
		vi.useFakeTimers();
		const { saved } = fakeAppApi({ marketDown: true });
		const { wrapper } = await mountRegister();

		await click(wrapper, "Bitcoin");
		await wrapper
			.get('[role="dialog"] input[type="date"]')
			.setValue("2025-03-10");
		await submitPurchase(wrapper, "100", "0.001");
		await finishAutoSave();

		expect(recordCards(wrapper)[0].text()).toContain("Since Mar 10, 2025");
		expect(saved.at(-1)).toMatchObject({
			portfolio: { holdings: [{ startDate: "2025-03-10" }] },
		});
	});

	it("refuses a new investment with the start date cleared", async () => {
		fakeAppApi({ marketDown: true });
		const { wrapper } = await mountRegister();

		await click(wrapper, "Bitcoin");
		await wrapper.get('[role="dialog"] input[type="date"]').setValue("");
		await submitPurchase(wrapper, "100", "0.001");

		expect(wrapper.text()).toContain(
			"Say the day you started this investment.",
		);
		expect(recordCards(wrapper)).toHaveLength(0);
	});

	it("asks an older investment for its start date", async () => {
		fakeAppApi({ portfolio: trackedPortfolio, marketDown: true });
		const { wrapper } = await mountRegister();
		await flushPromises();

		expect(recordCards(wrapper)[0].text()).toContain("Set the start date");
	});

	it("logs a purchase with its date, shares and real price", async () => {
		fakeAppApi({ portfolio: trackedPortfolio, marketDown: true });
		const { wrapper } = await mountRegister();
		await flushPromises();
		const card = recordCards(wrapper)[0];
		const [amount, shares] = card.findAll('input[type="number"]');

		await amount.setValue("100");
		await shares.setValue("0.8");
		await card.get("form").trigger("submit");
		await flushPromises();
		await click(wrapper, "Show history (2)");

		const lines = recordCards(wrapper)[0].findAll("li");
		expect(lines).toHaveLength(2);
		expect(lines[0].text()).toContain("Purchase");
		expect(lines[0].text()).toContain("0.8 shares at €125.00");
		expect(lines[0].text()).toContain("€100.00");
		expect(lines[1].text()).toContain("Start");
		expect(lines[1].text()).toContain("€500.00");
	});

	it("logs a deposit on a saving", async () => {
		fakeAppApi({ portfolio: savedPortfolio });
		const { wrapper } = await mountRegister();

		await addToCard(wrapper, 1, "40");
		await click(wrapper, "Show history (3)");

		const lines = recordCards(wrapper)[1].findAll("li");
		expect(lines[0].text()).toContain("Deposit");
		expect(lines[0].text()).toContain("€40.00");
	});

	it("keeps the history closed until it is asked for", async () => {
		fakeAppApi({ portfolio: savedPortfolio });
		const { wrapper } = await mountRegister();

		expect(recordCards(wrapper)[0].find("li").exists()).toBe(false);
	});

	it("names the history in Portuguese", async () => {
		fakeAppApi({ portfolio: savedPortfolio });
		const { wrapper } = await mountRegister("pt-PT");

		expect(wrapper.text()).toContain("Ver histórico");
		expect(wrapper.text()).toContain("Define a data de início");
	});

	it("shows real statistics about the savings", async () => {
		fakeAppApi({ portfolio: savedPortfolio });
		const { wrapper } = await mountRegister();

		expect(wrapper.text()).toContain("Savings statistics");
		expect(wrapper.text()).toContain("Total saved");
		expect(wrapper.text()).toContain("Added since the start");
		expect(wrapper.text()).toContain("In one addition");
		expect(wrapper.text()).toContain("By type of saving");
		expect(wrapper.text()).not.toContain("Interest in 12 months");
	});

	it("shows the savings cards above their statistics", async () => {
		fakeAppApi({ portfolio: savedPortfolio });
		const { wrapper } = await mountRegister();
		const text = wrapper.text();

		expect(text.indexOf("Retirement")).toBeLessThan(
			text.indexOf("Savings statistics"),
		);
	});

	it("hides the statistics without savings", async () => {
		fakeAppApi();
		const { wrapper } = await mountRegister();

		expect(wrapper.text()).not.toContain("Savings statistics");
	});

	it("offers a retry when saving fails", async () => {
		vi.useFakeTimers();
		fakeAppApi({ portfolio: savedPortfolio, saveFails: true });
		const { wrapper } = await mountRegister();

		await addToCard(wrapper, 0, "100");
		await finishAutoSave();

		expect(wrapper.text()).toContain(
			"Could not save your portfolio. Try again.",
		);
	});

	it("keeps a holding until its removal is confirmed", async () => {
		fakeAppApi({ portfolio: savedPortfolio });
		const { wrapper } = await mountRegister();
		const remove = 'button[aria-label="Remove Index fund"]';

		await wrapper.get(remove).trigger("click");
		await flushPromises();
		expect(wrapper.find(remove).exists()).toBe(true);
		await answerConfirmDialog(wrapper, "cancel");
		expect(wrapper.find(remove).exists()).toBe(true);

		await wrapper.get(remove).trigger("click");
		await flushPromises();
		await answerConfirmDialog(wrapper, "confirm");
		expect(wrapper.find(remove).exists()).toBe(false);
	});

	it("keeps a saving until its removal is confirmed", async () => {
		fakeAppApi({ portfolio: savedPortfolio });
		const { wrapper } = await mountRegister();
		const remove = 'button[aria-label="Remove Retirement"]';

		await wrapper.get(remove).trigger("click");
		await flushPromises();
		expect(wrapper.text()).toContain("Remove Retirement?");
		await answerConfirmDialog(wrapper, "cancel");
		expect(wrapper.find(remove).exists()).toBe(true);

		await wrapper.get(remove).trigger("click");
		await flushPromises();
		await answerConfirmDialog(wrapper, "confirm");
		expect(wrapper.find(remove).exists()).toBe(false);
	});

	it("speaks Portuguese on the cards and in the statistics", async () => {
		fakeAppApi({ portfolio: savedPortfolio });
		const { wrapper } = await mountRegister("pt-PT");

		expect(wrapper.text()).toContain("Regista o teu dinheiro.");
		expect(wrapper.text()).toContain("Valor investido");
		expect(wrapper.text()).toContain("Composto mensal");
		expect(wrapper.text()).toContain("Adicionado desde o início");
		expect(wrapper.text()).toContain("Juros até hoje");
		expect(wrapper.text()).toContain("A tua carteira de investimentos");
		expect(wrapper.text()).toContain(
			"Define a data de início para contar juros",
		);
	});
});
