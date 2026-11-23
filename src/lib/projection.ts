import { AppError } from "./errors";
import { percentToRate, roundCents } from "./money";

export const MAX_YEARS = 50;
/** The flat rate Portugal charges on investment gains when they are sold. */
export const CAPITAL_GAINS_TAX = 0.28;
/** How far the pessimistic and optimistic scenarios move the yearly return. */
export const SCENARIO_SPREAD_PERCENT = 3;

export const INTEREST_KINDS = [
	"simple",
	"compoundMonthly",
	"compoundQuarterly",
	"compoundSemiannual",
	"compoundYearly",
] as const;
export type InterestKind = (typeof INTEREST_KINDS)[number];

/** How the rate is quoted: before tax, after tax, or with compounding included. */
export const RATE_BASES = ["tanb", "tanl", "tae"] as const;
export type RateBasis = (typeof RATE_BASES)[number];

/** How the rate moves over the years. */
export const RATE_PATHS = ["fixed", "variable", "stepped", "mixed"] as const;
export type RatePath = (typeof RATE_PATHS)[number];

export interface RateTerms {
	basis: RateBasis;
	path: RatePath;
	/** Points the rate rises each year on a stepped rate. */
	stepPercent: number;
	/** Years at the first rate on a mixed rate. */
	fixedYears: number;
	/** The rate after those years on a mixed rate. */
	laterPercent: number;
}

const MONTHS_PER_YEAR = 12;
const MONTHS_BETWEEN_CREDITS: Record<
	Exclude<InterestKind, "simple">,
	number
> = {
	compoundMonthly: 1,
	compoundQuarterly: 3,
	compoundSemiannual: 6,
	compoundYearly: 12,
};
// A return of -100% or worse would mean losing more than everything.
const LOWEST_RETURN_PERCENT = -99;

export interface HoldingPlan {
	id: string;
	initial: number;
	monthly: number;
	/** Expected yearly return in percent, such as 7.5. */
	annualReturnPercent: number;
	/**
	 * How a saving pays its yearly rate. Without it the return is a market
	 * growth that builds up smoothly over the year.
	 */
	interest?: InterestKind;
	/** How a saving's rate is quoted and how it moves. */
	rate?: RateTerms;
	/** Where a saving already stands, with interest earned before today. */
	start?: SavingsStart;
}

export interface SavingsStart {
	/** Whole months since the saving began, so rates and credits stay in step. */
	elapsedMonths: number;
	/** Interest already joined to the balance. */
	credited: number;
	/** Interest earned but not credited yet. */
	pending: number;
}

export interface ProjectionSettings {
	years: number;
	/** Expected yearly inflation in percent, such as 2. */
	inflationPercent: number;
}

export interface YearPoint {
	year: number;
	invested: number;
	value: number;
	/** The value in today's money, with inflation taken out. */
	realValue: number;
}

export interface HoldingResult {
	id: string;
	invested: number;
	value: number;
	gain: number;
}

export interface Projection {
	timeline: YearPoint[];
	holdings: HoldingResult[];
	invested: number;
	value: number;
	gain: number;
	/** Gain as a share of what was invested, 0.5 for 50%. */
	gainRate: number;
	/** Yearly return of the whole portfolio, weighted by what goes in. */
	averageReturnPercent: number;
	realValue: number;
	/** What the money put in is worth in today's money. */
	investedToday: number;
	/** How much buying power grew once inflation is taken out. */
	realGain: number;
	/** How much of the final value inflation eats. */
	inflationCost: number;
	tax: number;
	netGain: number;
}

export interface Scenarios {
	pessimistic: number;
	expected: number;
	optimistic: number;
}

function isAmount(value: number): boolean {
	return Number.isFinite(value) && value >= 0;
}

function isRate(percent: number): boolean {
	return Number.isFinite(percent) && percent > -100;
}

function hasValidTerms(rate: RateTerms | undefined): boolean {
	if (!rate) return true;
	return (
		Number.isFinite(rate.stepPercent) &&
		Number.isInteger(rate.fixedYears) &&
		rate.fixedYears >= 0 &&
		isRate(rate.laterPercent)
	);
}

function validate(plans: HoldingPlan[], settings: ProjectionSettings): void {
	const { years, inflationPercent } = settings;
	if (!Number.isInteger(years) || years < 1 || years > MAX_YEARS) {
		throw new AppError("invalidYears");
	}
	if (!isRate(inflationPercent)) {
		throw new AppError("invalidInflation");
	}
	for (const plan of plans) {
		if (!isAmount(plan.initial) || !isAmount(plan.monthly)) {
			throw new AppError("invalidAmount");
		}
		if (!isRate(plan.annualReturnPercent) || !hasValidTerms(plan.rate)) {
			throw new AppError("invalidReturn");
		}
	}
}

function monthlyRate(annualPercent: number): number {
	return (1 + percentToRate(annualPercent)) ** (1 / MONTHS_PER_YEAR) - 1;
}

interface HoldingPath {
	/** Value and amount invested at the end of each year, from year 0. */
	values: number[];
	invested: number[];
	finalValue: number;
	finalInvested: number;
	investedToday: number;
}

function marketGrowth(plan: HoldingPlan): () => number {
	const growth = 1 + monthlyRate(plan.annualReturnPercent);
	let value = plan.initial;
	return () => {
		value = value * growth + plan.monthly;
		return value;
	};
}

export interface RateEquivalents {
	tanb: number;
	tanl: number;
	tae: number;
}

function creditsPerYear(kind: Exclude<InterestKind, "simple">): number {
	return MONTHS_PER_YEAR / MONTHS_BETWEEN_CREDITS[kind];
}

function grossNominalPercent(
	percent: number,
	basis: RateBasis,
	kind: InterestKind,
): number {
	if (basis === "tanb") return percent;
	if (basis === "tanl") return percent / (1 - CAPITAL_GAINS_TAX);
	if (kind === "simple") return percent;
	const credits = creditsPerYear(kind);
	return credits * ((1 + percentToRate(percent)) ** (1 / credits) - 1) * 100;
}

/** The same rate written as TANB, TANL and TAE, all in percent. */
export function rateEquivalents(
	percent: number,
	basis: RateBasis,
	kind: InterestKind,
): RateEquivalents {
	const tanb = grossNominalPercent(percent, basis, kind);
	const tae =
		kind === "simple"
			? tanb
			: ((1 + percentToRate(tanb) / creditsPerYear(kind)) **
					creditsPerYear(kind) -
					1) *
				100;
	return { tanb, tanl: tanb * (1 - CAPITAL_GAINS_TAX), tae };
}

/** How many months pass between credits, null for simple interest. */
export function monthsBetweenCredits(kind: InterestKind): number | null {
	return kind === "simple" ? null : MONTHS_BETWEEN_CREDITS[kind];
}

/** The quoted rate in a given year since the start, counted from zero. */
export function percentInYear(
	first: number,
	rate: RateTerms | undefined,
	year: number,
): number {
	if (rate?.path === "stepped") {
		return Math.max(first + rate.stepPercent * year, LOWEST_RETURN_PERCENT);
	}
	if (rate?.path === "mixed" && year >= rate.fixedYears) {
		return rate.laterPercent;
	}
	return first;
}

// Interest builds up every month on the balance and only joins it on the days
// it is credited, so only then does it start earning interest of its own.
// Simple interest is never credited, so it never earns any.
function interestGrowth(
	plan: HoldingPlan,
	kind: InterestKind,
): (month: number) => number {
	const elapsed = plan.start?.elapsedMonths ?? 0;
	const monthlyInterest = (month: number) => {
		const year = Math.floor((month + elapsed - 1) / MONTHS_PER_YEAR);
		const percent = percentInYear(plan.annualReturnPercent, plan.rate, year);
		const net = plan.rate
			? rateEquivalents(percent, plan.rate.basis, kind).tanl
			: percent;
		return percentToRate(net) / MONTHS_PER_YEAR;
	};
	const creditEvery = monthsBetweenCredits(kind);
	let balance = plan.initial + (plan.start?.credited ?? 0);
	let accrued = plan.start?.pending ?? 0;
	return (month) => {
		accrued += balance * monthlyInterest(month);
		balance += plan.monthly;
		if (creditEvery && (month + elapsed) % creditEvery === 0) {
			balance += accrued;
			accrued = 0;
		}
		return Math.max(balance + accrued, 0);
	};
}

// Contributions land at the end of each month, so the first one starts to
// grow the month after. Amounts stay unrounded here and are rounded once at
// the end, so cents do not drift over hundreds of months.
function simulateHolding(
	plan: HoldingPlan,
	settings: ProjectionSettings,
): HoldingPath {
	const grow = plan.interest
		? interestGrowth(plan, plan.interest)
		: marketGrowth(plan);
	const inflation = 1 + percentToRate(settings.inflationPercent);
	let value =
		plan.initial + (plan.start?.credited ?? 0) + (plan.start?.pending ?? 0);
	let invested = plan.initial;
	let investedToday = plan.initial;
	const values = [value];
	const investedByYear = [invested];
	for (let month = 1; month <= settings.years * MONTHS_PER_YEAR; month++) {
		value = grow(month);
		invested += plan.monthly;
		investedToday += plan.monthly / inflation ** (month / MONTHS_PER_YEAR);
		if (month % MONTHS_PER_YEAR === 0) {
			values.push(value);
			investedByYear.push(invested);
		}
	}
	return {
		values,
		invested: investedByYear,
		finalValue: value,
		finalInvested: invested,
		investedToday,
	};
}

function sumAt(paths: HoldingPath[], key: "values" | "invested", year: number) {
	return paths.reduce((sum, path) => sum + path[key][year], 0);
}

function buildTimeline(
	paths: HoldingPath[],
	settings: ProjectionSettings,
): YearPoint[] {
	const inflation = 1 + percentToRate(settings.inflationPercent);
	return Array.from({ length: settings.years + 1 }, (_, year) => {
		const value = sumAt(paths, "values", year);
		return {
			year,
			invested: roundCents(sumAt(paths, "invested", year)),
			value: roundCents(value),
			realValue: roundCents(value / inflation ** year),
		};
	});
}

function weightedReturn(plans: HoldingPlan[], paths: HoldingPath[]): number {
	const totalInvested = paths.reduce(
		(sum, path) => sum + path.finalInvested,
		0,
	);
	if (totalInvested === 0) return 0;
	const weighted = plans.reduce(
		(sum, plan, index) =>
			sum + plan.annualReturnPercent * paths[index].finalInvested,
		0,
	);
	return weighted / totalInvested;
}

export function projectPortfolio(
	plans: HoldingPlan[],
	settings: ProjectionSettings,
): Projection {
	validate(plans, settings);
	const paths = plans.map((plan) => simulateHolding(plan, settings));
	const timeline = buildTimeline(paths, settings);
	const end = timeline[settings.years];
	const gain = roundCents(end.value - end.invested);
	const investedToday = roundCents(
		paths.reduce((sum, path) => sum + path.investedToday, 0),
	);
	// Savings grow on their rate after tax, because the bank withholds it when
	// it pays the interest. Only market gains are still taxed on selling.
	const marketGain = plans.reduce(
		(sum, plan, index) =>
			plan.interest
				? sum
				: sum + paths[index].finalValue - paths[index].finalInvested,
		0,
	);
	const tax = roundCents(Math.max(marketGain, 0) * CAPITAL_GAINS_TAX);
	return {
		timeline,
		holdings: plans.map((plan, index) => {
			const invested = roundCents(paths[index].finalInvested);
			const value = roundCents(paths[index].finalValue);
			return {
				id: plan.id,
				invested,
				value,
				gain: roundCents(value - invested),
			};
		}),
		invested: end.invested,
		value: end.value,
		gain,
		gainRate: end.invested > 0 ? gain / end.invested : 0,
		averageReturnPercent: weightedReturn(plans, paths),
		realValue: end.realValue,
		investedToday,
		realGain: roundCents(end.realValue - investedToday),
		inflationCost: roundCents(end.value - end.realValue),
		tax,
		netGain: roundCents(gain - tax),
	};
}

function shiftReturns(plans: HoldingPlan[], shift: number): HoldingPlan[] {
	return plans.map((plan) => ({
		...plan,
		annualReturnPercent: Math.max(
			plan.annualReturnPercent + shift,
			LOWEST_RETURN_PERCENT,
		),
		rate: plan.rate && {
			...plan.rate,
			laterPercent: Math.max(
				plan.rate.laterPercent + shift,
				LOWEST_RETURN_PERCENT,
			),
		},
	}));
}

/** Final values if every return comes in a few points lower or higher. */
export function projectScenarios(
	plans: HoldingPlan[],
	settings: ProjectionSettings,
): Scenarios {
	const finalValue = (shift: number) =>
		projectPortfolio(shiftReturns(plans, shift), settings).value;
	return {
		pessimistic: finalValue(-SCENARIO_SPREAD_PERCENT),
		expected: finalValue(0),
		optimistic: finalValue(SCENARIO_SPREAD_PERCENT),
	};
}
