import { afterEach, describe, expect, it, vi } from "vitest";
import { demoUser, fakeAppApi, storeSessionFor } from "../test/fake-api";
import {
	type Budget,
	type BudgetCategory,
	checkedCategory,
	checkedExpense,
	checkRule,
	dateFromKey,
	dateKey,
	type Expense,
	emptyBudget,
	estimateYear,
	expensesInMonth,
	loadBudget,
	MAX_CATEGORIES,
	monthKey,
	parseBudget,
	planMonth,
	saveBudget,
	spendingProgress,
	spentByCategory,
	totalSpent,
} from "./budget";
import { AppError } from "./errors";

afterEach(() => {
	localStorage.clear();
	vi.unstubAllGlobals();
});

function category(
	id: string,
	group: BudgetCategory["group"],
	planned: number,
): BudgetCategory {
	return { id, name: id, description: "", group, planned };
}

function expense(
	id: string,
	categoryId: string,
	amount: number,
	date: string,
): Expense {
	return { id, categoryId, amount, description: "", date };
}

function budgetWith(salary: number, categories: BudgetCategory[]): Budget {
	return { salary, categories, expenses: [] };
}

function codeOf(run: () => unknown): string | null {
	try {
		run();
		return null;
	} catch (cause) {
		return cause instanceof AppError ? cause.code : "not an AppError";
	}
}

describe("parseBudget", () => {
	it("starts with no salary, no categories and no expenses", () => {
		expect(parseBudget(undefined)).toEqual(emptyBudget());
	});

	it("keeps a well formed saved budget as it is", () => {
		const saved = {
			salary: 1200,
			categories: [category("home", "needs", 500)],
			expenses: [
				{ ...expense("e1", "home", 500, "2026-11-01"), description: "Rent" },
			],
		};
		expect(parseBudget(saved)).toEqual(saved);
	});

	it("drops expenses whose category no longer exists", () => {
		const parsed = parseBudget({
			categories: [category("home", "needs", 500)],
			expenses: [
				expense("e1", "home", 10, "2026-11-01"),
				expense("e2", "gone", 10, "2026-11-01"),
			],
		});
		expect(parsed.expenses.map((entry) => entry.id)).toEqual(["e1"]);
	});

	it("drops broken expenses and fixes broken categories", () => {
		const parsed = parseBudget({
			salary: -50,
			categories: [
				{ id: "home", name: "Home", group: "nonsense", planned: -10 },
				{ name: "No id" },
			],
			expenses: [
				expense("zero", "home", 0, "2026-11-01"),
				expense("badDate", "home", 10, "yesterday"),
			],
		});
		expect(parsed.salary).toBe(0);
		expect(parsed.categories).toEqual([
			{ id: "home", name: "Home", description: "", group: "needs", planned: 0 },
		]);
		expect(parsed.expenses).toEqual([]);
	});

	it("keeps the description of a category and reads a missing one as empty", () => {
		const parsed = parseBudget({
			categories: [
				{ ...category("gym", "wants", 30), description: "Mensalidade" },
				{ id: "old", name: "Old", group: "needs", planned: 10 },
			],
		});
		expect(parsed.categories.map((entry) => entry.description)).toEqual([
			"Mensalidade",
			"",
		]);
	});

	it("keeps no more than the maximum number of categories", () => {
		const categories = Array.from({ length: MAX_CATEGORIES + 3 }, (_, index) =>
			category(`c${index}`, "wants", 10),
		);
		expect(parseBudget({ categories }).categories).toHaveLength(MAX_CATEGORIES);
	});
});

describe("loading and saving", () => {
	it("reads the budget saved on the signed in user", async () => {
		storeSessionFor(demoUser);
		fakeAppApi({ budget: { salary: 900, categories: [], expenses: [] } });

		expect((await loadBudget()).salary).toBe(900);
	});

	it("saves the budget on the signed in user", async () => {
		storeSessionFor(demoUser);
		const { saved } = fakeAppApi();
		const budget = budgetWith(1000, []);

		await saveBudget(budget);

		expect(saved).toEqual([{ budget }]);
	});

	it("reports a failed save", async () => {
		storeSessionFor(demoUser);
		fakeAppApi({ saveFails: true });

		await expect(saveBudget(emptyBudget())).rejects.toThrow(
			new AppError("budgetNotSaved"),
		);
	});
});

describe("planMonth", () => {
	it("adds up what is planned for each group", () => {
		const plan = planMonth(
			budgetWith(2000, [
				category("home", "needs", 700),
				category("food", "needs", 300),
				category("fun", "wants", 250),
				category("save", "savings", 400),
			]),
		);
		expect(plan.planned).toEqual({ needs: 1000, wants: 250, savings: 400 });
		expect(plan.totalPlanned).toBe(1650);
		expect(plan.spending).toBe(1250);
		expect(plan.unassigned).toBe(350);
	});

	it("rounds the totals to whole cents", () => {
		const plan = planMonth(
			budgetWith(1000, [
				category("a", "needs", 0.1),
				category("b", "needs", 0.2),
			]),
		);
		expect(plan.planned.needs).toBe(0.3);
		expect(plan.unassigned).toBe(999.7);
	});

	it("gives zero everywhere for an empty budget", () => {
		const plan = planMonth(emptyBudget());
		expect(plan.totalPlanned).toBe(0);
		expect(plan.planned.savings).toBe(0);
		expect(plan.unassigned).toBe(0);
	});

	it("shows negative unassigned money when the plan costs more than the salary", () => {
		const plan = planMonth(budgetWith(800, [category("home", "needs", 1000)]));
		expect(plan.unassigned).toBe(-200);
	});

	it("handles very large amounts without losing cents", () => {
		const plan = planMonth(
			budgetWith(10_000_000.55, [category("home", "needs", 1_000_000.25)]),
		);
		expect(plan.unassigned).toBe(9_000_000.3);
	});

	it("refuses a negative or missing salary", () => {
		expect(codeOf(() => planMonth(budgetWith(-1, [])))).toBe("invalidSalary");
		expect(codeOf(() => planMonth(budgetWith(Number.NaN, [])))).toBe(
			"invalidSalary",
		);
	});

	it("refuses a negative or missing planned amount", () => {
		expect(
			codeOf(() => planMonth(budgetWith(1000, [category("a", "needs", -5)]))),
		).toBe("invalidPlannedAmount");
		expect(
			codeOf(() =>
				planMonth(budgetWith(1000, [category("a", "needs", Number.NaN)])),
			),
		).toBe("invalidPlannedAmount");
	});
});

describe("estimateYear", () => {
	it("multiplies the monthly plan by twelve", () => {
		const plan = planMonth(
			budgetWith(1500, [
				category("home", "needs", 600),
				category("fun", "wants", 200),
				category("save", "savings", 300),
			]),
		);
		expect(estimateYear(plan)).toEqual({
			income: 18000,
			spending: 9600,
			saving: 3600,
			shortfall: 0,
		});
	});

	it("does not count unassigned salary as savings", () => {
		const plan = planMonth(budgetWith(1000, [category("home", "needs", 400)]));
		expect(estimateYear(plan).saving).toBe(0);
	});

	it("rounds the yearly amounts to whole cents", () => {
		const plan = planMonth(
			budgetWith(1000.01, [
				category("a", "wants", 0.07),
				category("b", "savings", 0.33),
			]),
		);
		expect(estimateYear(plan)).toEqual({
			income: 12000.12,
			spending: 0.84,
			saving: 3.96,
			shortfall: 0,
		});
	});

	it("gives the yearly shortfall when the plan asks for more than the salary", () => {
		const plan = planMonth(
			budgetWith(500, [
				category("a", "needs", 450),
				category("b", "savings", 150),
			]),
		);
		expect(estimateYear(plan)).toMatchObject({ saving: 1800, shortfall: 1200 });
	});

	it("handles a large plan without losing cents", () => {
		const plan = planMonth(
			budgetWith(10_000_000, [category("a", "savings", 1_000_000.01)]),
		);
		expect(estimateYear(plan).saving).toBe(12_000_000.12);
	});
});

describe("checkRule", () => {
	it("has nothing to compare without a salary", () => {
		expect(checkRule(planMonth(emptyBudget()))).toBeNull();
	});

	it("counts a plan exactly on 50/30/20 as on track", () => {
		const checks = checkRule(
			planMonth(
				budgetWith(1000, [
					category("home", "needs", 500),
					category("fun", "wants", 300),
					category("save", "savings", 200),
				]),
			),
		);
		expect(
			checks?.map(({ group, share, onTrack }) => [group, share, onTrack]),
		).toEqual([
			["needs", 0.5, true],
			["wants", 0.3, true],
			["savings", 0.2, true],
		]);
	});

	it("flags too much on needs and wants and too little saved", () => {
		const checks = checkRule(
			planMonth(
				budgetWith(1000, [
					category("home", "needs", 600),
					category("fun", "wants", 350),
					category("save", "savings", 50),
				]),
			),
		);
		expect(checks?.every((check) => !check.onTrack)).toBe(true);
		expect(checks?.[2].amount).toBe(50);
	});

	it("does not count unassigned salary as savings", () => {
		const checks = checkRule(
			planMonth(budgetWith(1000, [category("home", "needs", 400)])),
		);
		expect(checks?.[2]).toMatchObject({ amount: 0, share: 0, onTrack: false });
	});
});

describe("checkedExpense", () => {
	const valid = {
		categoryId: "home",
		amount: 12.345,
		description: "  Bread  ",
		date: "2026-11-19",
	};

	it("rounds the amount to whole cents and trims the description", () => {
		expect(checkedExpense(valid)).toEqual({
			...valid,
			amount: 12.35,
			description: "Bread",
		});
	});

	it("refuses zero, negative and missing amounts", () => {
		for (const amount of [0, 0.001, -5, Number.NaN]) {
			expect(codeOf(() => checkedExpense({ ...valid, amount }))).toBe(
				"invalidExpenseAmount",
			);
		}
	});

	it("refuses an empty date", () => {
		expect(codeOf(() => checkedExpense({ ...valid, date: "" }))).toBe(
			"invalidExpenseDate",
		);
	});
});

describe("expenses in a month", () => {
	const expenses = [
		expense("a", "home", 10.1, "2026-11-02"),
		expense("b", "home", 0.2, "2026-11-20"),
		expense("c", "food", 5, "2026-11-05"),
		expense("old", "home", 99, "2026-10-31"),
	];

	it("keeps only the month asked for, newest first", () => {
		expect(
			expensesInMonth(expenses, "2026-11").map((entry) => entry.id),
		).toEqual(["b", "c", "a"]);
	});

	it("adds up each category to whole cents", () => {
		const spent = spentByCategory(expenses, "2026-11");
		expect(spent.get("home")).toBe(10.3);
		expect(spent.get("food")).toBe(5);
	});

	it("adds up the whole month", () => {
		expect(totalSpent(expenses, "2026-11")).toBe(15.3);
		expect(totalSpent(expenses, "2026-12")).toBe(0);
	});
});

describe("dates", () => {
	it("uses the user's own calendar, not UTC", () => {
		const lateEvening = new Date(2026, 10, 30, 23, 30);
		expect(dateKey(lateEvening)).toBe("2026-11-30");
		expect(monthKey(lateEvening)).toBe("2026-11");
	});

	it("reads a day key back into the same day", () => {
		expect(dateKey(dateFromKey("2026-02-03"))).toBe("2026-02-03");
	});
});

describe("checkedCategory", () => {
	const gym = {
		name: "  Gym ",
		description: " Monthly fee ",
		group: "wants" as const,
		planned: 29.999,
	};

	it("trims the text and rounds the planned amount to cents", () => {
		expect(checkedCategory(gym)).toEqual({
			name: "Gym",
			description: "Monthly fee",
			group: "wants",
			planned: 30,
		});
	});

	it("accepts a planned amount of zero", () => {
		expect(checkedCategory({ ...gym, planned: 0 }).planned).toBe(0);
	});

	it("keeps a large planned amount exact to the cent", () => {
		expect(checkedCategory({ ...gym, planned: 12_345_678.905 }).planned).toBe(
			12_345_678.91,
		);
	});

	it("refuses a category without a name", () => {
		expect(codeOf(() => checkedCategory({ ...gym, name: "   " }))).toBe(
			"categoryNameMissing",
		);
	});

	it("refuses a negative or empty planned amount", () => {
		expect(codeOf(() => checkedCategory({ ...gym, planned: -1 }))).toBe(
			"invalidPlannedAmount",
		);
		expect(codeOf(() => checkedCategory({ ...gym, planned: Number.NaN }))).toBe(
			"invalidPlannedAmount",
		);
	});
});

describe("spendingProgress", () => {
	it("stays green with plenty of room left", () => {
		expect(spendingProgress(100, 500)).toEqual({
			remaining: 400,
			level: "calm",
			state: "left",
		});
	});

	it("turns orange from 70% of the plan", () => {
		expect(spendingProgress(69.99, 100).level).toBe("calm");
		expect(spendingProgress(70, 100).level).toBe("close");
	});

	it("turns red from 90% of the plan", () => {
		expect(spendingProgress(89.99, 100).level).toBe("close");
		expect(spendingProgress(90, 100)).toEqual({
			remaining: 10,
			level: "limit",
			state: "left",
		});
	});

	it("is paid off when exactly the plan is spent", () => {
		expect(spendingProgress(550, 550)).toEqual({
			remaining: 0,
			level: "limit",
			state: "paidOff",
		});
	});

	it("is paid off when the gap is lost in floating point rounding", () => {
		expect(spendingProgress(0.1 + 0.2, 0.3).state).toBe("paidOff");
	});

	it("says how much is over the plan, as a negative remainder", () => {
		expect(spendingProgress(850, 550)).toEqual({
			remaining: -300,
			level: "limit",
			state: "over",
		});
	});

	it("counts any spending as over when nothing was planned", () => {
		expect(spendingProgress(5, 0)).toEqual({
			remaining: -5,
			level: "limit",
			state: "over",
		});
	});

	it("says nothing is planned when there is no plan and no spending", () => {
		expect(spendingProgress(0, 0)).toEqual({
			remaining: 0,
			level: "calm",
			state: "unplanned",
		});
	});

	it("handles large amounts to the cent", () => {
		expect(spendingProgress(1_000_000.01, 1_000_000).remaining).toBe(-0.01);
	});
});
