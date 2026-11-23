import { roundCents } from "./money";
import type { SavingsEntry } from "./portfolio";
import {
	monthsBetweenCredits,
	percentInYear,
	type RateTerms,
	rateEquivalents,
} from "./projection";

const DAYS_PER_YEAR = 365;
const MONTHS_PER_YEAR = 12;
const MS_PER_DAY = 86_400_000;

export interface SavingsAccrual {
	/** What the user put in, with no interest. */
	deposited: number;
	/** Interest earned up to today, after tax. */
	interest: number;
	value: number;
	elapsedMonths: number;
	/** Interest already joined to the balance, not rounded. */
	credited: number;
	/** Interest earned but not credited yet, not rounded. */
	pending: number;
}

function dayNumber(key: string): number {
	const [year, month, day] = key.split("-").map(Number);
	return Date.UTC(year, month - 1, day) / MS_PER_DAY;
}

/** The same day some months later, or that month's last day if shorter. */
function addMonths(key: string, months: number): string {
	const [year, month, day] = key.split("-").map(Number);
	const lastDay = new Date(
		Date.UTC(year, month - 1 + months + 1, 0),
	).getUTCDate();
	return new Date(Date.UTC(year, month - 1 + months, Math.min(day, lastDay)))
		.toISOString()
		.slice(0, 10);
}

function wholeMonthsBetween(start: string, end: string): number {
	const [startYear, startMonth] = start.split("-").map(Number);
	const [endYear, endMonth] = end.split("-").map(Number);
	const months =
		(endYear - startYear) * MONTHS_PER_YEAR + endMonth - startMonth;
	return addMonths(start, months) > end ? months - 1 : months;
}

function everyMonths(start: string, step: number, elapsed: number): string[] {
	const dates: string[] = [];
	for (let months = step; months <= elapsed; months += step) {
		dates.push(addMonths(start, months));
	}
	return dates;
}

function rateTerms(entry: SavingsEntry): RateTerms {
	return {
		basis: entry.rateBasis,
		path: entry.ratePath,
		stepPercent: entry.rateStepPercent,
		fixedYears: entry.rateFixedYears,
		laterPercent: entry.rateLaterPercent,
	};
}

function netYearlyRate(
	entry: SavingsEntry,
	start: string,
	day: string,
): number {
	const year = Math.floor(wholeMonthsBetween(start, day) / MONTHS_PER_YEAR);
	const terms = rateTerms(entry);
	const quoted = percentInYear(entry.contractRatePercent, terms, year);
	return rateEquivalents(quoted, terms.basis, entry.interest).tanl / 100;
}

/**
 * What a saving is worth today. Interest builds up day by day on the balance,
 * after tax, and joins it on each credit date. Each deposit starts earning
 * from its own day, and the value already includes every deposit.
 */
export function accrueSavings(
	entry: SavingsEntry,
	today: string,
): SavingsAccrual {
	const noInterest = {
		deposited: entry.initial,
		interest: 0,
		value: entry.initial,
		elapsedMonths: 0,
		credited: 0,
		pending: 0,
	};
	const { startDate } = entry;
	if (!startDate || startDate >= today) return noInterest;

	const later = entry.deposits.filter((deposit) => deposit.date > startDate);
	const elapsedMonths = wholeMonthsBetween(startDate, today);
	const creditEvery = monthsBetweenCredits(entry.interest);
	const creditDates = new Set(
		creditEvery ? everyMonths(startDate, creditEvery, elapsedMonths) : [],
	);
	const stops = [
		...new Set([
			...later.map((deposit) => deposit.date),
			...creditDates,
			...everyMonths(startDate, MONTHS_PER_YEAR, elapsedMonths),
			today,
		]),
	]
		.filter((day) => day <= today)
		.sort();

	let balance =
		entry.initial - later.reduce((sum, deposit) => sum + deposit.amount, 0);
	let credited = 0;
	let pending = 0;
	let cursor = startDate;
	for (const stop of stops) {
		const days = dayNumber(stop) - dayNumber(cursor);
		pending +=
			(balance * netYearlyRate(entry, startDate, cursor) * days) /
			DAYS_PER_YEAR;
		balance += later
			.filter((deposit) => deposit.date === stop)
			.reduce((sum, deposit) => sum + deposit.amount, 0);
		if (creditDates.has(stop)) {
			balance += pending;
			credited += pending;
			pending = 0;
		}
		cursor = stop;
	}
	const value = roundCents(Math.max(balance + pending, 0));
	return {
		deposited: entry.initial,
		interest: roundCents(value - entry.initial),
		value,
		elapsedMonths,
		credited,
		pending,
	};
}
