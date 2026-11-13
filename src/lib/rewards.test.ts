import { describe, expect, it } from "vitest";
import { assertWholeAmount, levelForXp, levelProgress } from "./rewards";

describe("levelForXp", () => {
	it("starts a new user at level 1 with zero XP", () => {
		expect(levelForXp(0)).toMatchObject({ level: 1, id: "beginner" });
	});

	it("keeps the user on the current level one point before the next threshold", () => {
		expect(levelForXp(199).level).toBe(1);
		expect(levelForXp(499).level).toBe(2);
	});

	it("moves the user up exactly at each threshold", () => {
		expect(levelForXp(200).id).toBe("apprentice");
		expect(levelForXp(500).id).toBe("saver");
		expect(levelForXp(900).id).toBe("investor");
		expect(levelForXp(1400).id).toBe("stackrMaster");
	});

	it("caps the user at level 5 for very large XP", () => {
		expect(levelForXp(1_000_000_000).level).toBe(5);
	});

	it("falls back to level 1 for negative XP", () => {
		expect(levelForXp(-50).level).toBe(1);
	});
});

describe("levelProgress", () => {
	it("starts at zero percent with the full first level still to go", () => {
		expect(levelProgress(0)).toMatchObject({
			remainingXp: 200,
			percent: 0,
		});
		expect(levelProgress(0).nextLevel?.id).toBe("apprentice");
	});

	it("measures progress inside the current level only", () => {
		const progress = levelProgress(440);

		expect(progress.level.id).toBe("apprentice");
		expect(progress.remainingXp).toBe(60);
		expect(progress.percent).toBe(80);
	});

	it("rounds the percent down so the bar never looks full too early", () => {
		expect(levelProgress(499).percent).toBe(99);
	});

	it("is full with nothing left at the top level, even for huge XP", () => {
		expect(levelProgress(1_000_000)).toMatchObject({
			nextLevel: null,
			remainingXp: 0,
			percent: 100,
		});
	});

	it("treats negative XP like zero", () => {
		expect(levelProgress(-30)).toMatchObject({ remainingXp: 200, percent: 0 });
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
