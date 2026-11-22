import { AppError } from "./errors";
import { accrueSavings } from "./interest-accrual";
import {
	type AssetKind,
	averageAnnualReturn,
	fetchPriceHistory,
	fetchQuote,
	historyYears,
	type MarketQuote,
	type PriceHistory,
	type YearReturn,
	yearlyReturns,
} from "./market";
import { roundCents, sumMoney } from "./money";
import {
	type HoldingPlan,
	INTEREST_KINDS,
	type InterestKind,
	MAX_YEARS,
	RATE_BASES,
	RATE_PATHS,
	type RateBasis,
	type RatePath,
} from "./projection";
import { isRecord, loadUserField, numberOr, saveUserField } from "./user-data";

export const MAX_HOLDINGS = 10;
export const MAX_SAVINGS = 10;
const SHARE_PRECISION = 100_000_000;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const DEFAULT_YEARS = 20;
/** The European Central Bank aims to keep inflation close to this. */
export const DEFAULT_INFLATION_PERCENT = 2;
export const DEFAULT_RETURN_PERCENT = 5;
export const DEFAULT_INITIAL = 1000;
export const DEFAULT_MONTHLY = 100;
/** A cautious starting point, since real rates change with each product. */
export const DEFAULT_SAVINGS_RETURN_PERCENT = 2;
export const DEFAULT_INTEREST_KIND: InterestKind = "compoundYearly";

const DEFAULT_RATE_STEP_PERCENT = 0.25;
const DEFAULT_RATE_FIXED_YEARS = 2;

/** The pictures a user can give a record. Each one is a name in ICONS. */
export const RECORD_ICONS = [
	"growth",
	"savings",
	"home",
	"car",
	"travel",
	"studies",
	"family",
	"gift",
	"retirement",
	"shield",
] as const;
export type RecordIcon = (typeof RECORD_ICONS)[number];

export const SAVINGS_TYPES = [
	"savingsAccount",
	"termDeposit",
	"savingsCertificates",
	"treasuryCertificates",
	"bonds",
	"ppr",
	"pensionFund",
	"other",
] as const;
export type SavingsType = (typeof SAVINGS_TYPES)[number];

/** Money the user added to an investment or a saving. */
export interface Deposit {
	id: string;
	amount: number;
	/** The day it was added, as YYYY-MM-DD on the user's own calendar. */
	date: string;
	/** Units bought, as the broker confirmed them. Only on a ticker. */
	shares?: number;
}

export interface Holding {
	id: string;
	/** Null when the user typed the holding in by hand. */
	symbol: string | null;
	name: string;
	kind: AssetKind | null;
	/** Everything invested in it, with every purchase. */
	initial: number;
	/** Units held, as the broker confirmed them. */
	shares: number;
	/** The last known market price, null until one arrives. */
	quote: MarketQuote | null;
	/** The value the user typed for a holding with no ticker. */
	manualValue: number | null;
	/** The day the user started it, as YYYY-MM-DD. Empty on older records. */
	startDate: string;
	/** The monthly deposit the simulator assumes, never a real payment. */
	monthly: number;
	annualReturnPercent: number;
	deposits: Deposit[];
	/** The user's own name for it, empty to show the real name. */
	nametag: string;
	/** The user's own picture, null for the default one. */
	icon: RecordIcon | null;
	/** Where the expected return came from, so the screen can say so. */
	returnSource: "history" | "manual";
	/** Growth of the last full calendar years, empty without market data. */
	yearlyReturns: YearReturn[];
	/** How many years the historical average is based on. */
	historyYears: number;
}

export interface SavingsEntry {
	id: string;
	name: string;
	type: SavingsType;
	interest: InterestKind;
	/** Everything the user put in, with every deposit and no interest. */
	initial: number;
	/** The monthly deposit the simulator assumes, never a real payment. */
	monthly: number;
	/** The rate tried in the simulator, which never moves the real balance. */
	annualReturnPercent: number;
	/** The rate the user really receives, which grows the real balance. */
	contractRatePercent: number;
	/** The day interest starts, as YYYY-MM-DD. Empty means no interest yet. */
	startDate: string;
	/** How the rate is quoted, such as TANB. */
	rateBasis: RateBasis;
	/** How the rate moves over the years. */
	ratePath: RatePath;
	/** Points the rate rises each year on a stepped rate. */
	rateStepPercent: number;
	/** Years at the first rate on a mixed rate. */
	rateFixedYears: number;
	/** The rate after those years on a mixed rate. */
	rateLaterPercent: number;
	deposits: Deposit[];
	/** The user's own name for it, empty to show the real name. */
	nametag: string;
	/** The user's own picture, null for the default one. */
	icon: RecordIcon | null;
}

export type SavingsTerms = Pick<
	SavingsEntry,
	| "type"
	| "interest"
	| "contractRatePercent"
	| "startDate"
	| "rateBasis"
	| "ratePath"
	| "rateStepPercent"
	| "rateFixedYears"
	| "rateLaterPercent"
>;

export function defaultSavingsTerms(): SavingsTerms {
	return {
		type: "savingsAccount",
		interest: DEFAULT_INTEREST_KIND,
		contractRatePercent: DEFAULT_SAVINGS_RETURN_PERCENT,
		startDate: "",
		rateBasis: "tanb",
		ratePath: "fixed",
		rateStepPercent: DEFAULT_RATE_STEP_PERCENT,
		rateFixedYears: DEFAULT_RATE_FIXED_YEARS,
		rateLaterPercent: DEFAULT_SAVINGS_RETURN_PERCENT,
	};
}

function isRatePercent(value: number): boolean {
	return Number.isFinite(value) && value > -100;
}

/** Checks the real rate and start date before they can move a balance. */
export function checkSavingsTerms(terms: SavingsTerms, today: string): void {
	const { startDate, rateFixedYears } = terms;
	if (startDate && (!DATE_PATTERN.test(startDate) || startDate > today)) {
		throw new AppError("invalidStartDate");
	}
	const validYears =
		Number.isInteger(rateFixedYears) &&
		rateFixedYears >= 0 &&
		rateFixedYears <= MAX_YEARS;
	if (
		!isRatePercent(terms.contractRatePercent) ||
		!isRatePercent(terms.rateLaterPercent) ||
		!Number.isFinite(terms.rateStepPercent) ||
		!validYears
	) {
		throw new AppError("invalidReturn");
	}
}

/** What was invested in a holding and what it holds. */
export interface HoldingPosition {
	initial: number;
	shares: number;
	manualValue: number | null;
	startDate: string;
}

/** What the user can change on a record after creating it. */
export interface RecordChanges {
	nametag: string;
	icon: RecordIcon | null;
	terms?: SavingsTerms;
	position?: HoldingPosition;
}

/** The name to show: the user's nametag, or the real name without one. */
export function recordName({
	name,
	nametag,
}: Pick<Holding, "name" | "nametag">): string {
	return nametag.trim() || name;
}

export interface Portfolio {
	years: number;
	inflationPercent: number;
	holdings: Holding[];
	savings: SavingsEntry[];
}

export interface TickerChoice {
	symbol: string;
	name: string;
	kind: AssetKind | null;
}

export function emptyPortfolio(): Portfolio {
	return {
		years: DEFAULT_YEARS,
		inflationPercent: DEFAULT_INFLATION_PERCENT,
		holdings: [],
		savings: [],
	};
}

export function newHolding(
	fields: Partial<Holding> & Pick<Holding, "name">,
): Holding {
	return {
		id: crypto.randomUUID(),
		symbol: null,
		kind: null,
		initial: DEFAULT_INITIAL,
		shares: 0,
		quote: null,
		manualValue: null,
		startDate: "",
		monthly: DEFAULT_MONTHLY,
		annualReturnPercent: DEFAULT_RETURN_PERCENT,
		deposits: [],
		nametag: "",
		icon: null,
		returnSource: "manual",
		yearlyReturns: [],
		historyYears: 0,
		...fields,
	};
}

function historyFields(history: PriceHistory): Partial<Holding> {
	const average = averageAnnualReturn(history.points);
	if (average === null) return {};
	return {
		annualReturnPercent: average,
		returnSource: "history",
		yearlyReturns: yearlyReturns(history.points),
		historyYears: historyYears(history.points),
	};
}

/**
 * A holding for a ticker, with its past growth as the expected return. When
 * the market data cannot be reached it still works, with a return the user
 * can type in, so neither the register nor the simulator gets stuck.
 */
export async function holdingFromTicker(
	choice: TickerChoice,
): Promise<Holding> {
	let fields: Partial<Holding> = {};
	try {
		fields = historyFields(await fetchPriceHistory(choice.symbol));
	} catch (cause) {
		if (!(cause instanceof AppError)) throw cause;
	}
	return newHolding({
		symbol: choice.symbol,
		name: choice.name,
		kind: choice.kind,
		...fields,
	});
}

/** What the register is about to create. */
export type NewRecord =
	| { kind: "investment"; ticker: TickerChoice | null }
	| { kind: "savings" };

export type NewSavings = SavingsTerms & { initial: number };

/** The latest price, or null when the market cannot be reached. */
export async function quoteOrNull(symbol: string): Promise<MarketQuote | null> {
	try {
		return await fetchQuote(symbol);
	} catch (cause) {
		if (cause instanceof AppError) return null;
		throw cause;
	}
}

export function newSavingsEntry(
	name: string,
	fields: Partial<NewSavings> = {},
): SavingsEntry {
	const terms = { ...defaultSavingsTerms(), ...fields };
	return {
		id: crypto.randomUUID(),
		name,
		initial: 0,
		monthly: 0,
		annualReturnPercent: terms.contractRatePercent,
		deposits: [],
		nametag: "",
		icon: null,
		...terms,
	};
}

/** Checks what the user already has when they create a record. */
export function checkedStartingAmount(amount: number): number {
	if (!Number.isFinite(amount) || amount < 0) {
		throw new AppError("invalidStartingAmount");
	}
	return roundCents(amount);
}

// Brokers sell fractions of a share, often down to eight decimal places.
function roundShares(shares: number): number {
	return Math.round(shares * SHARE_PRECISION) / SHARE_PRECISION;
}

/** Checks the units of a purchase, which must come from the broker. */
export function checkedShares(shares: number): number {
	const rounded = Number.isFinite(shares) ? roundShares(shares) : 0;
	if (rounded <= 0) throw new AppError("invalidShares");
	return rounded;
}

/** Checks the amount of a first purchase, which cannot be empty or zero. */
export function checkedInvestedAmount(amount: number): number {
	const rounded = Number.isFinite(amount) ? roundCents(amount) : 0;
	if (rounded <= 0) throw new AppError("invalidInvestedAmount");
	return rounded;
}

/** Checks the start date of a new investment, which cannot be left out. */
export function checkedStartDate(date: string, today: string): string {
	if (!date) throw new AppError("startDateMissing");
	if (!DATE_PATTERN.test(date) || date > today) {
		throw new AppError("invalidStartDate");
	}
	return date;
}

/**
 * Checks a position edited by hand. Zero units and no date are fine, so an
 * older record can still change its nametag before they are filled in.
 */
export function checkedPosition(
	position: HoldingPosition,
	today: string,
): HoldingPosition {
	const { initial, shares, manualValue, startDate } = position;
	if (!Number.isFinite(shares) || shares < 0) {
		throw new AppError("invalidShares");
	}
	return {
		startDate: startDate && checkedStartDate(startDate, today),
		initial: checkedStartingAmount(initial),
		shares: roundShares(shares),
		manualValue:
			manualValue === null ? null : checkedStartingAmount(manualValue),
	};
}

function needsShares(entry: Holding | SavingsEntry): entry is Holding {
	return "symbol" in entry && entry.symbol !== null;
}

/** A ticker invested in before units existed, which cannot be valued yet. */
export function isMissingShares(entry: Holding | SavingsEntry): boolean {
	return needsShares(entry) && entry.shares === 0 && entry.initial > 0;
}

/**
 * Adds money to a record, so its value and its history always agree. A ticker
 * also takes the units bought, because the amount alone cannot tell them.
 */
export function applyDeposit(
	entry: Holding | SavingsEntry,
	amount: number,
	date: string,
	shares?: number,
): void {
	const rounded = Number.isFinite(amount) ? roundCents(amount) : 0;
	if (rounded <= 0) throw new AppError("invalidDeposit");
	if (isMissingShares(entry)) throw new AppError("sharesMissing");
	const deposit: Deposit = { id: crypto.randomUUID(), amount: rounded, date };
	if (needsShares(entry)) {
		deposit.shares = checkedShares(shares ?? Number.NaN);
		entry.shares = roundShares(entry.shares + deposit.shares);
	}
	entry.initial = roundCents(entry.initial + rounded);
	entry.deposits.push(deposit);
}

export interface LogEntry {
	id: string;
	/** "start" is what the record began with. */
	kind: "start" | "purchase" | "deposit";
	/** Empty on the start of an older record with no date. */
	date: string;
	amount: number;
	/** Units bought, null when the record has none. */
	shares: number | null;
	/** What each unit really cost, null without units. */
	pricePerShare: number | null;
}

function logLine(
	fields: Pick<LogEntry, "id" | "kind" | "date" | "amount">,
	shares: number | null,
): LogEntry {
	const hasShares = shares !== null && shares > 0;
	return {
		...fields,
		shares: hasShares ? shares : null,
		pricePerShare: hasShares ? roundCents(fields.amount / shares) : null,
	};
}

/** What each deposit left behind, so the start is whatever came before them. */
function startingLine(entry: Holding | SavingsEntry): LogEntry | null {
	const amount = roundCents(
		entry.initial - sumMoney(entry.deposits.map((deposit) => deposit.amount)),
	);
	const bought = entry.deposits.reduce(
		(sum, deposit) => sum + (deposit.shares ?? 0),
		0,
	);
	const shares = "shares" in entry ? roundShares(entry.shares - bought) : null;
	if (amount <= 0 && !shares) return null;
	return logLine(
		{ id: "start", kind: "start", date: entry.startDate, amount },
		shares,
	);
}

/** Every movement of a record, newest first, ending with how it began. */
export function recordLog(entry: Holding | SavingsEntry): LogEntry[] {
	const kind = needsShares(entry) ? "purchase" : "deposit";
	const moves = entry.deposits
		.map((deposit) =>
			logLine(
				{ id: deposit.id, kind, date: deposit.date, amount: deposit.amount },
				deposit.shares ?? null,
			),
		)
		.reverse()
		.sort((a, b) => b.date.localeCompare(a.date));
	const start = startingLine(entry);
	return start ? [...moves, start] : moves;
}

/** What a holding is worth: units at the last price, or what is known. */
export function holdingValue(holding: Holding): number {
	const { symbol, shares, quote, manualValue, initial } = holding;
	if (!symbol) return manualValue ?? initial;
	if (shares <= 0 || !quote) return initial;
	return roundCents(shares * quote.price * quote.rateToEur);
}

export interface InvestmentStats {
	invested: number;
	value: number;
	/** Value minus what was invested, negative on a loss. */
	gain: number;
	/** Gain as a share of what was invested, 0.12 for 12%. */
	gainRate: number;
}

export function investmentStats(holdings: Holding[]): InvestmentStats {
	const invested = sumMoney(holdings.map((holding) => holding.initial));
	const value = sumMoney(holdings.map(holdingValue));
	const gain = roundCents(value - invested);
	return {
		invested,
		value,
		gain,
		gainRate: invested > 0 ? gain / invested : 0,
	};
}

/**
 * What the user put in through purchases and deposits in a period, given as
 * "2026-11" for a month or "2026" for a year. The starting amount stays out,
 * because it can be money the user already had before that period.
 */
export function depositedIn(
	entry: Pick<Holding, "deposits">,
	period: string,
): number {
	return sumMoney(
		entry.deposits
			.filter((deposit) => deposit.date.startsWith(`${period}-`))
			.map((deposit) => deposit.amount),
	);
}

/** Everything registered, in the shape the projection reads. */
export function registeredPlans(
	portfolio: Portfolio,
	today: string,
): HoldingPlan[] {
	// A holding starts from what it is worth, so a gain or loss so far counts.
	const holdings = portfolio.holdings.map((holding) => ({
		id: holding.id,
		initial: holding.initial,
		monthly: holding.monthly,
		annualReturnPercent: holding.annualReturnPercent,
		start: {
			elapsedMonths: 0,
			credited: holdingValue(holding) - holding.initial,
			pending: 0,
		},
	}));
	return [
		...holdings,
		...portfolio.savings.map((entry) => savingsPlan(entry, today)),
	];
}

/** What a record is worth today, with a saving's interest included. */
export function currentValue(
	entry: Holding | SavingsEntry,
	today: string,
): number {
	return "interest" in entry
		? accrueSavings(entry, today).value
		: holdingValue(entry);
}

function savingsPlan(entry: SavingsEntry, today: string): HoldingPlan {
	const { id, initial, monthly, annualReturnPercent, interest } = entry;
	const { elapsedMonths, credited, pending } = accrueSavings(entry, today);
	return {
		id,
		initial,
		monthly,
		annualReturnPercent,
		interest,
		rate: {
			basis: entry.rateBasis,
			path: entry.ratePath,
			stepPercent: entry.rateStepPercent,
			fixedYears: entry.rateFixedYears,
			laterPercent: entry.rateLaterPercent,
		},
		start: { elapsedMonths, credited, pending },
	};
}

export interface RegisteredTotals {
	/** What everything registered is worth today, with interest. */
	value: number;
	/** What was really added this month, which the budget counts as savings. */
	depositedThisMonth: number;
	/** What was really added this calendar year, up to today. */
	depositedThisYear: number;
}

export function registeredTotals(
	portfolio: Portfolio,
	today: string,
): RegisteredTotals {
	const entries = [...portfolio.holdings, ...portfolio.savings];
	const month = today.slice(0, 7);
	return {
		value: sumMoney(entries.map((entry) => currentValue(entry, today))),
		depositedThisMonth: sumMoney(
			entries.map((entry) => depositedIn(entry, month)),
		),
		depositedThisYear: sumMoney(
			entries.map((entry) => depositedIn(entry, today.slice(0, 4))),
		),
	};
}

function parseDeposits(value: unknown): Deposit[] {
	if (!Array.isArray(value)) return [];
	return value.filter(
		(entry): entry is Deposit =>
			isRecord(entry) &&
			typeof entry.id === "string" &&
			numberOr(entry.amount, 0) > 0 &&
			typeof entry.date === "string" &&
			DATE_PATTERN.test(entry.date) &&
			(entry.shares === undefined || numberOr(entry.shares, 0) > 0),
	);
}

function parseQuoteField(value: unknown): MarketQuote | null {
	if (!isRecord(value) || typeof value.currency !== "string") return null;
	const price = numberOr(value.price, 0);
	const rateToEur = numberOr(value.rateToEur, 0);
	const time = numberOr(value.time, 0);
	if (price <= 0 || rateToEur <= 0 || time <= 0) return null;
	return { price, currency: value.currency, rateToEur, time };
}

function parseManualValue(value: unknown): number | null {
	return typeof value === "number" && Number.isFinite(value) && value >= 0
		? value
		: null;
}

function parseRecordIcon(value: unknown): RecordIcon | null {
	return RECORD_ICONS.includes(value as RecordIcon)
		? (value as RecordIcon)
		: null;
}

function parseNametag(value: unknown): string {
	return typeof value === "string" ? value : "";
}

function parseFixedYears(value: unknown): number {
	const years = numberOr(value, DEFAULT_RATE_FIXED_YEARS);
	return Number.isInteger(years) && years >= 0 && years <= MAX_YEARS
		? years
		: DEFAULT_RATE_FIXED_YEARS;
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
		shares: Math.max(numberOr(value.shares, 0), 0),
		quote: parseQuoteField(value.quote),
		manualValue: parseManualValue(value.manualValue),
		startDate:
			typeof value.startDate === "string" && DATE_PATTERN.test(value.startDate)
				? value.startDate
				: "",
		monthly: Math.max(numberOr(value.monthly, 0), 0),
		annualReturnPercent: numberOr(
			value.annualReturnPercent,
			DEFAULT_RETURN_PERCENT,
		),
		deposits: parseDeposits(value.deposits),
		nametag: parseNametag(value.nametag),
		icon: parseRecordIcon(value.icon),
		returnSource: value.returnSource === "history" ? "history" : "manual",
		yearlyReturns: parseYearReturns(value.yearlyReturns),
		historyYears: Math.max(numberOr(value.historyYears, 0), 0),
	};
}

export interface SavingsTypeShare {
	type: SavingsType;
	amount: number;
}

export interface SavingsStats {
	total: number;
	/** Interest earned up to today, after tax. */
	interestEarned: number;
	/** Everything added after the record was created. */
	added: number;
	addedThisMonth: number;
	depositCount: number;
	/** The day of the latest deposit, null when there was none. */
	lastDepositDate: string | null;
	/** What is saved in each type, largest first. */
	byType: SavingsTypeShare[];
}

function savedByType(
	entries: SavingsEntry[],
	today: string,
): SavingsTypeShare[] {
	return SAVINGS_TYPES.map((type) => ({
		type,
		amount: sumMoney(
			entries
				.filter((entry) => entry.type === type)
				.map((entry) => currentValue(entry, today)),
		),
	}))
		.filter((share) => share.amount > 0)
		.sort((a, b) => b.amount - a.amount);
}

/** What is saved today, what was added and the interest earned so far. */
export function savingsStats(
	entries: SavingsEntry[],
	today: string,
): SavingsStats {
	const month = today.slice(0, 7);
	const accruals = entries.map((entry) => accrueSavings(entry, today));
	const deposits = entries.flatMap((entry) => entry.deposits);
	const dates = deposits.map((deposit) => deposit.date).sort();
	return {
		total: sumMoney(accruals.map((accrual) => accrual.value)),
		interestEarned: sumMoney(accruals.map((accrual) => accrual.interest)),
		added: sumMoney(deposits.map((deposit) => deposit.amount)),
		addedThisMonth: sumMoney(entries.map((entry) => depositedIn(entry, month))),
		depositCount: deposits.length,
		lastDepositDate: dates.at(-1) ?? null,
		byType: savedByType(entries, today),
	};
}

// Before interest had its own field, "compound interest" was a type of saving.
function parseSavingsType(value: unknown): SavingsType {
	if (value === "compoundInterest") return "savingsAccount";
	return SAVINGS_TYPES.includes(value as SavingsType)
		? (value as SavingsType)
		: "other";
}

function parseInterestKind(value: unknown): InterestKind {
	return INTEREST_KINDS.includes(value as InterestKind)
		? (value as InterestKind)
		: DEFAULT_INTEREST_KIND;
}

function parseSavingsEntry(value: unknown): SavingsEntry | null {
	if (!isRecord(value) || typeof value.id !== "string") return null;
	if (typeof value.name !== "string") return null;
	return {
		id: value.id,
		name: value.name,
		type: parseSavingsType(value.type),
		interest: parseInterestKind(value.interest),
		initial: Math.max(numberOr(value.initial, 0), 0),
		monthly: Math.max(numberOr(value.monthly, 0), 0),
		annualReturnPercent: numberOr(
			value.annualReturnPercent,
			DEFAULT_SAVINGS_RETURN_PERCENT,
		),
		contractRatePercent: numberOr(
			value.contractRatePercent,
			numberOr(value.annualReturnPercent, DEFAULT_SAVINGS_RETURN_PERCENT),
		),
		startDate:
			typeof value.startDate === "string" && DATE_PATTERN.test(value.startDate)
				? value.startDate
				: "",
		rateBasis: RATE_BASES.includes(value.rateBasis as RateBasis)
			? (value.rateBasis as RateBasis)
			: "tanb",
		ratePath: RATE_PATHS.includes(value.ratePath as RatePath)
			? (value.ratePath as RatePath)
			: "fixed",
		rateStepPercent: numberOr(value.rateStepPercent, DEFAULT_RATE_STEP_PERCENT),
		rateFixedYears: parseFixedYears(value.rateFixedYears),
		rateLaterPercent: numberOr(
			value.rateLaterPercent,
			numberOr(value.annualReturnPercent, DEFAULT_SAVINGS_RETURN_PERCENT),
		),
		deposits: parseDeposits(value.deposits),
		nametag: parseNametag(value.nametag),
		icon: parseRecordIcon(value.icon),
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
	const savings = Array.isArray(value.savings)
		? value.savings.flatMap((entry) => parseSavingsEntry(entry) ?? [])
		: [];
	return {
		years:
			Number.isInteger(years) && years >= 1 && years <= MAX_YEARS
				? years
				: empty.years,
		inflationPercent: numberOr(value.inflationPercent, empty.inflationPercent),
		holdings: holdings.slice(0, MAX_HOLDINGS),
		savings: savings.slice(0, MAX_SAVINGS),
	};
}

export async function loadPortfolio(): Promise<Portfolio> {
	return parsePortfolio(await loadUserField("portfolio", "portfolioNotLoaded"));
}

export async function savePortfolio(portfolio: Portfolio): Promise<void> {
	await saveUserField("portfolio", portfolio, "portfolioNotSaved");
}
