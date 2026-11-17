import { AppError } from "./errors";
import { percentToRate, roundCents } from "./money";

export const MAX_YEARS = 50;
/** The flat rate Portugal charges on investment gains when they are sold. */
export const CAPITAL_GAINS_TAX = 0.28;
/** How far the pessimistic and optimistic scenarios move the yearly return. */
export const SCENARIO_SPREAD_PERCENT = 3;

const MONTHS_PER_YEAR = 12;
// A return of -100% or worse would mean losing more than everything.
const LOWEST_RETURN_PERCENT = -99;

export interface HoldingPlan {
	id: string;
	initial: number;
	monthly: number;
	/** Expected yearly return in percent, such as 7.5. */
	annualReturnPercent: number;
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
		if (!isRate(plan.annualReturnPercent)) {
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

// Contributions land at the end of each month, so the first one starts to
// grow the month after. Amounts stay unrounded here and are rounded once at
// the end, so cents do not drift over hundreds of months.
function simulateHolding(
	plan: HoldingPlan,
	settings: ProjectionSettings,
): HoldingPath {
	const growth = 1 + monthlyRate(plan.annualReturnPercent);
	const inflation = 1 + percentToRate(settings.inflationPercent);
	let value = plan.initial;
	let invested = plan.initial;
	let investedToday = plan.initial;
	const values = [value];
	const investedByYear = [invested];
	for (let month = 1; month <= settings.years * MONTHS_PER_YEAR; month++) {
		value = value * growth + plan.monthly;
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
	const tax = roundCents(Math.max(gain, 0) * CAPITAL_GAINS_TAX);
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
