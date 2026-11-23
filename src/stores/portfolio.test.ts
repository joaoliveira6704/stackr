import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../lib/errors";
import { MAX_HOLDINGS } from "../lib/portfolio";
import {
	chartBody,
	demoUser,
	fakeAppApi,
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

		const holding = await store.addTicker(VANGUARD);

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

		const holding = await store.addTicker(VANGUARD);

		expect(holding.symbol).toBe("VWCE.DE");
		expect(holding.returnSource).toBe("manual");
		expect(holding.yearlyReturns).toEqual([]);
	});

	it("refuses the same ticker twice", async () => {
		fakeAppApi({ marketDown: true });
		const store = usePortfolioStore();
		await store.addTicker(VANGUARD);

		await expect(store.addTicker(VANGUARD)).rejects.toThrow(
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
