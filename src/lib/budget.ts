import { AppError, type ErrorCode } from "./errors";
import { roundCents } from "./money";
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

export const MAX_CATEGORIES = 20;
const MONTHS_PER_YEAR = 12;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface BudgetCategory {
	id: string;
	name: string;
	group: BudgetGroup;
	/** What the user plans to spend on it each month, in euros. */
	planned: number;
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

function parseCategory(value: unknown): BudgetCategory | null {
	if (!isRecord(value) || typeof value.id !== "string") return null;
	if (typeof value.name !== "string") return null;
	return {
		id: value.id,
		name: value.name,
		group: isBudgetGroup(value.group) ? value.group : "needs",
		planned: Math.max(numberOr(value.planned, 0), 0),
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

/** Checks an expense before it is logged and rounds it to whole cents. */
export function checkedExpense(
	expense: Omit<Expense, "id">,
): Omit<Expense, "id"> {
	if (!Number.isFinite(expense.amount) || roundCents(expense.amount) <= 0) {
		throw new AppError("invalidExpenseAmount");
	}
	if (!DATE_PATTERN.test(expense.date)) {
		throw new AppError("invalidExpenseDate");
	}
	return {
		...expense,
		amount: roundCents(expense.amount),
		description: expense.description.trim(),
	};
}

function sumMoney(amounts: number[]): number {
	return roundCents(amounts.reduce((sum, amount) => sum + amount, 0));
}

export interface MonthlyPlan {
	salary: number;
	/** What is planned for each group, in euros a month. */
	planned: Record<BudgetGroup, number>;
	/** Every category together. */
	totalPlanned: number;
	/** Needs and wants together, the money that leaves for good. */
	spending: number;
	/** What is left after spending, negative when the plan costs more than the salary. */
	saving: number;
	/** Salary not given to any category yet, negative when over planned. */
	unassigned: number;
}

/** Totals of the monthly plan. Throws when the salary or a planned amount is not valid. */
export function planMonth(budget: Budget): MonthlyPlan {
	assertAmount(budget.salary, "invalidSalary");
	for (const category of budget.categories) {
		assertAmount(category.planned, "invalidPlannedAmount");
	}
	const planned = Object.fromEntries(
		BUDGET_GROUPS.map((group) => [
			group,
			sumMoney(
				budget.categories
					.filter((category) => category.group === group)
					.map((category) => category.planned),
			),
		]),
	) as Record<BudgetGroup, number>;
	const salary = roundCents(budget.salary);
	const spending = roundCents(planned.needs + planned.wants);
	const totalPlanned = roundCents(spending + planned.savings);
	return {
		salary,
		planned,
		totalPlanned,
		spending,
		saving: roundCents(salary - spending),
		unassigned: roundCents(salary - totalPlanned),
	};
}

export interface YearlyEstimate {
	income: number;
	spending: number;
	saving: number;
}

/** What the monthly plan adds up to over twelve months. */
export function estimateYear(plan: MonthlyPlan): YearlyEstimate {
	return {
		income: roundCents(plan.salary * MONTHS_PER_YEAR),
		spending: roundCents(plan.spending * MONTHS_PER_YEAR),
		saving: roundCents(plan.saving * MONTHS_PER_YEAR),
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
 * Compares the plan with the 50/30/20 rule. Savings count everything that is
 * not spent on needs or wants, planned or not. Null without a salary, because
 * there is nothing to take a share of.
 */
export function checkRule(plan: MonthlyPlan): RuleCheck[] | null {
	if (plan.salary <= 0) return null;
	const amounts: Record<BudgetGroup, number> = {
		needs: plan.planned.needs,
		wants: plan.planned.wants,
		savings: Math.max(plan.saving, 0),
	};
	return BUDGET_GROUPS.map((group) => {
		const share = amounts[group] / plan.salary;
		const target = RULE_SHARES[group];
		return {
			group,
			amount: amounts[group],
			share,
			target,
			onTrack: group === "savings" ? share >= target : share <= target,
		};
	});
}

export function expensesInMonth(expenses: Expense[], month: string): Expense[] {
	return expenses
		.filter((expense) => expense.date.startsWith(`${month}-`))
		.sort((a, b) => b.date.localeCompare(a.date));
}

/** What was spent on each category in the given month, by category id. */
export function spentByCategory(
	expenses: Expense[],
	month: string,
): Map<string, number> {
	const spent = new Map<string, number>();
	for (const expense of expensesInMonth(expenses, month)) {
		const sum = (spent.get(expense.categoryId) ?? 0) + expense.amount;
		spent.set(expense.categoryId, roundCents(sum));
	}
	return spent;
}

export function totalSpent(expenses: Expense[], month: string): number {
	return sumMoney(
		expensesInMonth(expenses, month).map((expense) => expense.amount),
	);
}
