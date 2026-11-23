import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../lib/errors";
import {
	defaultSavingsTerms,
	MAX_HOLDINGS,
	MAX_SAVINGS,
} from "../lib/portfolio";
import {
	chartBody,
	demoUser,
	fakeAppApi,
	quoteBody,
	storeSessionFor,
} from "../test/fake-api";
import { usePortfolioStore } from "./portfolio";

const VANGUARD = { symbol: "VWCE.DE", name: "Vanguard", kind: "etf" } as const;
const STEADY_GROWTH = { 2019: 8, 2020: 8, 2021: 8, 2022: 8, 2023: 8 };

beforeEach(() => {
	setActivePinia(createPinia());
	storeSessionFor(demoUser);
});

afterEach(() => {
	localStorage.clear();
	vi.unstubAllGlobals();
});

describe("portfolio store", () => {
	it("has nothing to save right after loading", async () => {
		fakeAppApi();
		const store = usePortfolioStore();

		await store.load();

		expect(store.hasUnsavedChanges).toBe(false);
	});

	it("notices any change and forgets it once saved", async () => {
		fakeAppApi();
		const store = usePortfolioStore();
		await store.load();

		store.portfolio.years = 30;
		expect(store.hasUnsavedChanges).toBe(true);

		await store.save();
		expect(store.hasUnsavedChanges).toBe(false);
	});

	it("keeps the changes marked as unsaved when saving fails", async () => {
		fakeAppApi({ saveFails: true });
		const store = usePortfolioStore();
		store.portfolio.years = 30;

		await expect(store.save()).rejects.toThrow(
			new AppError("portfolioNotSaved"),
		);
		expect(store.hasUnsavedChanges).toBe(true);
	});

	it("uses the past growth of a ticker as its expected return", async () => {
		fakeAppApi({
			charts: { "VWCE.DE": chartBody("VWCE.DE", STEADY_GROWTH) },
		});
		const store = usePortfolioStore();

		const holding = await store.addTicker(VANGUARD, 100, 2);

		expect(holding.annualReturnPercent).toBe(8);
		expect(holding.returnSource).toBe("history");
		expect(holding.yearlyReturns.map((entry) => entry.year)).toEqual([
			2020, 2021, 2022, 2023,
		]);
		expect(store.portfolio.holdings).toHaveLength(1);
	});

	it("still adds the ticker with a typed return when the market is down", async () => {
		fakeAppApi({ marketDown: true });
		const store = usePortfolioStore();

		const holding = await store.addTicker(VANGUARD, 100, 2);

		expect(holding.symbol).toBe("VWCE.DE");
		expect(holding.returnSource).toBe("manual");
		expect(holding.yearlyReturns).toEqual([]);
	});

	it("refuses the same ticker twice", async () => {
		fakeAppApi({ marketDown: true });
		const store = usePortfolioStore();
		await store.addTicker(VANGUARD, 100, 2);

		await expect(store.addTicker(VANGUARD, 100, 2)).rejects.toThrow(
			new AppError("holdingExists"),
		);
	});

	it("holds up to ten investments", () => {
		fakeAppApi();
		const store = usePortfolioStore();
		for (let index = 0; index < 10; index++) {
			store.addManual(`Investment ${index}`);
		}

		expect(store.portfolio.holdings).toHaveLength(10);
		expect(store.isFull).toBe(true);
	});

	it("refuses a new holding once the portfolio is full", () => {
		fakeAppApi();
		const store = usePortfolioStore();
		for (let index = 0; index < MAX_HOLDINGS; index++) {
			store.addManual(`Investment ${index}`);
		}

		expect(store.isFull).toBe(true);
		expect(() => store.addManual("One too many")).toThrow(
			new AppError("tooManyHoldings"),
		);
	});

	it("removes only the chosen holding", () => {
		fakeAppApi();
		const store = usePortfolioStore();
		const first = store.addManual("First");
		store.addManual("Second");

		store.removeHolding(first.id);

		expect(store.portfolio.holdings.map((holding) => holding.name)).toEqual([
			"Second",
		]);
	});
});

describe("portfolio store savings", () => {
	it("records a saving with a cautious default rate", () => {
		fakeAppApi();
		const store = usePortfolioStore();

		const entry = store.addSavings("Emergency fund");

		expect(entry).toMatchObject({
			name: "Emergency fund",
			type: "savingsAccount",
			interest: "compoundYearly",
			annualReturnPercent: 2,
		});
	});

	it("refuses a new saving once the list is full", () => {
		fakeAppApi();
		const store = usePortfolioStore();
		for (let index = 0; index < MAX_SAVINGS; index++) {
			store.addSavings(`Saving ${index}`);
		}

		expect(store.isSavingsFull).toBe(true);
		expect(() => store.addSavings("One too many")).toThrow(
			new AppError("tooManySavings"),
		);
	});

	it("removes only the chosen saving", () => {
		fakeAppApi();
		const store = usePortfolioStore();
		const first = store.addSavings("First");
		store.addSavings("Second");

		store.removeSavings(first.id);

		expect(store.portfolio.savings.map((entry) => entry.name)).toEqual([
			"Second",
		]);
	});

	it("keeps an edit made during a save marked as unsaved", async () => {
		fakeAppApi();
		const store = usePortfolioStore();
		await store.load();
		const saving = store.save();

		store.portfolio.years = 33;
		await saving;

		expect(store.hasUnsavedChanges).toBe(true);
	});

	it("starts a saving with what the user already has", () => {
		fakeAppApi();
		const store = usePortfolioStore();

		const entry = store.addSavings(" PPR ", {
			type: "ppr",
			interest: "simple",
			initial: 2500.5,
		});

		expect(entry).toMatchObject({
			name: "PPR",
			type: "ppr",
			interest: "simple",
			initial: 2500.5,
			monthly: 0,
		});
	});

	it("refuses a record without a name", () => {
		fakeAppApi();
		const store = usePortfolioStore();

		expect(() => store.addManual("  ", 100)).toThrow(
			new AppError("registerNameMissing"),
		);
		expect(store.portfolio.holdings).toHaveLength(0);
	});

	it("refuses a negative starting amount", () => {
		fakeAppApi();
		const store = usePortfolioStore();

		expect(() => store.addSavings("PPR", { initial: -1 })).toThrow(
			new AppError("invalidStartingAmount"),
		);
		expect(store.portfolio.savings).toHaveLength(0);
	});

	it("adds a deposit to the right investment", () => {
		fakeAppApi();
		const store = usePortfolioStore();
		const first = store.addManual("First", 100);
		const second = store.addManual("Second", 200);

		store.addDeposit(second.id, 50, "2026-11-22");

		expect(
			store.portfolio.holdings.find(({ id }) => id === first.id)?.initial,
		).toBe(100);
		expect(
			store.portfolio.holdings.find(({ id }) => id === second.id)?.initial,
		).toBe(250);
	});

	it("adds a deposit to a saving", () => {
		fakeAppApi();
		const store = usePortfolioStore();
		const entry = store.addSavings("PPR", { initial: 100 });

		store.addDeposit(entry.id, 25, "2026-11-22");

		expect(store.portfolio.savings[0].initial).toBe(125);
		expect(store.portfolio.savings[0].deposits).toHaveLength(1);
	});

	it("refuses a deposit on a record that no longer exists", () => {
		fakeAppApi();
		const store = usePortfolioStore();

		expect(() => store.addDeposit("gone", 25, "2026-11-22")).toThrow(
			new AppError("registerEntryMissing"),
		);
	});

	it("sets and clears a nametag and an icon", () => {
		fakeAppApi();
		const store = usePortfolioStore();
		const holding = store.addManual("Vanguard", 100);

		store.updateRecord(holding.id, {
			nametag: " Reforma ",
			icon: "retirement",
		});
		expect(store.portfolio.holdings[0]).toMatchObject({
			name: "Vanguard",
			nametag: "Reforma",
			icon: "retirement",
		});

		store.updateRecord(holding.id, { nametag: "", icon: null });
		expect(store.portfolio.holdings[0]).toMatchObject({
			name: "Vanguard",
			nametag: "",
			icon: null,
		});
	});

	it("changes the rate terms of a saving and keeps its value", () => {
		fakeAppApi();
		const store = usePortfolioStore();
		const entry = store.addSavings("PPR", { initial: 100 });

		store.updateRecord(entry.id, {
			nametag: "",
			icon: null,
			terms: {
				...defaultSavingsTerms(),
				type: "bonds",
				interest: "simple",
				rateBasis: "tae",
				ratePath: "stepped",
			},
		});

		expect(store.portfolio.savings[0]).toMatchObject({
			type: "bonds",
			interest: "simple",
			rateBasis: "tae",
			ratePath: "stepped",
			initial: 100,
		});
	});

	it("refuses to edit a record that no longer exists", () => {
		fakeAppApi();
		const store = usePortfolioStore();

		expect(() =>
			store.updateRecord("gone", { nametag: "x", icon: null }),
		).toThrow(new AppError("registerEntryMissing"));
	});

	it("starts the simulation at the real rate of a new saving", () => {
		fakeAppApi();
		const store = usePortfolioStore();

		const entry = store.addSavings("PPR", { contractRatePercent: 3.5 });

		expect(entry.annualReturnPercent).toBe(3.5);
	});

	it("keeps a simulated rate when the real rate does not change", () => {
		fakeAppApi();
		const store = usePortfolioStore();
		const entry = store.addSavings("PPR", { contractRatePercent: 3 });
		store.portfolio.savings[0].annualReturnPercent = 9;

		store.updateRecord(entry.id, {
			nametag: "x",
			icon: null,
			terms: { ...defaultSavingsTerms(), contractRatePercent: 3 },
		});

		expect(store.portfolio.savings[0].annualReturnPercent).toBe(9);
	});

	it("moves the simulation to a corrected real rate", () => {
		fakeAppApi();
		const store = usePortfolioStore();
		const entry = store.addSavings("PPR", { contractRatePercent: 3 });

		store.updateRecord(entry.id, {
			nametag: "",
			icon: null,
			terms: { ...defaultSavingsTerms(), contractRatePercent: 4 },
		});

		expect(store.portfolio.savings[0].annualReturnPercent).toBe(4);
	});

	it("changes nothing when an edit has a future start date", () => {
		fakeAppApi();
		const store = usePortfolioStore();
		const entry = store.addSavings("PPR");

		expect(() =>
			store.updateRecord(entry.id, {
				nametag: "New",
				icon: null,
				terms: { ...defaultSavingsTerms(), startDate: "2999-01-01" },
			}),
		).toThrow(new AppError("invalidStartDate"));
		expect(store.portfolio.savings[0].nametag).toBe("");
	});

	it("requires the amount and the shares of a first purchase", async () => {
		fakeAppApi({ marketDown: true });
		const store = usePortfolioStore();

		await expect(store.addTicker(VANGUARD, 0, 2)).rejects.toThrow(
			new AppError("invalidInvestedAmount"),
		);
		await expect(store.addTicker(VANGUARD, 100, Number.NaN)).rejects.toThrow(
			new AppError("invalidShares"),
		);
		expect(store.portfolio.holdings).toHaveLength(0);
	});

	it("values a new ticker with its shares at the latest price", async () => {
		fakeAppApi({ charts: { "VWCE.DE": quoteBody("VWCE.DE", 140) } });
		const store = usePortfolioStore();

		const holding = await store.addTicker(VANGUARD, 500, 4);

		expect(holding).toMatchObject({ initial: 500, shares: 4 });
		expect(holding.quote?.price).toBe(140);
	});

	it("adds both the amount and the shares of a new purchase", async () => {
		fakeAppApi({ marketDown: true });
		const store = usePortfolioStore();
		const holding = await store.addTicker(VANGUARD, 100, 0.8);

		store.addDeposit(holding.id, 50, "2026-11-22", 0.39505);

		expect(store.portfolio.holdings[0]).toMatchObject({
			initial: 150,
			shares: 1.19505,
		});
	});

	it("refreshes the price of every ticker", async () => {
		const api = { charts: { "VWCE.DE": quoteBody("VWCE.DE", 100) } };
		fakeAppApi(api);
		const store = usePortfolioStore();
		await store.addTicker(VANGUARD, 100, 1);
		api.charts["VWCE.DE"] = quoteBody("VWCE.DE", 120);

		await store.refreshQuotes(() => true);

		expect(store.portfolio.holdings[0].quote?.price).toBe(120);
	});

	it("keeps the last known price when the market fails", async () => {
		const charts: Record<string, unknown> = {
			"VWCE.DE": quoteBody("VWCE.DE", 100),
		};
		fakeAppApi({ charts });
		const store = usePortfolioStore();
		await store.addTicker(VANGUARD, 100, 1);
		delete charts["VWCE.DE"];

		await store.refreshQuotes(() => true);

		expect(store.portfolio.holdings[0].quote?.price).toBe(100);
	});

	it("applies no price once the screen has gone", async () => {
		const api = { charts: { "VWCE.DE": quoteBody("VWCE.DE", 100) } };
		fakeAppApi(api);
		const store = usePortfolioStore();
		await store.addTicker(VANGUARD, 100, 1);
		api.charts["VWCE.DE"] = quoteBody("VWCE.DE", 120);

		await store.refreshQuotes(() => false);

		expect(store.portfolio.holdings[0].quote?.price).toBe(100);
	});

	it("corrects the position of a holding", async () => {
		fakeAppApi({ marketDown: true });
		const store = usePortfolioStore();
		const holding = await store.addTicker(VANGUARD, 100, 1);

		store.updateRecord(holding.id, {
			nametag: "",
			icon: null,
			position: {
				initial: 120.5,
				shares: 1.25,
				manualValue: null,
				startDate: "2025-02-01",
			},
		});

		expect(store.portfolio.holdings[0]).toMatchObject({
			initial: 120.5,
			shares: 1.25,
		});
	});

	it("changes nothing when an edited position has bad shares", async () => {
		fakeAppApi({ marketDown: true });
		const store = usePortfolioStore();
		const holding = await store.addTicker(VANGUARD, 100, 1);

		expect(() =>
			store.updateRecord(holding.id, {
				nametag: "New",
				icon: null,
				position: {
					initial: 100,
					shares: -1,
					manualValue: null,
					startDate: "",
				},
			}),
		).toThrow(new AppError("invalidShares"));
		expect(store.portfolio.holdings[0].nametag).toBe("");
	});

	it("keeps the start date of a new ticker", async () => {
		fakeAppApi({ marketDown: true });
		const store = usePortfolioStore();

		const holding = await store.addTicker(VANGUARD, 100, 1, "2025-02-01");

		expect(holding.startDate).toBe("2025-02-01");
	});

	it("refuses a new investment with no start date", async () => {
		fakeAppApi({ marketDown: true });
		const store = usePortfolioStore();

		await expect(store.addTicker(VANGUARD, 100, 1, "")).rejects.toThrow(
			new AppError("startDateMissing"),
		);
		expect(() => store.addManual("Fund", 100, "")).toThrow(
			new AppError("startDateMissing"),
		);
		expect(store.portfolio.holdings).toHaveLength(0);
	});

	it("refuses a new investment that starts in the future", () => {
		fakeAppApi();
		const store = usePortfolioStore();

		expect(() => store.addManual("Fund", 100, "2999-01-01")).toThrow(
			new AppError("invalidStartDate"),
		);
	});
});
