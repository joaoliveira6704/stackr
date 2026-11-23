import { AppError, type ErrorCode } from "./errors";
import { roundCents, sumMoney } from "./money";
import { isRecord, loadUserField, numberOr, saveUserField } from "./user-data";

export const BUDGET_GROUPS = ["needs", "wants", "savings"] as const;
export type BudgetGroup = (typeof BUDGET_GROUPS)[number];

/**
 * The 50/30/20 rule: at most half of the salary on needs, at most 30% on
 * wants and at least 20% left for savings.
 */
export const RULE_SHARES: Record<BudgetGroup, number> = {
	needs: 0.5,
	wants: 0.3,
	savings: 0.2,
};

/** The types a user can pick. Savings come from the register. */
export const EXPENSE_GROUPS = ["needs", "wants"] as const;

export const RECURRENCES = ["once", "monthly", "quarterly", "yearly"] as const;
export type Recurrence = (typeof RECURRENCES)[number];

const CYCLE_MONTHS: Record<Exclude<Recurrence, "once">, number> = {
	monthly: 1,
	quarterly: 3,
	yearly: 12,
};

export const MAX_CATEGORIES = 20;
const MONTHS_PER_YEAR = 12;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface BudgetCategory {
	id: string;
	name: string;
	/** A short note the user writes about it, empty when there is none. */
	description: string;
	group: BudgetGroup;
	/** What each payment of this bill costs, in euros. */
	planned: number;
	recurrence: Recurrence;
	/** The deadline as YYYY-MM-DD. Only a one off bill may go without one. */
	dueDate: string;
}

export interface Expense {
	id: string;
	categoryId: string;
	amount: number;
	description: string;
	/** The day it was spent, as YYYY-MM-DD on the user's own calendar. */
	date: string;
}

export interface Budget {
	/** Take home pay each month, in euros. */
	salary: number;
	categories: BudgetCategory[];
	expenses: Expense[];
}

export function emptyBudget(): Budget {
	return { salary: 0, categories: [], expenses: [] };
}

function isBudgetGroup(value: unknown): value is BudgetGroup {
	return BUDGET_GROUPS.includes(value as BudgetGroup);
}

function parseDueDate(value: unknown): string {
	return typeof value === "string" && DATE_PATTERN.test(value) ? value : "";
}

// Monthly bills saved before deadlines existed stay monthly without a date.
function parseRecurrence(value: unknown, dueDate: string): Recurrence {
	if (value === "once") return "once";
	const isKnown = RECURRENCES.includes(value as Recurrence);
	return isKnown && dueDate ? (value as Recurrence) : "monthly";
}

function parseCategory(value: unknown): BudgetCategory | null {
	if (!isRecord(value) || typeof value.id !== "string") return null;
	if (typeof value.name !== "string") return null;
	const dueDate = parseDueDate(value.dueDate);
	return {
		id: value.id,
		name: value.name,
		description: typeof value.description === "string" ? value.description : "",
		group: isBudgetGroup(value.group) ? value.group : "needs",
		planned: Math.max(numberOr(value.planned, 0), 0),
		recurrence: parseRecurrence(value.recurrence, dueDate),
		dueDate,
	};
}

function parseExpense(value: unknown): Expense | null {
	if (!isRecord(value) || typeof value.id !== "string") return null;
	if (typeof value.categoryId !== "string") return null;
	if (typeof value.date !== "string" || !DATE_PATTERN.test(value.date)) {
		return null;
	}
	const amount = numberOr(value.amount, 0);
	if (amount <= 0) return null;
	return {
		id: value.id,
		categoryId: value.categoryId,
		amount,
		description: typeof value.description === "string" ? value.description : "",
		date: value.date,
	};
}

/**
 * Reads a budget saved in db.json. Broken entries are dropped, and so are
 * expenses whose category no longer exists, so a hand edited file never
 * breaks the screen.
 */
export function parseBudget(value: unknown): Budget {
	if (!isRecord(value)) return emptyBudget();
	const categories = Array.isArray(value.categories)
		? value.categories
				.flatMap((entry) => parseCategory(entry) ?? [])
				.slice(0, MAX_CATEGORIES)
		: [];
	const categoryIds = new Set(categories.map((category) => category.id));
	const expenses = Array.isArray(value.expenses)
		? value.expenses
				.flatMap((entry) => parseExpense(entry) ?? [])
				.filter((expense) => categoryIds.has(expense.categoryId))
		: [];
	return {
		salary: Math.max(numberOr(value.salary, 0), 0),
		categories,
		expenses,
	};
}

export async function loadBudget(): Promise<Budget> {
	return parseBudget(await loadUserField("budget", "budgetNotLoaded"));
}

export async function saveBudget(budget: Budget): Promise<void> {
	await saveUserField("budget", budget, "budgetNotSaved");
}

function twoDigits(value: number): string {
	return String(value).padStart(2, "0");
}

/** The day as YYYY-MM-DD on the user's own clock, not in UTC. */
export function dateKey(date: Date): string {
	return `${date.getFullYear()}-${twoDigits(date.getMonth() + 1)}-${twoDigits(date.getDate())}`;
}

/** Turns a YYYY-MM-DD key back into a date at midnight on the user's clock. */
export function dateFromKey(key: string): Date {
	const [year, month, day] = key.split("-").map(Number);
	return new Date(year, month - 1, day);
}

/** The month as YYYY-MM, such as "2026-11", on the user's own clock. */
export function monthKey(date: Date): string {
	return dateKey(date).slice(0, 7);
}

function assertAmount(amount: number, code: ErrorCode): void {
	if (!Number.isFinite(amount) || amount < 0) throw new AppError(code);
}

/** Checks a category before it is added or changed, and tidies its text. */
export function checkedCategory(
	category: Omit<BudgetCategory, "id">,
): Omit<BudgetCategory, "id"> {
	const name = category.name.trim();
	if (!name) throw new AppError("categoryNameMissing");
	assertAmount(category.planned, "invalidPlannedAmount");
	const dueDate = parseDueDate(category.dueDate);
	if (category.recurrence !== "once" && !dueDate) {
		throw new AppError("dueDateMissing");
	}
	return {
		name,
		description: category.description.trim(),
		group: category.group,
		planned: roundCents(category.planned),
		recurrence: category.recurrence,
		dueDate,
	};
}

export interface MonthlyPlan {
	salary: number;
	/** What is planned for each group, in euros a month. */
	planned: Record<BudgetGroup, number>;
	/** Every category together. */
	totalPlanned: number;
	/** Needs and wants together, the money that leaves for good. */
	spending: number;
	/** Salary not given to any category yet, negative when over planned. */
	unassigned: number;
	/** Needs and wants over the calendar year, counting each real payment. */
	yearlySpending: number;
}

/** What a bill weighs on one month. A one off counts in the month it is due. */
export function monthlyCost(category: BudgetCategory, month: string): number {
	if (category.recurrence === "once") {
		return category.dueDate.startsWith(`${month}-`) ? category.planned : 0;
	}
	return category.planned / CYCLE_MONTHS[category.recurrence];
}

export function yearlyCost(category: BudgetCategory, year: string): number {
	if (category.recurrence === "once") {
		return category.dueDate.startsWith(`${year}-`) ? category.planned : 0;
	}
	return (
		(category.planned * MONTHS_PER_YEAR) / CYCLE_MONTHS[category.recurrence]
	);
}

/**
 * Totals of the monthly plan, with what the register puts aside each month
 * counted as savings. Throws when the salary or a planned amount is not valid.
 */
export function planMonth(
	budget: Budget,
	month: string = monthKey(new Date()),
	registeredMonthlySavings = 0,
): MonthlyPlan {
	assertAmount(budget.salary, "invalidSalary");
	assertAmount(registeredMonthlySavings, "invalidAmount");
	for (const category of budget.categories) {
		assertAmount(category.planned, "invalidPlannedAmount");
	}
	const planned = Object.fromEntries(
		BUDGET_GROUPS.map((group) => [
			group,
			sumMoney(
				budget.categories
					.filter((category) => category.group === group)
					.map((category) => monthlyCost(category, month)),
			),
		]),
	) as Record<BudgetGroup, number>;
	planned.savings = roundCents(planned.savings + registeredMonthlySavings);
	const salary = roundCents(budget.salary);
	const spending = roundCents(planned.needs + planned.wants);
	const totalPlanned = roundCents(spending + planned.savings);
	const year = month.slice(0, 4);
	const yearlySpending = sumMoney(
		budget.categories
			.filter((category) => category.group !== "savings")
			.map((category) => yearlyCost(category, year)),
	);
	return {
		salary,
		planned,
		totalPlanned,
		spending,
		unassigned: roundCents(salary - totalPlanned),
		yearlySpending,
	};
}

export interface YearlyEstimate {
	income: number;
	spending: number;
}

/** What the plan adds up to over the calendar year. */
export function estimateYear(plan: MonthlyPlan): YearlyEstimate {
	return {
		income: roundCents(plan.salary * MONTHS_PER_YEAR),
		spending: plan.yearlySpending,
	};
}

export interface RuleCheck {
	group: BudgetGroup;
	amount: number;
	/** Share of the salary, 0.25 for 25%. */
	share: number;
	target: number;
	onTrack: boolean;
}

/**
 * Compares the plan with the 50/30/20 rule. Savings count only what is
 * planned as savings, so salary left unassigned is not taken as saved. Null
 * without a salary, because there is nothing to take a share of.
 */
export function checkRule(plan: MonthlyPlan): RuleCheck[] | null {
	if (plan.salary <= 0) return null;
	return BUDGET_GROUPS.map((group) => {
		const amount = plan.planned[group];
		const share = amount / plan.salary;
		const target = RULE_SHARES[group];
		return {
			group,
			amount,
			share,
			target,
			onTrack: group === "savings" ? share >= target : share <= target,
		};
	});
}

function monthIndex(key: string): number {
	const [year, month] = key.split("-").map(Number);
	return year * MONTHS_PER_YEAR + month - 1;
}

/** The deadline's day in another month, or that month's last day if shorter. */
function dueDateInMonth(dueDate: string, index: number): string {
	const year = Math.floor(index / MONTHS_PER_YEAR);
	const month = index % MONTHS_PER_YEAR;
	const lastDay = new Date(year, month + 1, 0).getDate();
	const day = Math.min(Number(dueDate.slice(8)), lastDay);
	return dateKey(new Date(year, month, day));
}

export interface BillCycle {
	/** First and last day whose payments count, as YYYY-MM-DD. */
	from: string;
	to: string;
	/** The deadline of this cycle, empty when the bill has none. */
	dueDate: string;
}

const FIRST_DAY = "0000-01-01";
const LAST_DAY = "9999-12-31";

function dayAfter(key: string): string {
	const date = dateFromKey(key);
	date.setDate(date.getDate() + 1);
	return dateKey(date);
}

function recurringCycle(
	dueDate: string,
	length: number,
	today: string,
): BillCycle {
	const firstDue = monthIndex(dueDate);
	const occurrence = (count: number) =>
		dueDateInMonth(dueDate, firstDue + count * length);
	const monthsPassed = monthIndex(today) - firstDue;
	let count = Math.max(Math.ceil(monthsPassed / length), 0);
	if (occurrence(count) < today) count++;
	return {
		from: count > 0 ? dayAfter(occurrence(count - 1)) : FIRST_DAY,
		to: occurrence(count),
		dueDate: occurrence(count),
	};
}

/**
 * The days a payment counts towards. The deadline is the last day to pay, and
 * a recurring bill starts again at zero on the day after it.
 */
export function billCycle(category: BudgetCategory, today: string): BillCycle {
	const { recurrence, dueDate } = category;
	if (recurrence === "once") {
		return { from: FIRST_DAY, to: LAST_DAY, dueDate };
	}
	if (!dueDate) {
		const month = today.slice(0, 7);
		return { from: `${month}-01`, to: `${month}-31`, dueDate };
	}
	return recurringCycle(dueDate, CYCLE_MONTHS[recurrence], today);
}

function isInCycle(expense: Expense, cycle: BillCycle): boolean {
	return expense.date >= cycle.from && expense.date <= cycle.to;
}

/**
 * Sets the total paid on a bill in its current cycle. The first payment of the
 * cycle holds the new total, so typing the same value again leaves nothing to
 * save, and a total of zero clears the cycle.
 */
export function withPaidAmount(
	expenses: Expense[],
	category: BudgetCategory,
	paid: number,
	today: string,
): Expense[] {
	if (!Number.isFinite(paid) || paid < 0) {
		throw new AppError("invalidPaidAmount");
	}
	const amount = roundCents(paid);
	const cycle = billCycle(category, today);
	const isThisPayment = (expense: Expense) =>
		expense.categoryId === category.id && isInCycle(expense, cycle);
	const first = expenses.find(isThisPayment);
	if (amount > 0 && !first) {
		const id = crypto.randomUUID();
		return [
			...expenses,
			{ id, categoryId: category.id, amount, description: "", date: today },
		];
	}
	return expenses
		.filter(
			(expense) => !isThisPayment(expense) || (amount > 0 && expense === first),
		)
		.map((expense) => (expense === first ? { ...expense, amount } : expense));
}

/** What is paid on each bill in its current cycle, by category id. */
export function paidByCategory(
	budget: Budget,
	today: string,
): Map<string, number> {
	return new Map(
		budget.categories.map((category) => {
			const cycle = billCycle(category, today);
			const payments = budget.expenses.filter(
				(expense) =>
					expense.categoryId === category.id && isInCycle(expense, cycle),
			);
			return [category.id, sumMoney(payments.map(({ amount }) => amount))];
		}),
	);
}

/** How far one notch of the slider moves, so dragging lands on round amounts. */
export function paymentStep(planned: number): number {
	if (planned <= 20) return 0.5;
	if (planned <= 200) return 1;
	return planned <= 1000 ? 5 : 10;
}

/** What the line under the bar says. */
export type SpendingState = "left" | "paidOff" | "over" | "unplanned";

export interface SpendingProgress {
	/** Planned minus spent, negative when more was spent than planned. */
	remaining: number;
	/** Paid as a share of the plan, 0.25 for 25%. Zero when nothing is planned. */
	share: number;
	state: SpendingState;
}

function spendingState(planned: number, remaining: number): SpendingState {
	if (remaining < 0) return "over";
	if (planned === 0) return "unplanned";
	return remaining === 0 ? "paidOff" : "left";
}

/** Where a category stands this month, compared in whole cents. */
export function spendingProgress(
	spent: number,
	planned: number,
): SpendingProgress {
	const remaining = roundCents(planned - spent);
	return {
		remaining,
		share: planned > 0 ? spent / planned : 0,
		state: spendingState(planned, remaining),
	};
}
