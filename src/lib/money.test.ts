import { describe, expect, it } from "vitest";
import { percentToRate, roundCents, roundPercent } from "./money";

describe("roundCents", () => {
	it("rounds half a cent up, even where floating point says 1.00499", () => {
		expect(roundCents(1.005)).toBe(1.01);
	});

	it("rounds down below half a cent", () => {
		expect(roundCents(2.344)).toBe(2.34);
	});

	it("keeps zero as zero, never minus zero", () => {
		expect(Object.is(roundCents(0), 0)).toBe(true);
		expect(Object.is(roundCents(-0.001), 0)).toBe(true);
	});

	it("rounds negative amounts away from zero like positive ones", () => {
		expect(roundCents(-1.005)).toBe(-1.01);
		expect(roundCents(-2.344)).toBe(-2.34);
	});

	it("keeps large amounts exact to the cent", () => {
		expect(roundCents(123_456_789.125)).toBe(123_456_789.13);
	});
});

describe("percentToRate", () => {
	it("turns a percentage into a rate", () => {
		expect(percentToRate(7.5)).toBe(0.075);
		expect(percentToRate(0)).toBe(0);
		expect(percentToRate(-20)).toBe(-0.2);
	});
});

describe("roundPercent", () => {
	it("keeps one decimal place", () => {
		expect(roundPercent(7.456)).toBe(7.5);
		expect(roundPercent(-3.04)).toBe(-3);
	});
});
