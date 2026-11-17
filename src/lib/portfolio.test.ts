import { afterEach, describe, expect, it, vi } from "vitest";
import { demoUser, fakeSimulatorApi, storeSessionFor } from "../test/fake-api";
import { AppError } from "./errors";
import {
	DEFAULT_INFLATION_PERCENT,
	DEFAULT_YEARS,
	emptyPortfolio,
	loadPortfolio,
	MAX_HOLDINGS,
	parsePortfolio,
	savePortfolio,
} from "./portfolio";

afterEach(() => {
	localStorage.clear();
	vi.unstubAllGlobals();
});

const savedHolding = {
	id: "h1",
	symbol: "VWCE.DE",
	name: "Vanguard",
	kind: "etf",
	initial: 1000,
	monthly: 100,
	annualReturnPercent: 8.2,
	returnSource: "history",
	yearlyReturns: [{ year: 2023, percent: 18.1 }],
	historyYears: 6,
};

describe("parsePortfolio", () => {
	it("starts with 20 years, 2% inflation and no holdings", () => {
		expect(parsePortfolio(undefined)).toEqual({
			years: DEFAULT_YEARS,
			inflationPercent: DEFAULT_INFLATION_PERCENT,
			holdings: [],
		});
	});

	it("reads a saved portfolio as it was", () => {
		const portfolio = {
			years: 15,
			inflationPercent: 2.5,
			holdings: [savedHolding],
		};

		expect(parsePortfolio(portfolio)).toEqual(portfolio);
	});

	it("drops holdings without an id or a name", () => {
		const portfolio = parsePortfolio({
			holdings: [savedHolding, { name: "No id" }, { id: "x" }, "junk"],
		});

		expect(portfolio.holdings.map((holding) => holding.id)).toEqual(["h1"]);
	});

	it("turns negative or missing amounts into zero", () => {
		const [holding] = parsePortfolio({
			holdings: [{ id: "a", name: "A", initial: -50, monthly: "lots" }],
		}).holdings;

		expect(holding.initial).toBe(0);
		expect(holding.monthly).toBe(0);
		expect(holding.returnSource).toBe("manual");
		expect(holding.yearlyReturns).toEqual([]);
	});

	it("falls back to the default period when the saved one is out of range", () => {
		expect(parsePortfolio({ years: 0 }).years).toBe(DEFAULT_YEARS);
		expect(parsePortfolio({ years: 99 }).years).toBe(DEFAULT_YEARS);
	});

	it("keeps no more than the maximum number of holdings", () => {
		const holdings = Array.from({ length: MAX_HOLDINGS + 3 }, (_, index) => ({
			...savedHolding,
			id: `h${index}`,
		}));

		expect(parsePortfolio({ holdings }).holdings).toHaveLength(MAX_HOLDINGS);
	});
});

describe("loadPortfolio", () => {
	it("reads the portfolio saved on the signed in user", async () => {
		storeSessionFor(demoUser);
		const { fetchMock } = fakeSimulatorApi({
			portfolio: { years: 10, inflationPercent: 3, holdings: [savedHolding] },
		});

		const portfolio = await loadPortfolio();

		expect(fetchMock).toHaveBeenCalledWith("/api/users/1", undefined);
		expect(portfolio.years).toBe(10);
		expect(portfolio.holdings[0].name).toBe("Vanguard");
	});

	it("gives an empty portfolio to a user who never saved one", async () => {
		storeSessionFor(demoUser);
		fakeSimulatorApi();

		expect(await loadPortfolio()).toEqual(emptyPortfolio());
	});

	it("needs a signed in user", async () => {
		fakeSimulatorApi();

		await expect(loadPortfolio()).rejects.toThrow(new AppError("notSignedIn"));
	});
});

describe("savePortfolio", () => {
	it("saves the portfolio on the signed in user", async () => {
		storeSessionFor(demoUser);
		const { fetchMock, saved } = fakeSimulatorApi();
		const portfolio = { ...emptyPortfolio(), years: 30 };

		await savePortfolio(portfolio);

		expect(fetchMock.mock.calls[0][0]).toBe("/api/users/1");
		expect(saved).toEqual([{ portfolio }]);
	});

	it("reports a failed save", async () => {
		storeSessionFor(demoUser);
		fakeSimulatorApi({ saveFails: true });

		await expect(savePortfolio(emptyPortfolio())).rejects.toThrow(
			new AppError("portfolioNotSaved"),
		);
	});
});
