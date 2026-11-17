import { describe, expect, it } from "vitest";
import { AppError } from "./errors";
import {
	CAPITAL_GAINS_TAX,
	type HoldingPlan,
	MAX_YEARS,
	projectPortfolio,
	projectScenarios,
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
