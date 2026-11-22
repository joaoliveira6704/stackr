import { describe, expect, it } from "vitest";
import { AppError } from "./errors";
import type { HoldingPlan } from "./projection";
import { compareTrial } from "./trial-investment";

const settings = { years: 10, inflationPercent: 2 };

function plan(fields: Partial<HoldingPlan> = {}): HoldingPlan {
	return {
		id: "plan",
		initial: 1000,
		monthly: 100,
		annualReturnPercent: 5,
		...fields,
	};
}

describe("compareTrial", () => {
	it("adds exactly what the new investment is worth without any return", () => {
		const trial = plan({
			id: "trial",
			initial: 500,
			monthly: 0,
			annualReturnPercent: 0,
		});

		const result = compareTrial(
			[plan({ annualReturnPercent: 0 })],
			trial,
			settings,
			null,
		);

		expect(result.withoutTrial).toBe(13_000);
		expect(result.withTrial).toBe(13_500);
		expect(result.extraValue).toBe(500);
	});

	it("says it fits when the monthly amount is within what is free", () => {
		const result = compareTrial([], plan({ monthly: 100 }), settings, 250.5);

		expect(result.affordability).toBe("fits");
		expect(result.freeAfterTrial).toBe(150.5);
	});

	it("says it fits when it uses every free cent", () => {
		const result = compareTrial([], plan({ monthly: 100 }), settings, 100);

		expect(result.affordability).toBe("fits");
		expect(result.freeAfterTrial).toBe(0);
	});

	it("says it is too much when the budget is already over", () => {
		const result = compareTrial([], plan({ monthly: 100 }), settings, -20);

		expect(result.affordability).toBe("tooMuch");
		expect(result.freeAfterTrial).toBe(-120);
	});

	it("cannot judge the budget when it is not known", () => {
		const result = compareTrial([], plan(), settings, null);

		expect(result.affordability).toBe("unknown");
		expect(result.freeAfterTrial).toBeNull();
	});

	it("finds a gain above inflation after tax", () => {
		const trial = plan({ annualReturnPercent: 8 });

		expect(compareTrial([], trial, settings, null).realNetGain).toBeGreaterThan(
			0,
		);
	});

	it("finds a loss when the return stays below inflation", () => {
		const trial = plan({ annualReturnPercent: 1 });

		expect(compareTrial([], trial, settings, null).realNetGain).toBeLessThan(0);
	});

	it("does not charge tax on a losing investment", () => {
		const trial = plan({ monthly: 0, annualReturnPercent: -5 });

		const result = compareTrial([], trial, settings, null);

		expect(result.netGain).toBeLessThan(0);
		expect(result.netGain).toBe(result.withTrial - 1000);
	});

	it("compares the return with the registered portfolio", () => {
		const registered = [plan({ annualReturnPercent: 4 })];

		expect(
			compareTrial(registered, plan({ annualReturnPercent: 6 }), settings, null)
				.beatsPortfolio,
		).toBe(true);
		expect(
			compareTrial(registered, plan({ annualReturnPercent: 3 }), settings, null)
				.beatsPortfolio,
		).toBe(false);
	});

	it("has nothing to compare with an empty portfolio", () => {
		expect(compareTrial([], plan(), settings, null).beatsPortfolio).toBeNull();
	});

	it("handles large amounts", () => {
		const trial = plan({
			initial: 10_000_000,
			monthly: 0,
			annualReturnPercent: 0,
		});

		expect(compareTrial([], trial, settings, null).extraValue).toBe(10_000_000);
	});

	it("refuses an amount that is not valid", () => {
		expect(() =>
			compareTrial([], plan({ monthly: Number.NaN }), settings, null),
		).toThrow(new AppError("invalidAmount"));
	});
});
