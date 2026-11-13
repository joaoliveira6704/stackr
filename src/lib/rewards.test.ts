import { describe, expect, it } from "vitest";
import { assertWholeAmount, levelForXp } from "./rewards";

describe("levelForXp", () => {
	it("starts a new user at level 1 with zero XP", () => {
		expect(levelForXp(0)).toMatchObject({ level: 1, name: "Beginner" });
	});

	it("keeps the user on the current level one point before the next threshold", () => {
		expect(levelForXp(199).level).toBe(1);
		expect(levelForXp(499).level).toBe(2);
	});

	it("moves the user up exactly at each threshold", () => {
		expect(levelForXp(200).name).toBe("Apprentice");
		expect(levelForXp(500).name).toBe("Saver");
		expect(levelForXp(900).name).toBe("Investor");
		expect(levelForXp(1400).name).toBe("Stackr Master");
	});

	it("caps the user at level 5 for very large XP", () => {
		expect(levelForXp(1_000_000_000).level).toBe(5);
	});

	it("falls back to level 1 for negative XP", () => {
		expect(levelForXp(-50).level).toBe(1);
	});
});

describe("assertWholeAmount", () => {
	it("accepts zero and positive whole numbers", () => {
		expect(() => assertWholeAmount(0, "XP")).not.toThrow();
		expect(() => assertWholeAmount(30, "XP")).not.toThrow();
		expect(() =>
			assertWholeAmount(Number.MAX_SAFE_INTEGER, "XP"),
		).not.toThrow();
	});

	it("rejects negative amounts with a clear message", () => {
		expect(() => assertWholeAmount(-5, "Stacks")).toThrow(
			"Stacks must be a whole number of zero or more.",
		);
	});

	it("rejects fractions so rounding never sneaks into the balance", () => {
		expect(() => assertWholeAmount(10.5, "XP")).toThrow("XP must be");
	});

	it("rejects NaN and Infinity", () => {
		expect(() => assertWholeAmount(Number.NaN, "XP")).toThrow();
		expect(() => assertWholeAmount(Number.POSITIVE_INFINITY, "XP")).toThrow();
	});
});
