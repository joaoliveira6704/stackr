import { defineStore } from "pinia";
import { computed, ref } from "vue";
import {
	type Budget,
	type BudgetCategory,
	checkedCategory,
	checkedExpense,
	type Expense,
	emptyBudget,
	loadBudget,
	MAX_CATEGORIES,
	saveBudget,
} from "../lib/budget";
import { AppError } from "../lib/errors";
import { useSavedSnapshot } from "../lib/saved-snapshot";

export type NewCategory = Omit<BudgetCategory, "id">;

export const useBudgetStore = defineStore("budget", () => {
	const budget = ref<Budget>(emptyBudget());
	const { hasUnsavedChanges, markSaved } = useSavedSnapshot(budget);
	const isFull = computed(
		() => budget.value.categories.length >= MAX_CATEGORIES,
	);

	async function load(): Promise<void> {
		budget.value = await loadBudget();
		markSaved();
	}

	async function save(): Promise<void> {
		await saveBudget(budget.value);
		markSaved();
	}

	function addCategory(category: NewCategory): BudgetCategory {
		if (isFull.value) throw new AppError("tooManyCategories");
		const added = { id: crypto.randomUUID(), ...checkedCategory(category) };
		budget.value.categories.push(added);
		return added;
	}

	function updateCategory(id: string, changes: NewCategory): void {
		const category = budget.value.categories.find((entry) => entry.id === id);
		if (!category) throw new AppError("categoryMissing");
		Object.assign(category, checkedCategory(changes));
	}

	/** Removes the category together with every expense logged on it. */
	function removeCategory(id: string): void {
		budget.value.categories = budget.value.categories.filter(
			(category) => category.id !== id,
		);
		budget.value.expenses = budget.value.expenses.filter(
			(expense) => expense.categoryId !== id,
		);
	}

	function addExpense(expense: Omit<Expense, "id">): Expense {
		if (!budget.value.categories.some(({ id }) => id === expense.categoryId)) {
			throw new AppError("categoryMissing");
		}
		const logged = { id: crypto.randomUUID(), ...checkedExpense(expense) };
		budget.value.expenses.push(logged);
		return logged;
	}

	function removeExpense(id: string): void {
		budget.value.expenses = budget.value.expenses.filter(
			(expense) => expense.id !== id,
		);
	}

	return {
		budget,
		hasUnsavedChanges,
		isFull,
		load,
		save,
		addCategory,
		updateCategory,
		removeCategory,
		addExpense,
		removeExpense,
	};
});
