import type { AssetKind, YearReturn } from "./market";
import { MAX_YEARS } from "./projection";
import { isRecord, loadUserField, numberOr, saveUserField } from "./user-data";

export const MAX_HOLDINGS = 10;
export const DEFAULT_YEARS = 20;
/** The European Central Bank aims to keep inflation close to this. */
export const DEFAULT_INFLATION_PERCENT = 2;
export const DEFAULT_RETURN_PERCENT = 5;
export const DEFAULT_INITIAL = 1000;
export const DEFAULT_MONTHLY = 100;

export interface Holding {
	id: string;
	/** Null when the user typed the holding in by hand. */
	symbol: string | null;
	name: string;
	kind: AssetKind | null;
	initial: number;
	monthly: number;
	annualReturnPercent: number;
	/** Where the expected return came from, so the screen can say so. */
	returnSource: "history" | "manual";
	/** Growth of the last full calendar years, empty without market data. */
	yearlyReturns: YearReturn[];
	/** How many years the historical average is based on. */
	historyYears: number;
}

export interface Portfolio {
	years: number;
	inflationPercent: number;
	holdings: Holding[];
}

export function emptyPortfolio(): Portfolio {
	return {
		years: DEFAULT_YEARS,
		inflationPercent: DEFAULT_INFLATION_PERCENT,
		holdings: [],
	};
}

function parseYearReturns(value: unknown): YearReturn[] {
	if (!Array.isArray(value)) return [];
	return value.filter(
		(entry): entry is YearReturn =>
			isRecord(entry) &&
			Number.isInteger(entry.year) &&
			typeof entry.percent === "number",
	);
}

function parseHolding(value: unknown): Holding | null {
	if (!isRecord(value) || typeof value.id !== "string") return null;
	if (typeof value.name !== "string") return null;
	return {
		id: value.id,
		symbol: typeof value.symbol === "string" ? value.symbol : null,
		name: value.name,
		kind: typeof value.kind === "string" ? (value.kind as AssetKind) : null,
		initial: Math.max(numberOr(value.initial, 0), 0),
		monthly: Math.max(numberOr(value.monthly, 0), 0),
		annualReturnPercent: numberOr(
			value.annualReturnPercent,
			DEFAULT_RETURN_PERCENT,
		),
		returnSource: value.returnSource === "history" ? "history" : "manual",
		yearlyReturns: parseYearReturns(value.yearlyReturns),
		historyYears: Math.max(numberOr(value.historyYears, 0), 0),
	};
}

/**
 * Reads a portfolio saved in db.json. Anything missing or broken falls back
 * to the defaults, so an old or hand edited file never breaks the screen.
 */
export function parsePortfolio(value: unknown): Portfolio {
	const empty = emptyPortfolio();
	if (!isRecord(value)) return empty;
	const years = numberOr(value.years, empty.years);
	const holdings = Array.isArray(value.holdings)
		? value.holdings.flatMap((entry) => parseHolding(entry) ?? [])
		: [];
	return {
		years:
			Number.isInteger(years) && years >= 1 && years <= MAX_YEARS
				? years
				: empty.years,
		inflationPercent: numberOr(value.inflationPercent, empty.inflationPercent),
		holdings: holdings.slice(0, MAX_HOLDINGS),
	};
}

export async function loadPortfolio(): Promise<Portfolio> {
	return parsePortfolio(await loadUserField("portfolio", "portfolioNotLoaded"));
}

export async function savePortfolio(portfolio: Portfolio): Promise<void> {
	await saveUserField("portfolio", portfolio, "portfolioNotSaved");
}
