/**
 * Prices from Yahoo Finance, reached through the "/market" proxy in
 * vite.config.ts. These endpoints are public but unofficial, so every caller
 * must be ready for them to fail and fall back to a return typed by hand.
 */
import { AppError } from "./errors";
import { roundPercent } from "./money";

const MARKET_BASE = "/market";
const HISTORY_RANGE = "10y";
const SEARCH_LIMIT = 20;
const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;

export type AssetKind = "stock" | "etf" | "fund" | "crypto" | "index";

const KINDS_BY_QUOTE_TYPE: Record<string, AssetKind> = {
	EQUITY: "stock",
	ETF: "etf",
	MUTUALFUND: "fund",
	CRYPTOCURRENCY: "crypto",
	INDEX: "index",
};

export interface TickerMatch {
	symbol: string;
	name: string;
	kind: AssetKind;
	exchange: string;
}

export interface PricePoint {
	time: number;
	price: number;
}

export interface PriceHistory {
	symbol: string;
	name: string;
	currency: string;
	points: PricePoint[];
}

export interface YearReturn {
	year: number;
	/** Growth over the calendar year in percent, -12.5 for a 12.5% fall. */
	percent: number;
}

interface SearchQuote {
	symbol?: string;
	shortname?: string;
	longname?: string;
	quoteType?: string;
	exchDisp?: string;
}

interface ChartResult {
	meta?: {
		symbol?: string;
		currency?: string;
		longName?: string;
		shortName?: string;
		/** Seconds between the exchange clock and UTC. */
		gmtoffset?: number;
	};
	timestamp?: number[];
	indicators?: {
		adjclose?: { adjclose?: (number | null)[] }[];
		quote?: { close?: (number | null)[] }[];
	};
}

async function requestMarket(path: string): Promise<unknown> {
	let response: Response;
	try {
		response = await fetch(`${MARKET_BASE}${path}`);
	} catch {
		throw new AppError("marketUnavailable");
	}
	if (response.status === 404) {
		throw new AppError("tickerNotFound");
	}
	if (!response.ok) {
		throw new AppError("marketUnavailable");
	}
	return response.json();
}

export function parseSearch(body: unknown): TickerMatch[] {
	const quotes = (body as { quotes?: unknown })?.quotes;
	if (!Array.isArray(quotes)) return [];
	return (quotes as SearchQuote[]).flatMap((quote) => {
		const kind = KINDS_BY_QUOTE_TYPE[quote.quoteType ?? ""];
		if (!kind || !quote.symbol) return [];
		return [
			{
				symbol: quote.symbol,
				name: quote.longname ?? quote.shortname ?? quote.symbol,
				kind,
				exchange: quote.exchDisp ?? "",
			},
		];
	});
}

export async function searchTickers(query: string): Promise<TickerMatch[]> {
	const trimmed = query.trim();
	if (!trimmed) return [];
	const params = new URLSearchParams({
		q: trimmed,
		quotesCount: String(SEARCH_LIMIT),
		newsCount: "0",
	});
	return parseSearch(await requestMarket(`/v1/finance/search?${params}`));
}

// Adjusted prices include dividends, so the growth they show is what an
// investor who reinvested everything would have seen.
function pricesFrom(result: ChartResult): (number | null)[] {
	return (
		result.indicators?.adjclose?.[0]?.adjclose ??
		result.indicators?.quote?.[0]?.close ??
		[]
	);
}

export function parseHistory(body: unknown): PriceHistory {
	const result = (body as { chart?: { result?: ChartResult[] | null } })?.chart
		?.result?.[0];
	if (!result?.meta?.symbol) {
		throw new AppError("tickerNotFound");
	}
	const prices = pricesFrom(result);
	// Each month is stamped at midnight on the exchange clock, which in UTC can
	// still be the last day of the month before. Moving to the exchange clock
	// keeps every price in its own month and year.
	const offset = result.meta.gmtoffset ?? 0;
	const points = (result.timestamp ?? []).flatMap((seconds, index) => {
		const price = prices[index];
		return typeof price === "number" && price > 0
			? [{ time: (seconds + offset) * 1000, price }]
			: [];
	});
	return {
		symbol: result.meta.symbol,
		name: result.meta.longName ?? result.meta.shortName ?? result.meta.symbol,
		currency: result.meta.currency ?? "",
		points,
	};
}

export async function fetchPriceHistory(symbol: string): Promise<PriceHistory> {
	const params = new URLSearchParams({ range: HISTORY_RANGE, interval: "1mo" });
	const path = `/v8/finance/chart/${encodeURIComponent(symbol)}?${params}`;
	return parseHistory(await requestMarket(path));
}

function lastPriceByYear(points: PricePoint[]): Map<number, number> {
	const byYear = new Map<number, number>();
	for (const point of [...points].sort((a, b) => a.time - b.time)) {
		byYear.set(new Date(point.time).getUTCFullYear(), point.price);
	}
	return byYear;
}

/**
 * Growth of each full calendar year, oldest first. The current year is left
 * out because it is not over yet, and so is the first year, because there is
 * no price from the end of the year before to compare it with.
 */
export function yearlyReturns(
	points: PricePoint[],
	currentYear = new Date().getUTCFullYear(),
): YearReturn[] {
	const byYear = lastPriceByYear(points);
	return [...byYear.entries()].flatMap(([year, price]) => {
		const previous = byYear.get(year - 1);
		if (previous === undefined || year >= currentYear) return [];
		return [{ year, percent: roundPercent((price / previous - 1) * 100) }];
	});
}

/**
 * The steady yearly growth that turns the first price into the last one,
 * or null with less than a year of prices to go on.
 */
export function averageAnnualReturn(points: PricePoint[]): number | null {
	if (points.length < 2) return null;
	const sorted = [...points].sort((a, b) => a.time - b.time);
	const first = sorted[0];
	const last = sorted[sorted.length - 1];
	const years = (last.time - first.time) / YEAR_MS;
	if (years < 1) return null;
	return roundPercent(((last.price / first.price) ** (1 / years) - 1) * 100);
}

/** How many years of prices the average is based on, rounded down. */
export function historyYears(points: PricePoint[]): number {
	if (points.length < 2) return 0;
	const times = points.map((point) => point.time);
	return Math.floor((Math.max(...times) - Math.min(...times)) / YEAR_MS);
}
