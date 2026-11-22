import { afterEach, describe, expect, it, vi } from "vitest";
import { demoUser, fakeAppApi, storeSessionFor } from "../test/fake-api";
import { AppError } from "./errors";
import {
	applyDeposit,
	checkedPosition,
	checkedShares,
	checkedStartDate,
	checkedStartingAmount,
	checkSavingsTerms,
	currentValue,
	DEFAULT_INFLATION_PERCENT,
	DEFAULT_YEARS,
	defaultSavingsTerms,
	depositedIn,
	emptyPortfolio,
	type Holding,
	holdingValue,
	investmentStats,
	isMissingShares,
	loadPortfolio,
	MAX_HOLDINGS,
	newHolding,
	parsePortfolio,
	recordLog,
	recordName,
	registeredPlans,
	registeredTotals,
	type SavingsEntry,
	savePortfolio,
	savingsStats,
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
	shares: 0,
	quote: null,
	manualValue: null,
	startDate: "",
	monthly: 100,
	annualReturnPercent: 8.2,
	returnSource: "history",
	deposits: [],
	nametag: "",
	icon: null,
	yearlyReturns: [{ year: 2023, percent: 18.1 }],
	historyYears: 6,
};

describe("parsePortfolio", () => {
	it("starts with 20 years, 2% inflation and no holdings", () => {
		expect(parsePortfolio(undefined)).toEqual({
			years: DEFAULT_YEARS,
			inflationPercent: DEFAULT_INFLATION_PERCENT,
			holdings: [],
			savings: [],
		});
	});

	it("reads a saved portfolio as it was", () => {
		const portfolio = {
			years: 15,
			inflationPercent: 2.5,
			holdings: [savedHolding],
			savings: [],
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
		const { fetchMock } = fakeAppApi({
			portfolio: { years: 10, inflationPercent: 3, holdings: [savedHolding] },
		});

		const portfolio = await loadPortfolio();

		expect(fetchMock).toHaveBeenCalledWith("/api/users/1", undefined);
		expect(portfolio.years).toBe(10);
		expect(portfolio.holdings[0].name).toBe("Vanguard");
	});

	it("gives an empty portfolio to a user who never saved one", async () => {
		storeSessionFor(demoUser);
		fakeAppApi();

		expect(await loadPortfolio()).toEqual(emptyPortfolio());
	});

	it("needs a signed in user", async () => {
		fakeAppApi();

		await expect(loadPortfolio()).rejects.toThrow(new AppError("notSignedIn"));
	});
});

describe("savePortfolio", () => {
	it("saves the portfolio on the signed in user", async () => {
		storeSessionFor(demoUser);
		const { fetchMock, saved } = fakeAppApi();
		const portfolio = { ...emptyPortfolio(), years: 30 };

		await savePortfolio(portfolio);

		expect(fetchMock.mock.calls[0][0]).toBe("/api/users/1");
		expect(saved).toEqual([{ portfolio }]);
	});

	it("reports a failed save", async () => {
		storeSessionFor(demoUser);
		fakeAppApi({ saveFails: true });

		await expect(savePortfolio(emptyPortfolio())).rejects.toThrow(
			new AppError("portfolioNotSaved"),
		);
	});
});

describe("registered savings", () => {
	const entry = {
		id: "s1",
		name: "PPR",
		type: "ppr",
		interest: "compoundQuarterly",
		initial: 1000.1,
		monthly: 50.2,
		annualReturnPercent: 3,
		contractRatePercent: 3,
		startDate: "2026-01-15",
		rateBasis: "tae",
		ratePath: "mixed",
		rateStepPercent: 0.5,
		rateFixedYears: 3,
		rateLaterPercent: 1.5,
		deposits: [],
		nametag: "Reforma",
		icon: "retirement",
	};

	it("reads a saved entry with its type", () => {
		expect(parsePortfolio({ savings: [entry] }).savings).toEqual([entry]);
	});

	it("treats an unknown type as other", () => {
		const [parsed] = parsePortfolio({
			savings: [{ ...entry, type: "lottery" }],
		}).savings;

		expect(parsed.type).toBe("other");
	});

	it("turns a negative amount into zero and drops a broken entry", () => {
		const { savings } = parsePortfolio({
			savings: [{ ...entry, initial: -5, monthly: -1 }, { name: "No id" }],
		});

		expect(savings).toHaveLength(1);
		expect(savings[0]).toMatchObject({ initial: 0, monthly: 0 });
	});

	it("reads an older portfolio without savings", () => {
		expect(parsePortfolio({ years: 10, holdings: [] }).savings).toEqual([]);
	});
});

describe("interest on savings", () => {
	it("gives an older entry yearly compound interest", () => {
		const [parsed] = parsePortfolio({
			savings: [{ id: "s", name: "Old", type: "bonds" }],
		}).savings;

		expect(parsed.interest).toBe("compoundYearly");
	});

	it("moves the old compound interest type to a savings account", () => {
		const [parsed] = parsePortfolio({
			savings: [{ id: "s", name: "Old", type: "compoundInterest" }],
		}).savings;

		expect(parsed.type).toBe("savingsAccount");
	});

	it("falls back on an interest kind it does not know", () => {
		const [parsed] = parsePortfolio({
			savings: [{ id: "s", name: "Old", interest: "magic" }],
		}).savings;

		expect(parsed.interest).toBe("compoundYearly");
	});
});

function savingEntry(fields: Partial<SavingsEntry> = {}): SavingsEntry {
	return {
		id: crypto.randomUUID(),
		name: "Saving",
		type: "savingsAccount",
		interest: "simple",
		initial: 1000,
		monthly: 0,
		annualReturnPercent: 10,
		contractRatePercent: 10,
		startDate: "",
		rateBasis: "tanb",
		ratePath: "fixed",
		rateStepPercent: 0.25,
		rateFixedYears: 2,
		rateLaterPercent: 10,
		deposits: [],
		nametag: "",
		icon: null,
		...fields,
	};
}

describe("applyDeposit", () => {
	it("adds the amount to the value and keeps it in the history", () => {
		const entry = savingEntry();

		applyDeposit(entry, 250.5, "2026-11-22");

		expect(entry.initial).toBe(1250.5);
		expect(entry.deposits).toMatchObject([
			{ amount: 250.5, date: "2026-11-22" },
		]);
	});

	it("rounds the amount to cents", () => {
		const entry = savingEntry({ initial: 0.1 });

		applyDeposit(entry, 0.205, "2026-11-22");

		expect(entry.deposits[0].amount).toBe(0.21);
		expect(entry.initial).toBe(0.31);
	});

	it("handles large values", () => {
		const entry = savingEntry({ initial: 10_000_000.55 });

		applyDeposit(entry, 1_000_000.01, "2026-11-22");

		expect(entry.initial).toBe(11_000_000.56);
	});

	it.each([
		0,
		-5,
		0.001,
		Number.NaN,
		Number.POSITIVE_INFINITY,
	])("refuses the amount %s and changes nothing", (amount) => {
		const entry = savingEntry();

		expect(() => applyDeposit(entry, amount, "2026-11-22")).toThrow(
			new AppError("invalidDeposit"),
		);
		expect(entry.initial).toBe(1000);
		expect(entry.deposits).toEqual([]);
	});
});

describe("checkedStartingAmount", () => {
	it("accepts zero and rounds to cents", () => {
		expect(checkedStartingAmount(0)).toBe(0);
		expect(checkedStartingAmount(10.005)).toBe(10.01);
	});

	it("accepts large values", () => {
		expect(checkedStartingAmount(10_000_000.55)).toBe(10_000_000.55);
	});

	it.each([-1, Number.NaN])("refuses %s", (amount) => {
		expect(() => checkedStartingAmount(amount)).toThrow(
			new AppError("invalidStartingAmount"),
		);
	});
});

describe("depositedIn", () => {
	const entry = savingEntry({
		deposits: [
			{ id: "a", amount: 0.1, date: "2026-11-01" },
			{ id: "b", amount: 0.2, date: "2026-11-30" },
			{ id: "c", amount: 5, date: "2026-10-31" },
			{ id: "d", amount: 7, date: "2025-11-15" },
		],
	});

	it("counts one month to the cent", () => {
		expect(depositedIn(entry, "2026-11")).toBe(0.3);
	});

	it("counts a whole year", () => {
		expect(depositedIn(entry, "2026")).toBe(5.3);
	});

	it("is zero for a period without deposits", () => {
		expect(depositedIn(entry, "2024")).toBe(0);
	});

	it("leaves out the starting amount, even in the month it started", () => {
		const started = savingEntry({
			initial: 1000,
			startDate: "2026-11-16",
			deposits: [],
		});

		expect(depositedIn(started, "2026-11")).toBe(0);
	});

	it("counts only the purchase made on a card that also has a start", () => {
		const started = savingEntry({
			initial: 1250.5,
			startDate: "2026-11-16",
			deposits: [{ id: "a", amount: 250.5, date: "2026-11-20" }],
		});

		expect(depositedIn(started, "2026-11")).toBe(250.5);
	});
});

describe("registeredTotals", () => {
	it("adds up the value and only this month's real deposits", () => {
		const portfolio = {
			...emptyPortfolio(),
			savings: [
				savingEntry({
					monthly: 500,
					deposits: [
						{ id: "a", amount: 40, date: "2026-11-02" },
						{ id: "b", amount: 60, date: "2026-10-02" },
					],
				}),
			],
		};

		expect(registeredTotals(portfolio, "2026-11-22")).toEqual({
			value: 1000,
			depositedThisMonth: 40,
			depositedThisYear: 100,
		});
	});

	it("is zero for an empty portfolio", () => {
		expect(registeredTotals(emptyPortfolio(), "2026-11-22")).toEqual({
			value: 0,
			depositedThisMonth: 0,
			depositedThisYear: 0,
		});
	});
});

describe("parsing deposits", () => {
	it("gives an older entry an empty history", () => {
		const [parsed] = parsePortfolio({
			savings: [{ id: "s", name: "Old" }],
		}).savings;

		expect(parsed.deposits).toEqual([]);
	});

	it("drops broken deposits", () => {
		const good = { id: "a", amount: 10, date: "2026-11-02" };
		const [parsed] = parsePortfolio({
			savings: [
				{
					id: "s",
					name: "Old",
					deposits: [
						good,
						{ id: "b", amount: -1, date: "2026-11-02" },
						{ id: "c", amount: 5, date: "yesterday" },
						"junk",
					],
				},
			],
		}).savings;

		expect(parsed.deposits).toEqual([good]);
	});
});

describe("savingsStats", () => {
	it("is all zero without savings", () => {
		expect(savingsStats([], "2026-11-22")).toEqual({
			total: 0,
			interestEarned: 0,
			added: 0,
			addedThisMonth: 0,
			depositCount: 0,
			lastDepositDate: null,
			byType: [],
		});
	});

	it("reports only what was really added", () => {
		const stats = savingsStats(
			[
				savingEntry({
					monthly: 500,
					deposits: [
						{ id: "a", amount: 0.1, date: "2026-11-02" },
						{ id: "b", amount: 0.2, date: "2026-09-02" },
					],
				}),
				savingEntry({
					deposits: [{ id: "c", amount: 5, date: "2026-11-20" }],
				}),
			],
			"2026-11-22",
		);

		expect(stats).toMatchObject({
			total: 2000,
			added: 5.3,
			addedThisMonth: 5.1,
			depositCount: 3,
			lastDepositDate: "2026-11-20",
		});
	});

	it("splits the value by type, largest first, without empty types", () => {
		const stats = savingsStats(
			[
				savingEntry({ type: "ppr", initial: 100 }),
				savingEntry({ type: "bonds", initial: 500 }),
				savingEntry({ type: "ppr", initial: 50 }),
				savingEntry({ type: "other", initial: 0 }),
			],
			"2026-11-22",
		);

		expect(stats.byType).toEqual([
			{ type: "bonds", amount: 500 },
			{ type: "ppr", amount: 150 },
		]);
	});

	it("handles large values", () => {
		const stats = savingsStats(
			[savingEntry({ initial: 10_000_000.55 })],
			"2026-11-22",
		);

		expect(stats.total).toBe(10_000_000.55);
	});
});

describe("recordName", () => {
	it("uses the nametag when there is one", () => {
		expect(recordName({ name: "Vanguard", nametag: "Reforma" })).toBe(
			"Reforma",
		);
	});

	it.each(["", "   "])("falls back on the real name for '%s'", (nametag) => {
		expect(recordName({ name: "Vanguard", nametag })).toBe("Vanguard");
	});
});

describe("parsing the rate of a saving", () => {
	it("reads an older saving as a fixed TANB", () => {
		const [parsed] = parsePortfolio({
			savings: [{ id: "s", name: "Old", annualReturnPercent: 3 }],
		}).savings;

		expect(parsed).toMatchObject({
			rateBasis: "tanb",
			ratePath: "fixed",
			rateLaterPercent: 3,
			nametag: "",
			icon: null,
		});
	});

	it("drops unknown rate kinds and icons", () => {
		const [parsed] = parsePortfolio({
			savings: [
				{ id: "s", name: "Old", rateBasis: "x", ratePath: "y", icon: "z" },
			],
		}).savings;

		expect(parsed).toMatchObject({
			rateBasis: "tanb",
			ratePath: "fixed",
			icon: null,
		});
	});

	it("passes the rate terms on to the projection", () => {
		const portfolio = {
			...emptyPortfolio(),
			savings: [savingEntry({ rateBasis: "tae", ratePath: "stepped" })],
		};

		expect(registeredPlans(portfolio, "2026-11-22")[0].rate).toMatchObject({
			basis: "tae",
			path: "stepped",
		});
	});
});

describe("the real rate of a saving", () => {
	it("reads an older saving with its rate and no start date", () => {
		const [parsed] = parsePortfolio({
			savings: [{ id: "s", name: "Old", annualReturnPercent: 3 }],
		}).savings;

		expect(parsed).toMatchObject({ contractRatePercent: 3, startDate: "" });
	});

	it("does not move the real value when the simulated rate changes", () => {
		const entry = savingEntry({
			startDate: "2025-11-22",
			contractRatePercent: 10,
			rateBasis: "tanl",
			annualReturnPercent: 90,
		});

		expect(currentValue(entry, "2026-11-22")).toBe(1100);
	});

	it("counts interest in the totals but not as money added", () => {
		const portfolio = {
			...emptyPortfolio(),
			savings: [
				savingEntry({
					startDate: "2025-11-22",
					contractRatePercent: 10,
					rateBasis: "tanl",
				}),
			],
		};

		expect(registeredTotals(portfolio, "2026-11-22")).toEqual({
			value: 1100,
			depositedThisMonth: 0,
			depositedThisYear: 0,
		});
		expect(savingsStats(portfolio.savings, "2026-11-22")).toMatchObject({
			total: 1100,
			interestEarned: 100,
			added: 0,
		});
	});

	it("starts the simulation from the interest already earned", () => {
		const portfolio = {
			...emptyPortfolio(),
			savings: [
				savingEntry({
					startDate: "2025-11-22",
					contractRatePercent: 10,
					rateBasis: "tanl",
					annualReturnPercent: 0,
				}),
			],
		};
		const [plan] = registeredPlans(portfolio, "2026-11-22");

		expect(plan.initial).toBe(1000);
		expect(plan.start?.elapsedMonths).toBe(12);
		expect(plan.start?.pending).toBeCloseTo(100, 6);
	});

	it.each([
		{ startDate: "2026-11-23" },
		{ startDate: "yesterday" },
	])("refuses the date %o", (fields) => {
		expect(() =>
			checkSavingsTerms({ ...defaultSavingsTerms(), ...fields }, "2026-11-22"),
		).toThrow(new AppError("invalidStartDate"));
	});

	it.each([
		{ contractRatePercent: Number.NaN },
		{ contractRatePercent: -100 },
		{ rateStepPercent: Number.NaN },
		{ rateFixedYears: 1.5 },
		{ rateFixedYears: 51 },
		{ rateLaterPercent: Number.NaN },
	])("refuses the rate %o", (fields) => {
		expect(() =>
			checkSavingsTerms({ ...defaultSavingsTerms(), ...fields }, "2026-11-22"),
		).toThrow(new AppError("invalidReturn"));
	});

	it("accepts today as a start date", () => {
		expect(() =>
			checkSavingsTerms(
				{ ...defaultSavingsTerms(), startDate: "2026-11-22" },
				"2026-11-22",
			),
		).not.toThrow();
	});
});

describe("savings recorded this year", () => {
	it("leaves out earlier years and interest, to the cent", () => {
		const portfolio = {
			...emptyPortfolio(),
			savings: [
				savingEntry({
					startDate: "2024-01-01",
					contractRatePercent: 10,
					deposits: [
						{ id: "a", amount: 0.1, date: "2026-01-01" },
						{ id: "b", amount: 0.2, date: "2026-11-22" },
						{ id: "c", amount: 50, date: "2025-12-31" },
					],
				}),
			],
		};

		expect(registeredTotals(portfolio, "2026-11-22").depositedThisYear).toBe(
			0.3,
		);
	});

	it("adds up large values", () => {
		const portfolio = {
			...emptyPortfolio(),
			savings: [
				savingEntry({
					deposits: [{ id: "a", amount: 10_000_000.55, date: "2026-02-01" }],
				}),
			],
		};

		expect(registeredTotals(portfolio, "2026-11-22").depositedThisYear).toBe(
			10_000_000.55,
		);
	});
});

function tickerHolding(fields: Partial<Holding> = {}): Holding {
	return newHolding({
		name: "Vanguard",
		symbol: "VWCE.DE",
		initial: 500,
		shares: 4,
		quote: { price: 140, currency: "EUR", rateToEur: 1, time: 1 },
		...fields,
	});
}

describe("holdingValue", () => {
	it("values the shares at the latest price", () => {
		expect(holdingValue(tickerHolding())).toBe(560);
	});

	it("converts a price in another currency to euros", () => {
		const holding = tickerHolding({
			shares: 2,
			quote: { price: 100, currency: "USD", rateToEur: 0.9, time: 1 },
		});

		expect(holdingValue(holding)).toBe(180);
	});

	it("rounds the value to cents", () => {
		const holding = tickerHolding({ shares: 0.79010376 });

		expect(holdingValue(holding)).toBe(110.61);
	});

	it("shows what was invested until a price arrives", () => {
		expect(holdingValue(tickerHolding({ quote: null }))).toBe(500);
	});

	it("shows what was invested on an older record without shares", () => {
		expect(holdingValue(tickerHolding({ shares: 0 }))).toBe(500);
	});

	it("uses the value typed on a holding with no ticker", () => {
		const holding = tickerHolding({
			symbol: null,
			quote: null,
			manualValue: 650,
		});

		expect(holdingValue(holding)).toBe(650);
	});

	it("handles large positions", () => {
		const holding = tickerHolding({ shares: 100_000 });

		expect(holdingValue(holding)).toBe(14_000_000);
	});
});

describe("investmentStats", () => {
	it("adds up a gain across holdings", () => {
		expect(investmentStats([tickerHolding()])).toEqual({
			invested: 500,
			value: 560,
			gain: 60,
			gainRate: 0.12,
		});
	});

	it("shows a loss as negative", () => {
		const holding = tickerHolding({
			quote: { price: 100, currency: "EUR", rateToEur: 1, time: 1 },
		});

		expect(investmentStats([holding])).toMatchObject({
			gain: -100,
			gainRate: -0.2,
		});
	});

	it("is all zero with nothing invested", () => {
		expect(investmentStats([])).toEqual({
			invested: 0,
			value: 0,
			gain: 0,
			gainRate: 0,
		});
	});
});

describe("buying more of a ticker", () => {
	it("adds the amount and the broker's shares", () => {
		const holding = tickerHolding();

		applyDeposit(holding, 99.5, "2026-11-22", 0.70123456);

		expect(holding.initial).toBe(599.5);
		expect(holding.shares).toBe(4.70123456);
		expect(holding.deposits[0]).toMatchObject({
			amount: 99.5,
			shares: 0.70123456,
		});
	});

	it.each([
		undefined,
		0,
		-1,
		Number.NaN,
	])("refuses a purchase with %s shares and changes nothing", (shares) => {
		const holding = tickerHolding();

		expect(() => applyDeposit(holding, 100, "2026-11-22", shares)).toThrow(
			new AppError("invalidShares"),
		);
		expect(holding).toMatchObject({ initial: 500, shares: 4, deposits: [] });
	});

	it("asks for the current shares before an older record can buy more", () => {
		const holding = tickerHolding({ shares: 0 });

		expect(isMissingShares(holding)).toBe(true);
		expect(() => applyDeposit(holding, 100, "2026-11-22", 1)).toThrow(
			new AppError("sharesMissing"),
		);
	});

	it("needs no shares on a holding with no ticker", () => {
		const holding = tickerHolding({ symbol: null, shares: 0 });

		applyDeposit(holding, 100, "2026-11-22");

		expect(holding.initial).toBe(600);
	});

	it("keeps eight decimal places of a share", () => {
		expect(checkedShares(0.123456789)).toBe(0.12345679);
	});

	it("refuses negative shares in an edited position", () => {
		expect(() =>
			checkedPosition(
				{ initial: 100, shares: -1, manualValue: null, startDate: "" },
				"2026-11-22",
			),
		).toThrow(new AppError("invalidShares"));
	});
});

describe("a holding in the simulation", () => {
	it("starts from what it is worth today", () => {
		const portfolio = { ...emptyPortfolio(), holdings: [tickerHolding()] };
		const [plan] = registeredPlans(portfolio, "2026-11-22");

		expect(plan.initial).toBe(500);
		expect(plan.start?.credited).toBe(60);
	});

	it("counts the market value in the totals, not as money added", () => {
		const portfolio = { ...emptyPortfolio(), holdings: [tickerHolding()] };

		expect(registeredTotals(portfolio, "2026-11-22")).toMatchObject({
			value: 560,
			depositedThisMonth: 0,
		});
	});
});

describe("checkedStartDate", () => {
	it("accepts today and earlier days", () => {
		expect(checkedStartDate("2026-11-22", "2026-11-22")).toBe("2026-11-22");
		expect(checkedStartDate("2020-02-29", "2026-11-22")).toBe("2020-02-29");
	});

	it("asks for a date when there is none", () => {
		expect(() => checkedStartDate("", "2026-11-22")).toThrow(
			new AppError("startDateMissing"),
		);
	});

	it.each(["2026-11-23", "ontem"])("refuses %s", (date) => {
		expect(() => checkedStartDate(date, "2026-11-22")).toThrow(
			new AppError("invalidStartDate"),
		);
	});

	it("lets an older record edit its position without a date", () => {
		expect(
			checkedPosition(
				{ initial: 100, shares: 0, manualValue: null, startDate: "" },
				"2026-11-22",
			).startDate,
		).toBe("");
	});

	it("refuses a future date in an edited position", () => {
		expect(() =>
			checkedPosition(
				{ initial: 100, shares: 1, manualValue: null, startDate: "2999-01-01" },
				"2026-11-22",
			),
		).toThrow(new AppError("invalidStartDate"));
	});
});

describe("recordLog", () => {
	it("starts a new investment with how it began", () => {
		const holding = tickerHolding({ startDate: "2025-03-10" });

		expect(recordLog(holding)).toEqual([
			{
				id: "start",
				kind: "start",
				date: "2025-03-10",
				amount: 500,
				shares: 4,
				pricePerShare: 125,
			},
		]);
	});

	it("adds a purchase automatically, newest first", () => {
		const holding = tickerHolding({ startDate: "2025-03-10" });

		applyDeposit(holding, 100, "2026-01-05", 0.5);
		applyDeposit(holding, 60, "2026-02-05", 0.25);

		expect(recordLog(holding).map((line) => [line.kind, line.date])).toEqual([
			["purchase", "2026-02-05"],
			["purchase", "2026-01-05"],
			["start", "2025-03-10"],
		]);
	});

	it("keeps what each purchase really cost", () => {
		const holding = tickerHolding();

		applyDeposit(holding, 99, "2026-01-05", 0.7901);

		expect(recordLog(holding)[0]).toMatchObject({
			amount: 99,
			shares: 0.7901,
			pricePerShare: 125.3,
		});
		expect(recordLog(holding)[1]).toMatchObject({ amount: 500, shares: 4 });
	});

	it("shows the latest of two purchases on the same day first", () => {
		const holding = tickerHolding();

		applyDeposit(holding, 10, "2026-01-05", 0.1);
		applyDeposit(holding, 20, "2026-01-05", 0.2);

		expect(recordLog(holding)[0].amount).toBe(20);
	});

	it("logs a saving as deposits with no shares", () => {
		const entry = savingEntry({ startDate: "2025-01-01" });

		applyDeposit(entry, 50, "2026-01-05");

		expect(recordLog(entry)).toMatchObject([
			{ kind: "deposit", amount: 50, shares: null, pricePerShare: null },
			{ kind: "start", amount: 1000, date: "2025-01-01" },
		]);
	});

	it("leaves out a start of zero", () => {
		const entry = savingEntry({ initial: 0 });

		expect(recordLog(entry)).toEqual([]);
	});

	it("handles large purchases to the cent", () => {
		const holding = tickerHolding();

		applyDeposit(holding, 1_000_000.01, "2026-01-05", 3);

		expect(recordLog(holding)[0]).toMatchObject({
			amount: 1_000_000.01,
			pricePerShare: 333_333.34,
		});
	});
});
