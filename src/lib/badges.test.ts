import { describe, expect, it } from "vitest";
import { badgesForScreen } from "./badges";

describe("badgesForScreen", () => {
	it("lists the budgeting lessons on the budget", () => {
		expect(badgesForScreen("budget", []).map((badge) => badge.id)).toEqual([
			"budgetOnTrack",
			"budgetRule",
			"solidFund",
		]);
	});

	it("lists the investing lessons on the simulator", () => {
		expect(badgesForScreen("simulator", []).map((badge) => badge.id)).toEqual([
			"compoundInterest",
			"inflation",
			"diversification",
			"prudentInvestor",
		]);
	});

	it("marks only the badges the user has earned", () => {
		const badges = badgesForScreen("budget", ["budgetRule", "unstoppable"]);
		expect(
			badges.filter((badge) => badge.earned).map((badge) => badge.id),
		).toEqual(["budgetRule"]);
	});
});
