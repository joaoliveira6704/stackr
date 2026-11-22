import { describe, expect, it } from "vitest";
import { AppError } from "./errors";
import {
	CAPITAL_GAINS_TAX,
	type HoldingPlan,
	INTEREST_KINDS,
	type InterestKind,
	MAX_YEARS,
	projectPortfolio,
	projectScenarios,
	type RateTerms,
	rateEquivalents,
} from "./projection";

function plan(fields: Partial<HoldingPlan> = {}): HoldingPlan {
	return {
		id: "a",
		initial: 1000,
		monthly: 0,
		annualReturnPercent: 0,
		...fields,
	};
}

const NO_INFLATION = { years: 1, inflationPercent: 0 };

function errorCodeOf(run: () => unknown): string | undefined {
	try {
		run();
	} catch (cause) {
		return cause instanceof AppError ? cause.code : "not an AppError";
	}
	return undefined;
}

describe("projectPortfolio", () => {
	it("keeps the money as it is with no return and no inflation", () => {
		const result = projectPortfolio([plan()], NO_INFLATION);

		expect(result.value).toBe(1000);
		expect(result.invested).toBe(1000);
		expect(result.gain).toBe(0);
	});

	it("grows a starting amount by exactly the yearly return in one year", () => {
		const result = projectPortfolio(
			[plan({ annualReturnPercent: 12 })],
			NO_INFLATION,
		);

		expect(result.value).toBe(1120);
		expect(result.gain).toBe(120);
		expect(result.gainRate).toBeCloseTo(0.12);
	});

	it("compounds the return over many years", () => {
		const result = projectPortfolio([plan({ annualReturnPercent: 7 })], {
			years: 10,
			inflationPercent: 0,
		});

		// 1000 × 1.07^10
		expect(result.value).toBe(1967.15);
	});

	it("adds the monthly contributions to what is invested", () => {
		const result = projectPortfolio([plan({ initial: 0, monthly: 100 })], {
			years: 2,
			inflationPercent: 0,
		});

		expect(result.invested).toBe(2400);
		expect(result.value).toBe(2400);
	});

	it("lets monthly contributions grow from the month after they go in", () => {
		const result = projectPortfolio(
			[plan({ initial: 0, monthly: 100, annualReturnPercent: 12 })],
			NO_INFLATION,
		);

		expect(result.invested).toBe(1200);
		expect(result.value).toBeGreaterThan(1200);
		expect(result.value).toBeLessThan(1200 * 1.12);
	});

	it("gives a point for every year from zero to the last", () => {
		const result = projectPortfolio([plan({ monthly: 50 })], {
			years: 5,
			inflationPercent: 0,
		});

		expect(result.timeline.map((point) => point.year)).toEqual([
			0, 1, 2, 3, 4, 5,
		]);
		expect(result.timeline[0]).toEqual({
			year: 0,
			invested: 1000,
			value: 1000,
			realValue: 1000,
		});
		expect(result.timeline[5].invested).toBe(4000);
	});

	it("takes inflation out of the final value in today's money", () => {
		const result = projectPortfolio([plan()], {
			years: 1,
			inflationPercent: 2,
		});

		expect(result.realValue).toBe(980.39);
		expect(result.inflationCost).toBe(19.61);
	});

	it("shows a loss of buying power when the return is below inflation", () => {
		const result = projectPortfolio([plan({ annualReturnPercent: 1 })], {
			years: 10,
			inflationPercent: 3,
		});

		expect(result.gain).toBeGreaterThan(0);
		expect(result.realGain).toBeLessThan(0);
	});

	it("counts a gain in buying power when the return beats inflation", () => {
		const result = projectPortfolio([plan({ annualReturnPercent: 8 })], {
			years: 10,
			inflationPercent: 2,
		});

		expect(result.realGain).toBeGreaterThan(0);
	});

	it("handles negative returns as a loss", () => {
		const result = projectPortfolio(
			[plan({ annualReturnPercent: -10 })],
			NO_INFLATION,
		);

		expect(result.value).toBe(900);
		expect(result.gain).toBe(-100);
	});

	it("charges the gains tax only on a gain", () => {
		const gain = projectPortfolio(
			[plan({ annualReturnPercent: 10 })],
			NO_INFLATION,
		);
		const loss = projectPortfolio(
			[plan({ annualReturnPercent: -10 })],
			NO_INFLATION,
		);

		// The 28% rate on a 100 gain, rounded to cents.
		expect(CAPITAL_GAINS_TAX).toBe(0.28);
		expect(gain.tax).toBe(28);
		expect(gain.netGain).toBe(72);
		expect(loss.tax).toBe(0);
		expect(loss.netGain).toBe(-100);
	});

	it("adds up several holdings and keeps each one's own result", () => {
		const result = projectPortfolio(
			[
				plan({ id: "a", annualReturnPercent: 10 }),
				plan({ id: "b", initial: 500 }),
			],
			NO_INFLATION,
		);

		expect(result.holdings).toEqual([
			{ id: "a", invested: 1000, value: 1100, gain: 100 },
			{ id: "b", invested: 500, value: 500, gain: 0 },
		]);
		expect(result.value).toBe(1600);
	});

	it("weights the average return by how much goes into each holding", () => {
		const result = projectPortfolio(
			[
				plan({ id: "a", initial: 3000, annualReturnPercent: 8 }),
				plan({ id: "b", initial: 1000, annualReturnPercent: 0 }),
			],
			NO_INFLATION,
		);

		expect(result.averageReturnPercent).toBe(6);
	});

	it("returns zeros for an empty portfolio instead of dividing by zero", () => {
		const result = projectPortfolio([], NO_INFLATION);

		expect(result.value).toBe(0);
		expect(result.gainRate).toBe(0);
		expect(result.averageReturnPercent).toBe(0);
	});

	it("returns zeros when every amount is zero", () => {
		const result = projectPortfolio(
			[plan({ initial: 0, monthly: 0, annualReturnPercent: 10 })],
			NO_INFLATION,
		);

		expect(result.value).toBe(0);
		expect(result.gain).toBe(0);
	});

	it("rounds every amount to whole cents", () => {
		const result = projectPortfolio(
			[plan({ initial: 333.33, monthly: 33.33, annualReturnPercent: 6.7 })],
			{ years: 7, inflationPercent: 2.3 },
		);
		const amounts = [
			result.value,
			result.realValue,
			result.gain,
			result.tax,
			...result.timeline.flatMap((point) => [
				point.value,
				point.invested,
				point.realValue,
			]),
		];

		for (const amount of amounts) {
			expect(Math.round(amount * 100) / 100).toBe(amount);
		}
	});

	it("stays finite and rounded with very large amounts over 50 years", () => {
		const result = projectPortfolio(
			[
				plan({
					initial: 1_000_000_000,
					monthly: 10_000_000,
					annualReturnPercent: 15,
				}),
			],
			{ years: MAX_YEARS, inflationPercent: 2 },
		);

		expect(Number.isFinite(result.value)).toBe(true);
		expect(result.value).toBeGreaterThan(result.invested);
		expect(Math.round(result.value * 100) / 100).toBe(result.value);
	});

	it("refuses a negative amount", () => {
		expect(
			errorCodeOf(() =>
				projectPortfolio([plan({ initial: -1 })], NO_INFLATION),
			),
		).toBe("invalidAmount");
		expect(
			errorCodeOf(() =>
				projectPortfolio([plan({ monthly: -5 })], NO_INFLATION),
			),
		).toBe("invalidAmount");
	});

	it("refuses an empty field, which arrives as NaN", () => {
		expect(
			errorCodeOf(() =>
				projectPortfolio([plan({ initial: Number.NaN })], NO_INFLATION),
			),
		).toBe("invalidAmount");
	});

	it("refuses a return of -100% or worse", () => {
		expect(
			errorCodeOf(() =>
				projectPortfolio([plan({ annualReturnPercent: -100 })], NO_INFLATION),
			),
		).toBe("invalidReturn");
	});

	it("refuses a period outside 1 to 50 whole years", () => {
		for (const years of [0, 51, 2.5]) {
			expect(
				errorCodeOf(() =>
					projectPortfolio([plan()], { years, inflationPercent: 0 }),
				),
			).toBe("invalidYears");
		}
	});

	it("refuses an inflation of -100% or worse", () => {
		expect(
			errorCodeOf(() =>
				projectPortfolio([plan()], { years: 1, inflationPercent: -100 }),
			),
		).toBe("invalidInflation");
	});
});

describe("projectScenarios", () => {
	it("moves every return three points down and up", () => {
		const scenarios = projectScenarios(
			[plan({ annualReturnPercent: 5 })],
			NO_INFLATION,
		);

		expect(scenarios).toEqual({
			pessimistic: 1020,
			expected: 1050,
			optimistic: 1080,
		});
	});

	it("never pushes a return to -100% or below in the pessimistic case", () => {
		const scenarios = projectScenarios(
			[plan({ annualReturnPercent: -98 })],
			NO_INFLATION,
		);

		expect(scenarios.pessimistic).toBe(10);
	});
});

describe("types of interest", () => {
	const saving = (interest: InterestKind, fields = {}) => ({
		id: "s",
		initial: 1000,
		monthly: 0,
		annualReturnPercent: 12,
		interest,
		...fields,
	});
	const valueAfter = (plan: HoldingPlan, years: number) =>
		projectPortfolio([plan], { years, inflationPercent: 0 }).value;

	it("never pays interest on interest with simple interest", () => {
		expect(valueAfter(saving("simple"), 2)).toBe(1240);
	});

	it("credits yearly interest once a year", () => {
		expect(valueAfter(saving("compoundYearly"), 2)).toBe(1254.4);
	});

	it("credits semiannual interest twice a year", () => {
		expect(valueAfter(saving("compoundSemiannual"), 1)).toBe(1123.6);
	});

	it("credits quarterly interest four times a year", () => {
		expect(valueAfter(saving("compoundQuarterly"), 1)).toBe(1125.51);
	});

	it("credits monthly interest twelve times a year", () => {
		expect(valueAfter(saving("compoundMonthly"), 1)).toBe(1126.83);
	});

	it("earns more the more often interest is credited", () => {
		const values = [...INTEREST_KINDS].map((kind) =>
			valueAfter(saving(kind), 10),
		);

		expect(values[0]).toBeLessThan(values[4]);
		expect(values[4]).toBeLessThan(values[3]);
		expect(values[3]).toBeLessThan(values[2]);
		expect(values[2]).toBeLessThan(values[1]);
	});

	it("earns simple interest on each contribution from the month after", () => {
		const plan = saving("simple", { initial: 0, monthly: 100 });

		// 100 x 12 in, and 66 of interest: 1% on 100, 200 and so on up to 1100.
		expect(valueAfter(plan, 1)).toBe(1266);
	});

	it("keeps the money when the rate is zero", () => {
		expect(
			valueAfter(saving("compoundMonthly", { annualReturnPercent: 0 }), 5),
		).toBe(1000);
	});

	it("never goes below zero with a large negative simple rate", () => {
		expect(valueAfter(saving("simple", { annualReturnPercent: -99 }), 5)).toBe(
			0,
		);
	});

	it("handles large balances", () => {
		expect(valueAfter(saving("simple", { initial: 10_000_000 }), 1)).toBe(
			11_200_000,
		);
	});
});

describe("rateEquivalents", () => {
	it("takes 28% of tax from a TANB to get the TANL", () => {
		expect(rateEquivalents(2.5, "tanb", "simple").tanl).toBeCloseTo(1.8, 10);
	});

	it("adds the tax back to a TANL to get the TANB", () => {
		expect(rateEquivalents(1.8, "tanl", "simple").tanb).toBeCloseTo(2.5, 10);
	});

	it("includes the compounding in the TAE", () => {
		expect(rateEquivalents(12, "tanb", "compoundMonthly").tae).toBeCloseTo(
			12.6825,
			3,
		);
	});

	it("turns a TAE back into the nominal rate", () => {
		expect(rateEquivalents(12.6825, "tae", "compoundMonthly").tanb).toBeCloseTo(
			12,
			3,
		);
	});

	it("keeps the TAE equal to the TANB with simple interest", () => {
		expect(rateEquivalents(3, "tae", "simple").tanb).toBe(3);
		expect(rateEquivalents(3, "tanb", "simple").tae).toBe(3);
	});

	it("is zero at a zero rate", () => {
		expect(rateEquivalents(0, "tae", "compoundQuarterly")).toEqual({
			tanb: 0,
			tanl: 0,
			tae: 0,
		});
	});
});

describe("how a saving's rate is applied", () => {
	const terms = (fields: Partial<RateTerms> = {}): RateTerms => ({
		basis: "tanl",
		path: "fixed",
		stepPercent: 0,
		fixedYears: 0,
		laterPercent: 0,
		...fields,
	});
	const saving = (rate: RateTerms, annualReturnPercent = 10) => ({
		id: "s",
		initial: 1000,
		monthly: 0,
		annualReturnPercent,
		interest: "simple" as const,
		rate,
	});
	const project = (plan: HoldingPlan, years: number) =>
		projectPortfolio([plan], { years, inflationPercent: 0 });

	it("grows a TANB on its rate after tax", () => {
		expect(project(saving(terms({ basis: "tanb" })), 1).value).toBe(1072);
	});

	it("grows a TANL on the rate as written", () => {
		expect(project(saving(terms()), 1).value).toBe(1100);
	});

	it("charges no second tax on interest already taxed at source", () => {
		expect(project(saving(terms()), 1).tax).toBe(0);
	});

	it("still taxes market gains next to a saving", () => {
		const market = {
			id: "m",
			initial: 1000,
			monthly: 0,
			annualReturnPercent: 10,
		};
		const result = projectPortfolio([market, saving(terms())], {
			years: 1,
			inflationPercent: 0,
		});

		expect(result.tax).toBe(28);
	});

	it("raises a stepped rate every year", () => {
		const plan = saving(terms({ path: "stepped", stepPercent: 5 }));

		// 10% in the first year and 15% in the second, on the same capital.
		expect(project(plan, 2).value).toBe(1250);
	});

	it("moves a mixed rate on after its fixed years", () => {
		const plan = saving(
			terms({ path: "mixed", fixedYears: 1, laterPercent: 2 }),
		);

		expect(project(plan, 2).value).toBe(1120);
	});

	it("keeps a variable rate at the expected average", () => {
		expect(project(saving(terms({ path: "variable" })), 2).value).toBe(1200);
	});

	it("moves the later rate in the scenarios too", () => {
		const plan = saving(
			terms({ path: "mixed", fixedYears: 0, laterPercent: 4 }),
		);

		expect(
			projectScenarios([plan], { years: 1, inflationPercent: 0 }).optimistic,
		).toBe(1070);
	});

	it.each([
		{ stepPercent: Number.NaN },
		{ fixedYears: 1.5 },
		{ fixedYears: -1 },
		{ laterPercent: Number.NaN },
	])("refuses broken rate terms %o", (fields) => {
		expect(() => project(saving(terms(fields)), 1)).toThrow(
			new AppError("invalidReturn"),
		);
	});
});

describe("continuing a saving that already earned interest", () => {
	const saving = (fields = {}) => ({
		id: "s",
		initial: 1000,
		monthly: 0,
		annualReturnPercent: 10,
		interest: "compoundYearly" as const,
		...fields,
	});
	const settings = { years: 1, inflationPercent: 0 };

	it("starts from the value with its interest", () => {
		const plan = saving({
			annualReturnPercent: 0,
			start: { elapsedMonths: 12, credited: 100, pending: 0 },
		});
		const result = projectPortfolio([plan], settings);

		expect(result.timeline[0].value).toBe(1100);
		expect(result.invested).toBe(1000);
		expect(result.gain).toBe(100);
	});

	it("earns on interest already credited", () => {
		const plan = saving({
			start: { elapsedMonths: 12, credited: 100, pending: 0 },
		});

		expect(projectPortfolio([plan], settings).value).toBe(1210);
	});

	it("credits on the saving's own dates", () => {
		const plan = saving({
			start: { elapsedMonths: 11, credited: 0, pending: 0 },
		});

		// One month of interest is credited, then earns for the other eleven.
		expect(projectPortfolio([plan], settings).value).toBeCloseTo(1100.76, 2);
	});
});
