import { defineStore } from "pinia";
import { computed, ref } from "vue";
import {
	type Budget,
	type BudgetCategory,
	checkedCategory,
	emptyBudget,
	loadBudget,
	MAX_CATEGORIES,
	saveBudget,
	withPaidAmount,
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
		// The user can keep editing during the request, and those edits are not saved yet.
		const sent = JSON.stringify(budget.value);
		await saveBudget(JSON.parse(sent));
		markSaved(sent);
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

	/** Sets how much of a bill is paid in its cycle around `today`. */
	function setPaid(categoryId: string, paid: number, today: string): void {
		const category = budget.value.categories.find(
			({ id }) => id === categoryId,
		);
		if (!category) throw new AppError("categoryMissing");
		budget.value.expenses = withPaidAmount(
			budget.value.expenses,
			category,
			paid,
			today,
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
		setPaid,
	};
});
