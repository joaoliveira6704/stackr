import { afterEach, describe, expect, it, vi } from "vitest";
import { chartBody, jsonResponse, searchBody } from "../test/fake-api";
import { AppError } from "./errors";
import {
	averageAnnualReturn,
	fetchPriceHistory,
	historyYears,
	parseHistory,
	parseSearch,
	searchTickers,
	yearlyReturns,
} from "./market";

afterEach(() => {
	vi.unstubAllGlobals();
});

function stubFetch(response: () => Response | Promise<Response>) {
	const fetchMock = vi.fn(async () => response());
	vi.stubGlobal("fetch", fetchMock);
	return fetchMock;
}

async function codeOf(promise: Promise<unknown>): Promise<string | undefined> {
	try {
		await promise;
	} catch (cause) {
		return cause instanceof AppError ? cause.code : "not an AppError";
	}
	return undefined;
}

const TEN_PERCENT_YEARS = { 2020: 10, 2021: 10, 2022: 10, 2023: 10 };

describe("parseSearch", () => {
	it("keeps stocks, ETFs, funds, crypto and indexes with their names", () => {
		const matches = parseSearch(
			searchBody([
				{ symbol: "VWCE.DE", longname: "Vanguard All-World", quoteType: "ETF" },
				{ symbol: "AAPL", longname: "Apple Inc.", quoteType: "EQUITY" },
				{
					symbol: "BTC-EUR",
					longname: "Bitcoin EUR",
					quoteType: "CRYPTOCURRENCY",
				},
			]),
		);

		expect(matches).toEqual([
			{
				symbol: "VWCE.DE",
				name: "Vanguard All-World",
				kind: "etf",
				exchange: "XETRA",
			},
			{ symbol: "AAPL", name: "Apple Inc.", kind: "stock", exchange: "XETRA" },
			{
				symbol: "BTC-EUR",
				name: "Bitcoin EUR",
				kind: "crypto",
				exchange: "XETRA",
			},
		]);
	});

	it("drops results we cannot simulate, such as futures or news", () => {
		const matches = parseSearch(
			searchBody([
				{ symbol: "ES=F", longname: "S&P Futures", quoteType: "FUTURE" },
			]),
		);

		expect(matches).toEqual([]);
	});

	it("returns nothing for an answer with an unexpected shape", () => {
		expect(parseSearch(null)).toEqual([]);
		expect(parseSearch({ quotes: "nope" as unknown as [] })).toEqual([]);
	});
});

describe("searchTickers", () => {
	it("does not call the market for an empty query", async () => {
		const fetchMock = stubFetch(() => jsonResponse({ quotes: [] }));

		expect(await searchTickers("   ")).toEqual([]);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("asks the proxy for the trimmed query", async () => {
		const fetchMock = stubFetch(() => jsonResponse({ quotes: [] }));

		await searchTickers(" apple ");

		expect(String(fetchMock.mock.calls[0])).toContain(
			"/market/v1/finance/search?q=apple",
		);
	});

	it("reports the market as unavailable when the request fails", async () => {
		stubFetch(() => {
			throw new TypeError("Failed to fetch");
		});

		expect(await codeOf(searchTickers("apple"))).toBe("marketUnavailable");
	});
});

describe("parseHistory", () => {
	it("reads the name, currency and every monthly price", () => {
		const history = parseHistory(chartBody("VWCE.DE", { 2023: 0 }, "Vanguard"));

		expect(history.symbol).toBe("VWCE.DE");
		expect(history.name).toBe("Vanguard");
		expect(history.currency).toBe("EUR");
		expect(history.points).toHaveLength(12);
	});

	it("skips months with no price", () => {
		const body = chartBody("X", { 2023: 0 });
		body.chart.result[0].indicators.adjclose[0].adjclose[3] =
			null as unknown as number;

		expect(parseHistory(body).points).toHaveLength(11);
	});

	it("says the ticker was not found when Yahoo has no result", () => {
		expect(() =>
			parseHistory({ chart: { result: null, error: { code: "Not Found" } } }),
		).toThrow(new AppError("tickerNotFound"));
	});
});

describe("fetchPriceHistory", () => {
	it("asks for ten years of monthly prices", async () => {
		const fetchMock = stubFetch(() =>
			jsonResponse(chartBody("AAPL", { 2023: 5 })),
		);

		await fetchPriceHistory("AAPL");

		expect(String(fetchMock.mock.calls[0])).toContain(
			"/market/v8/finance/chart/AAPL?range=10y&interval=1mo",
		);
	});

	it("reports an unknown ticker", async () => {
		stubFetch(() => jsonResponse({}, 404));

		expect(await codeOf(fetchPriceHistory("NOPE"))).toBe("tickerNotFound");
	});

	it("reports the market as unavailable on a server error", async () => {
		stubFetch(() => jsonResponse({}, 503));

		expect(await codeOf(fetchPriceHistory("AAPL"))).toBe("marketUnavailable");
	});
});

describe("yearlyReturns", () => {
	it("gives the growth of each full year after the first", () => {
		const { points } = parseHistory(
			chartBody("X", { 2020: 4, 2021: 10, 2022: -20, 2023: 15 }),
		);

		expect(yearlyReturns(points, 2025)).toEqual([
			{ year: 2021, percent: 10 },
			{ year: 2022, percent: -20 },
			{ year: 2023, percent: 15 },
		]);
	});

	it("leaves out the current year because it is not over", () => {
		const { points } = parseHistory(
			chartBody("X", { 2022: 5, 2023: 5, 2024: 5 }),
		);

		expect(yearlyReturns(points, 2024).map((entry) => entry.year)).toEqual([
			2023,
		]);
	});

	it("keeps January in its own year for an exchange ahead of UTC", () => {
		// Frankfurt stamps each month at local midnight, an hour before
		// midnight in UTC, so 1 January reads as 31 December without the offset.
		const body = chartBody("VWCE.DE", { 2021: 27, 2022: -13, 2023: 18 });
		const result = body.chart.result[0];
		result.timestamp = result.timestamp.map((seconds) => seconds - 3600);
		Object.assign(result.meta, { gmtoffset: 3600 });

		const { points } = parseHistory(body);

		expect(yearlyReturns(points, 2025)).toEqual([
			{ year: 2022, percent: -13 },
			{ year: 2023, percent: 18 },
		]);
	});

	it("returns nothing without prices", () => {
		expect(yearlyReturns([], 2025)).toEqual([]);
	});
});

describe("averageAnnualReturn", () => {
	it("finds the steady yearly growth behind the prices", () => {
		const { points } = parseHistory(chartBody("X", TEN_PERCENT_YEARS));

		expect(averageAnnualReturn(points)).toBe(10);
	});

	it("finds a negative average for a falling asset", () => {
		const { points } = parseHistory(chartBody("X", { 2021: -10, 2022: -10 }));

		expect(averageAnnualReturn(points)).toBe(-10);
	});

	it("gives no average with less than a year of prices", () => {
		const { points } = parseHistory(chartBody("X", { 2023: 10 }));

		expect(averageAnnualReturn(points)).toBeNull();
		expect(averageAnnualReturn([])).toBeNull();
	});
});

describe("historyYears", () => {
	it("counts the whole years the prices cover", () => {
		const { points } = parseHistory(chartBody("X", TEN_PERCENT_YEARS));

		expect(historyYears(points)).toBe(3);
		expect(historyYears([])).toBe(0);
	});
});
