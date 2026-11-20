import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_CATEGORIES } from "../lib/budget";
import { AppError } from "../lib/errors";
import { demoUser, fakeAppApi, storeSessionFor } from "../test/fake-api";
import { useBudgetStore } from "./budget";

beforeEach(() => {
	setActivePinia(createPinia());
	storeSessionFor(demoUser);
});

afterEach(() => {
	localStorage.clear();
	vi.unstubAllGlobals();
});

const HOME = {
	name: "Home",
	description: "",
	group: "needs" as const,
	planned: 500,
};

function storeWithHome() {
	const store = useBudgetStore();
	store.addCategory(HOME);
	return { store, homeId: store.budget.categories[0].id };
}

const RENT = { amount: 500, description: "Rent", date: "2026-11-01" };

describe("budget store", () => {
	it("has nothing to save right after loading", async () => {
		fakeAppApi({ budget: { salary: 1000, categories: [], expenses: [] } });
		const store = useBudgetStore();

		await store.load();

		expect(store.budget.salary).toBe(1000);
		expect(store.hasUnsavedChanges).toBe(false);
	});

	it("knows there is something to save after a change, and nothing once saved", async () => {
		fakeAppApi();
		const store = useBudgetStore();
		await store.load();

		store.budget.salary = 1200;
		expect(store.hasUnsavedChanges).toBe(true);

		await store.save();
		expect(store.hasUnsavedChanges).toBe(false);
	});

	it("adds a category checked and tidied, with its description", () => {
		const store = useBudgetStore();

		const added = store.addCategory({
			name: " Gym ",
			description: " Monthly fee ",
			group: "wants",
			planned: 29.999,
		});

		expect(store.budget.categories).toEqual([
			{
				id: added.id,
				name: "Gym",
				description: "Monthly fee",
				group: "wants",
				planned: 30,
			},
		]);
	});

	it("refuses a category without a name and adds nothing", () => {
		const store = useBudgetStore();

		expect(() => store.addCategory({ ...HOME, name: "" })).toThrow(
			new AppError("categoryNameMissing"),
		);
		expect(store.budget.categories).toHaveLength(0);
	});

	it("refuses a category past the maximum", () => {
		const store = useBudgetStore();
		for (let index = 0; index < MAX_CATEGORIES; index++)
			store.addCategory(HOME);

		expect(() => store.addCategory(HOME)).toThrow(
			new AppError("tooManyCategories"),
		);
		expect(store.budget.categories).toHaveLength(MAX_CATEGORIES);
	});

	it("changes a category in place and keeps its id", () => {
		const { store, homeId } = storeWithHome();

		store.updateCategory(homeId, {
			name: "Rent",
			description: "Flat in Lisbon",
			group: "needs",
			planned: 650,
		});

		expect(store.budget.categories).toEqual([
			{
				id: homeId,
				name: "Rent",
				description: "Flat in Lisbon",
				group: "needs",
				planned: 650,
			},
		]);
	});

	it("leaves a category untouched when the change is not valid", () => {
		const { store, homeId } = storeWithHome();

		expect(() =>
			store.updateCategory(homeId, { ...HOME, planned: -10 }),
		).toThrow(new AppError("invalidPlannedAmount"));
		expect(store.budget.categories[0].planned).toBe(500);
	});

	it("refuses to change a category that does not exist", () => {
		const { store } = storeWithHome();

		expect(() => store.updateCategory("gone", HOME)).toThrow(
			new AppError("categoryMissing"),
		);
	});

	it("logs an expense on a category, rounded to cents", () => {
		const { store, homeId } = storeWithHome();

		const logged = store.addExpense({
			...RENT,
			amount: 9.999,
			categoryId: homeId,
		});

		expect(logged.amount).toBe(10);
		expect(store.budget.expenses).toEqual([logged]);
	});

	it("refuses an expense for a category that does not exist", () => {
		const { store } = storeWithHome();

		expect(() => store.addExpense({ ...RENT, categoryId: "gone" })).toThrow(
			new AppError("categoryMissing"),
		);
		expect(store.budget.expenses).toEqual([]);
	});

	it("refuses an expense without a valid amount", () => {
		const { store, homeId } = storeWithHome();

		expect(() =>
			store.addExpense({ ...RENT, amount: -3, categoryId: homeId }),
		).toThrow(new AppError("invalidExpenseAmount"));
		expect(store.budget.expenses).toEqual([]);
	});

	it("removes a category together with its expenses", () => {
		const { store, homeId } = storeWithHome();
		store.addCategory({ ...HOME, name: "Fun", group: "wants", planned: 100 });
		const funId = store.budget.categories[1].id;
		store.addExpense({ ...RENT, categoryId: homeId });
		store.addExpense({ ...RENT, amount: 20, categoryId: funId });

		store.removeCategory(homeId);

		expect(store.budget.categories.map((entry) => entry.name)).toEqual(["Fun"]);
		expect(store.budget.expenses.map((entry) => entry.categoryId)).toEqual([
			funId,
		]);
	});

	it("removes a single expense", () => {
		const { store, homeId } = storeWithHome();
		const rent = store.addExpense({ ...RENT, categoryId: homeId });
		store.addExpense({ ...RENT, amount: 30, categoryId: homeId });

		store.removeExpense(rent.id);

		expect(store.budget.expenses.map((entry) => entry.amount)).toEqual([30]);
	});
});
