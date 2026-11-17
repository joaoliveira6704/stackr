import { describe, expect, it } from "vitest";
import { niceTicks, yearTicks } from "./chart-scale";

describe("niceTicks", () => {
	it("lands on round numbers that reach past the largest value", () => {
		expect(niceTicks(87_000)).toEqual([0, 25_000, 50_000, 75_000, 100_000]);
	});

	it("works for small values", () => {
		expect(niceTicks(7)).toEqual([0, 2, 4, 6, 8]);
	});

	it("falls back to a simple axis when there is nothing to show", () => {
		expect(niceTicks(0)).toEqual([0, 1]);
		expect(niceTicks(Number.NaN)).toEqual([0, 1]);
	});
});

describe("yearTicks", () => {
	it("always shows the first and the last year", () => {
		expect(yearTicks(20)).toEqual([0, 5, 10, 15, 20]);
	});

	it("drops a tick that would crowd the last year", () => {
		expect(yearTicks(11)).toEqual([0, 5, 11]);
	});

	it("shows every year on a short period", () => {
		expect(yearTicks(3)).toEqual([0, 1, 2, 3]);
	});
});
