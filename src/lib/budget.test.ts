import { afterEach, describe, expect, it, vi } from "vitest";
import { demoUser, fakeAppApi, storeSessionFor } from "../test/fake-api";
import {
	type Budget,
	type BudgetCategory,
	billCycle,
	checkedCategory,
	checkRule,
	dateFromKey,
	dateKey,
	type Expense,
	emptyBudget,
	estimateYear,
	loadBudget,
	MAX_CATEGORIES,
	monthKey,
	paidByCategory,
	parseBudget,
	paymentStep,
	planMonth,
	saveBudget,
	spendingProgress,
	withPaidAmount,
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
	return {
		id,
		name: id,
		description: "",
		group,
		planned,
		recurrence: "monthly",
		dueDate: "",
	};
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
			{
				id: "home",
				name: "Home",
				description: "",
				group: "needs",
				planned: 0,
				recurrence: "monthly",
				dueDate: "",
			},
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

	it("keeps an old bill without a date as monthly", () => {
		const parsed = parseBudget({
			categories: [{ id: "old", name: "Old", group: "needs", planned: 10 }],
		});
		expect(parsed.categories[0]).toMatchObject({
			recurrence: "monthly",
			dueDate: "",
		});
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
	it("multiplies the salary and the spending by twelve", () => {
		const plan = planMonth(
			budgetWith(1500, [
				category("home", "needs", 600),
				category("fun", "wants", 200),
				category("save", "savings", 300),
			]),
		);
		expect(estimateYear(plan)).toEqual({ income: 18000, spending: 9600 });
	});

	it("rounds the yearly amounts to whole cents", () => {
		const plan = planMonth(budgetWith(1000.01, [category("a", "wants", 0.07)]));
		expect(estimateYear(plan)).toEqual({ income: 12000.12, spending: 0.84 });
	});

	it("is zero for an empty budget", () => {
		expect(estimateYear(planMonth(emptyBudget()))).toEqual({
			income: 0,
			spending: 0,
		});
	});

	it("handles a large salary without losing cents", () => {
		const plan = planMonth(budgetWith(10_000_000.01, []));
		expect(estimateYear(plan).income).toBe(120_000_000.12);
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

describe("withPaidAmount", () => {
	const today = "2026-11-22";
	const home = category("home", "needs", 500);

	it("creates the first payment of the month", () => {
		const [paid] = withPaidAmount([], home, 100, today);

		expect(paid).toMatchObject({
			categoryId: "home",
			amount: 100,
			date: today,
		});
	});

	it("updates the total and keeps the same payment", () => {
		const saved = [expense("e1", "home", 100, "2026-11-02")];

		expect(withPaidAmount(saved, home, 250, today)).toEqual([
			{ ...saved[0], amount: 250 },
		]);
	});

	it("joins several payments of the month into one total", () => {
		const saved = [
			expense("e1", "home", 100, "2026-11-02"),
			expense("e2", "home", 50, "2026-11-10"),
		];

		expect(withPaidAmount(saved, home, 175, today)).toEqual([
			{ ...saved[0], amount: 175 },
		]);
	});

	it("leaves other categories and other months alone", () => {
		const food = expense("food", "food", 20, "2026-11-03");
		const october = expense("old", "home", 99, "2026-10-31");

		const result = withPaidAmount([food, october], home, 10, today);

		expect(result.slice(0, 2)).toEqual([food, october]);
	});

	it("clears the month when the total is zero", () => {
		const october = expense("old", "home", 99, "2026-10-31");
		const saved = [october, expense("e1", "home", 100, "2026-11-02")];

		expect(withPaidAmount(saved, home, 0, today)).toEqual([october]);
	});

	it("treats less than half a cent as nothing paid", () => {
		expect(withPaidAmount([], home, 0.004, today)).toEqual([]);
	});

	it("rounds the total to whole cents", () => {
		expect(withPaidAmount([], home, 12.345, today)[0].amount).toBe(12.35);
	});

	it("keeps a large total exact to the cent", () => {
		expect(withPaidAmount([], home, 12_345_678.91, today)[0].amount).toBe(
			12_345_678.91,
		);
	});

	it("refuses negative and missing totals", () => {
		for (const paid of [-0.01, Number.NaN, Number.POSITIVE_INFINITY]) {
			expect(codeOf(() => withPaidAmount([], home, paid, today))).toBe(
				"invalidPaidAmount",
			);
		}
	});
});

function bill(
	recurrence: BudgetCategory["recurrence"],
	dueDate: string,
): BudgetCategory {
	return { ...category("home", "needs", 100), recurrence, dueDate };
}

describe("billCycle", () => {
	it("moves a monthly bill to its next deadline", () => {
		expect(billCycle(bill("monthly", "2026-11-08"), "2026-11-22")).toEqual({
			from: "2026-11-09",
			to: "2026-12-08",
			dueDate: "2026-12-08",
		});
	});

	it("keeps the deadline day inside the cycle", () => {
		const cycle = billCycle(bill("monthly", "2026-11-08"), "2026-12-08");
		expect(cycle.dueDate).toBe("2026-12-08");
	});

	it("starts a new cycle on the day after the deadline", () => {
		const cycle = billCycle(bill("monthly", "2026-11-08"), "2026-12-09");
		expect(cycle.from).toBe("2026-12-09");
		expect(cycle.dueDate).toBe("2027-01-08");
	});

	it("jumps three months for a quarterly bill", () => {
		const cycle = billCycle(bill("quarterly", "2026-12-15"), "2027-01-02");
		expect(cycle.dueDate).toBe("2027-03-15");
	});

	it("jumps a year for a yearly bill", () => {
		const cycle = billCycle(bill("yearly", "2026-12-01"), "2027-06-10");
		expect(cycle.dueDate).toBe("2027-12-01");
	});

	it("uses the last day of a shorter month", () => {
		const monthly = bill("monthly", "2026-01-31");
		expect(billCycle(monthly, "2026-02-10").dueDate).toBe("2026-02-28");
		expect(billCycle(monthly, "2026-03-01").dueDate).toBe("2026-03-31");
	});

	it("waits for a first deadline in the future", () => {
		expect(billCycle(bill("yearly", "2028-03-01"), "2026-11-22")).toMatchObject(
			{ from: "0000-01-01", dueDate: "2028-03-01" },
		);
	});

	it("keeps a one off bill on its own date after it passes", () => {
		const cycle = billCycle(bill("once", "2026-11-01"), "2027-05-01");
		expect(cycle.dueDate).toBe("2026-11-01");
	});
});

describe("paidByCategory", () => {
	const paidOn = (date: string, amount = 100) =>
		expense("e1", "home", amount, date);

	it("resets a recurring bill the day after its deadline", () => {
		const budget = {
			...budgetWith(0, [bill("monthly", "2026-11-08")]),
			expenses: [paidOn("2026-11-05")],
		};
		expect(paidByCategory(budget, "2026-11-08").get("home")).toBe(100);
		expect(paidByCategory(budget, "2026-11-09").get("home")).toBe(0);
	});

	it("keeps a yearly payment across the months before its deadline", () => {
		const budget = {
			...budgetWith(0, [bill("yearly", "2026-12-01")]),
			expenses: [paidOn("2026-03-10")],
		};
		expect(paidByCategory(budget, "2026-11-30").get("home")).toBe(100);
	});

	it("never resets a one off bill", () => {
		const budget = {
			...budgetWith(0, [bill("once", "2026-11-01")]),
			expenses: [paidOn("2026-10-10")],
		};
		expect(paidByCategory(budget, "2027-05-01").get("home")).toBe(100);
	});

	it("adds up payments to whole cents", () => {
		const budget = {
			...budgetWith(0, [bill("once", "")]),
			expenses: [paidOn("2026-11-01", 0.1), paidOn("2026-11-02", 0.2)],
		};
		expect(paidByCategory(budget, "2026-11-22").get("home")).toBe(0.3);
	});
});

describe("recurring costs in the plan", () => {
	const withBills = (...bills: BudgetCategory[]) =>
		planMonth(budgetWith(1000, bills), "2026-11");

	it("spreads a yearly bill over twelve months", () => {
		expect(withBills(bill("yearly", "2026-12-01")).totalPlanned).toBe(8.33);
	});

	it("counts a yearly bill once in the year, without rounding drift", () => {
		const plan = withBills(bill("yearly", "2026-12-01"));
		expect(estimateYear(plan).spending).toBe(100);
	});

	it("counts a quarterly bill four times in the year", () => {
		const plan = withBills(bill("quarterly", "2026-12-01"));
		expect(estimateYear(plan).spending).toBe(400);
	});

	it("counts a one off bill only in the month it is due", () => {
		expect(withBills(bill("once", "2026-11-20")).totalPlanned).toBe(100);
		expect(withBills(bill("once", "2026-12-20")).totalPlanned).toBe(0);
	});
});

describe("paymentStep", () => {
	it("uses finer notches on small bills and larger ones on big bills", () => {
		expect([20, 200, 1000, 1001].map(paymentStep)).toEqual([0.5, 1, 5, 10]);
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
		recurrence: "monthly" as const,
		dueDate: "2026-12-08",
	};

	it("trims the text and rounds the planned amount to cents", () => {
		expect(checkedCategory(gym)).toEqual({
			name: "Gym",
			description: "Monthly fee",
			group: "wants",
			planned: 30,
			recurrence: "monthly",
			dueDate: "2026-12-08",
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

	it("requires a date on every recurring bill", () => {
		for (const recurrence of ["monthly", "quarterly", "yearly"] as const) {
			expect(
				codeOf(() => checkedCategory({ ...gym, recurrence, dueDate: "" })),
			).toBe("dueDateMissing");
		}
	});

	it("lets a one off bill go without a date", () => {
		const checked = checkedCategory({
			...gym,
			recurrence: "once",
			dueDate: "",
		});
		expect(checked.dueDate).toBe("");
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
	it("says how much is left and which share is paid", () => {
		expect(spendingProgress(100, 500)).toEqual({
			remaining: 400,
			share: 0.2,
			state: "left",
		});
	});

	it("starts at a share of zero", () => {
		expect(spendingProgress(0, 500)).toEqual({
			remaining: 500,
			share: 0,
			state: "left",
		});
	});

	it("is paid off when exactly the plan is paid", () => {
		expect(spendingProgress(550, 550)).toEqual({
			remaining: 0,
			share: 1,
			state: "paidOff",
		});
	});

	it("is paid off when the gap is lost in floating point rounding", () => {
		expect(spendingProgress(0.1 + 0.2, 0.3).state).toBe("paidOff");
	});

	it("says how much is over the plan, as a negative remainder", () => {
		expect(spendingProgress(850, 550)).toMatchObject({
			remaining: -300,
			state: "over",
		});
	});

	it("counts any payment as over when nothing was planned", () => {
		expect(spendingProgress(5, 0)).toEqual({
			remaining: -5,
			share: 0,
			state: "over",
		});
	});

	it("says nothing is planned when there is no plan and no payment", () => {
		expect(spendingProgress(0, 0)).toEqual({
			remaining: 0,
			share: 0,
			state: "unplanned",
		});
	});

	it("handles large amounts to the cent", () => {
		expect(spendingProgress(1_000_000.01, 1_000_000).remaining).toBe(-0.01);
	});
});

describe("savings from the register", () => {
	it("counts the monthly amount as savings", () => {
		const plan = planMonth(budgetWith(2000, []), "2026-11", 150.25);

		expect(plan.planned.savings).toBe(150.25);
		expect(plan.unassigned).toBe(1849.75);
	});

	it("adds to savings already planned in the budget", () => {
		const plan = planMonth(
			budgetWith(2000, [category("old", "savings", 100)]),
			"2026-11",
			50,
		);

		expect(plan.planned.savings).toBe(150);
	});

	it("changes nothing when the register has no monthly amount", () => {
		const plan = planMonth(budgetWith(2000, []), "2026-11", 0);

		expect(plan.planned.savings).toBe(0);
		expect(plan.unassigned).toBe(2000);
	});

	it("shows the salary as over planned when savings exceed it", () => {
		expect(planMonth(budgetWith(100, []), "2026-11", 150).unassigned).toBe(-50);
	});

	it("keeps large amounts exact", () => {
		const plan = planMonth(budgetWith(10_000_000, []), "2026-11", 1_000_000.01);

		expect(plan.planned.savings).toBe(1_000_000.01);
	});

	it("refuses a negative or broken amount", () => {
		for (const amount of [-1, Number.NaN]) {
			expect(() => planMonth(budgetWith(100, []), "2026-11", amount)).toThrow(
				new AppError("invalidAmount"),
			);
		}
	});
});
