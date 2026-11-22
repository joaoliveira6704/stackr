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
	recurrence: "monthly" as const,
	dueDate: "2026-12-01",
};

function storeWithHome() {
	const store = useBudgetStore();
	store.addCategory(HOME);
	return { store, homeId: store.budget.categories[0].id };
}

const TODAY = "2026-11-22";

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

	it("still has something to save after an edit made during a save", async () => {
		fakeAppApi();
		const store = useBudgetStore();
		await store.load();
		store.budget.salary = 1200;

		const saving = store.save();
		store.budget.salary = 1300;
		await saving;

		expect(store.hasUnsavedChanges).toBe(true);
	});

	it("adds a category checked and tidied, with its description", () => {
		const store = useBudgetStore();

		const added = store.addCategory({
			name: " Gym ",
			description: " Monthly fee ",
			group: "wants",
			planned: 29.999,
			recurrence: "monthly" as const,
			dueDate: "2026-12-01",
		});

		expect(store.budget.categories).toEqual([
			{
				id: added.id,
				name: "Gym",
				description: "Monthly fee",
				group: "wants",
				planned: 30,
				recurrence: "monthly" as const,
				dueDate: "2026-12-01",
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
			recurrence: "monthly" as const,
			dueDate: "2026-12-01",
		});

		expect(store.budget.categories).toEqual([
			{
				id: homeId,
				name: "Rent",
				description: "Flat in Lisbon",
				group: "needs",
				planned: 650,
				recurrence: "monthly" as const,
				dueDate: "2026-12-01",
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

	it("sets what is paid on a category, rounded to cents", () => {
		const { store, homeId } = storeWithHome();

		store.setPaid(homeId, 9.999, TODAY);

		expect(store.budget.expenses).toMatchObject([
			{ categoryId: homeId, amount: 10, date: TODAY },
		]);
	});

	it("keeps one total as a bill is paid little by little", () => {
		const { store, homeId } = storeWithHome();

		store.setPaid(homeId, 100, TODAY);
		store.setPaid(homeId, 250, TODAY);

		expect(store.budget.expenses.map((entry) => entry.amount)).toEqual([250]);
	});

	it("refuses a payment on a category that does not exist", () => {
		const { store } = storeWithHome();

		expect(() => store.setPaid("gone", 10, TODAY)).toThrow(
			new AppError("categoryMissing"),
		);
		expect(store.budget.expenses).toEqual([]);
	});

	it("keeps what was paid when the new total is negative", () => {
		const { store, homeId } = storeWithHome();
		store.setPaid(homeId, 100, TODAY);

		expect(() => store.setPaid(homeId, -3, TODAY)).toThrow(
			new AppError("invalidPaidAmount"),
		);
		expect(store.budget.expenses[0].amount).toBe(100);
	});

	it("removes a category together with its expenses", () => {
		const { store, homeId } = storeWithHome();
		store.addCategory({ ...HOME, name: "Fun", group: "wants", planned: 100 });
		const funId = store.budget.categories[1].id;
		store.setPaid(homeId, 500, TODAY);
		store.setPaid(funId, 20, TODAY);

		store.removeCategory(homeId);

		expect(store.budget.categories.map((entry) => entry.name)).toEqual(["Fun"]);
		expect(store.budget.expenses.map((entry) => entry.categoryId)).toEqual([
			funId,
		]);
	});
});
