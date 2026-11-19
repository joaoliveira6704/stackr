<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import AppIcon from "../components/AppIcon.vue";
import BudgetCategoryCard from "../components/BudgetCategoryCard.vue";
import BudgetRuleCheck from "../components/BudgetRuleCheck.vue";
import ExpenseForm from "../components/ExpenseForm.vue";
import { BUDGET_GROUP_ICONS } from "../components/icons";
import LessonBadges from "../components/LessonBadges.vue";
import NumberField from "../components/NumberField.vue";
import SaveControl from "../components/SaveControl.vue";
import StatCard from "../components/StatCard.vue";
import StatRow from "../components/StatRow.vue";
import { BUDGET_GROUP_TONES } from "../components/tones";
import {
	type BudgetCategory,
	type BudgetGroup,
	checkRule,
	dateFromKey,
	estimateYear,
	type Expense,
	expensesInMonth,
	MAX_CATEGORIES,
	type MonthlyPlan,
	monthKey,
	planMonth,
	type RuleCheck,
	spentByCategory,
	totalSpent,
	type YearlyEstimate,
} from "../lib/budget";
import { type ErrorCode, errorCode } from "../lib/errors";
import { useConfirm } from "../lib/use-confirm";
import { useSavedPlan } from "../lib/use-saved-plan";
import { type NewCategory, useBudgetStore } from "../stores/budget";

const store = useBudgetStore();
const { budget, hasUnsavedChanges, isFull } = storeToRefs(store);
const { confirm } = useConfirm();
const { t, n, d } = useI18n();

const { loading, loadError, saving, saveError, justSaved, load, save } =
	useSavedPlan(store, hasUnsavedChanges, () => ({
		title: t("budget.confirmLeave.title"),
		message: t("budget.confirmLeave.message"),
		confirmLabel: t("budget.confirmLeave.confirm"),
	}));

const SUGGESTED_CATEGORIES: { key: string; group: BudgetGroup }[] = [
	{ key: "housing", group: "needs" },
	{ key: "groceries", group: "needs" },
	{ key: "transport", group: "needs" },
	{ key: "leisure", group: "wants" },
	{ key: "savings", group: "savings" },
];

// The month is read once, so a page left open past midnight on the last day
// keeps showing the month the user started in.
const month = monthKey(new Date());
const addError = ref<ErrorCode | null>(null);

type Outcome =
	| { plan: MonthlyPlan; rule: RuleCheck[] | null; year: YearlyEstimate; error: null }
	| { error: ErrorCode };

const outcome = computed<Outcome>(() => {
	try {
		const plan = planMonth(budget.value);
		return { plan, rule: checkRule(plan), year: estimateYear(plan), error: null };
	} catch (cause) {
		return { error: errorCode(cause) };
	}
});

const spent = computed(() => spentByCategory(budget.value.expenses, month));
const monthExpenses = computed(() => expensesInMonth(budget.value.expenses, month));
const monthTotal = computed(() => totalSpent(budget.value.expenses, month));
const categoriesById = computed(
	() => new Map(budget.value.categories.map((category) => [category.id, category])),
);

function addCategories(categories: NewCategory[]) {
	addError.value = null;
	justSaved.value = false;
	try {
		store.addCategories(categories);
	} catch (cause) {
		addError.value = errorCode(cause);
	}
}

function addCategory() {
	const number = budget.value.categories.length + 1;
	addCategories([
		{ name: t("budget.category.defaultName", { number }), group: "needs", planned: 0 },
	]);
}

function addSuggestedCategories() {
	addCategories(
		SUGGESTED_CATEGORIES.map(({ key, group }) => ({
			name: t(`budget.suggested.${key}`),
			group,
			planned: 0,
		})),
	);
}

async function removeCategory(category: BudgetCategory) {
	const count = budget.value.expenses.filter(
		(expense) => expense.categoryId === category.id,
	).length;
	const confirmed = await confirm({
		title: t("budget.confirmRemoveCategory.title", { name: category.name }),
		message: t("budget.confirmRemoveCategory.message", { count }, count),
		confirmLabel: t("budget.confirmRemoveCategory.confirm"),
		destructive: true,
	});
	if (confirmed) store.removeCategory(category.id);
}

function expenseTitle(expense: Expense): string {
	return expense.description || categoryName(expense);
}

function categoryName(expense: Expense): string {
	return categoriesById.value.get(expense.categoryId)?.name ?? "";
}

function expenseGroup(expense: Expense): BudgetGroup {
	return categoriesById.value.get(expense.categoryId)?.group ?? "needs";
}

async function removeExpense(expense: Expense) {
	const confirmed = await confirm({
		title: t("budget.confirmRemoveExpense.title"),
		message: t("budget.confirmRemoveExpense.message", {
			description: expenseTitle(expense),
			amount: n(expense.amount, "currency"),
		}),
		confirmLabel: t("budget.confirmRemoveExpense.confirm"),
		destructive: true,
	});
	if (confirmed) store.removeExpense(expense.id);
}
</script>

<template>
	<div class="flex flex-col gap-8">
		<header class="flex flex-wrap items-end justify-between gap-4">
			<div class="flex max-w-2xl flex-col gap-3">
				<span class="chip tone-brand self-start">
					<AppIcon name="budget" :size="14" />
					{{ t("budget.eyebrow") }}
				</span>
				<h1 class="text-title sm:text-display">{{ t("budget.title") }}</h1>
				<p class="text-lead text-ink-muted">{{ t("budget.subtitle") }}</p>
			</div>
			<SaveControl
				v-if="!loading && !loadError"
				:label="t('budget.save')"
				:saved-message="t('budget.saved')"
				:has-unsaved-changes="hasUnsavedChanges"
				:saving="saving"
				:just-saved="justSaved"
				:error="saveError"
				@save="save"
			/>
		</header>

		<LessonBadges screen="budget" />

		<p v-if="loading" class="text-ink-muted" aria-live="polite">{{ t("budget.loading") }}</p>

		<section v-else-if="loadError" class="card flex flex-col items-start gap-4">
			<p class="font-semibold text-tangerine-strong">{{ t(`errors.${loadError}`) }}</p>
			<button type="button" class="btn-secondary" @click="load">{{ t("budget.retry") }}</button>
		</section>

		<template v-else>
			<section class="card flex flex-col gap-4">
				<div>
					<h2 class="text-heading">{{ t("budget.salary.title") }}</h2>
					<p class="text-sm text-ink-muted">{{ t("budget.salary.subtitle") }}</p>
				</div>
				<div class="flex flex-wrap items-end gap-x-8 gap-y-4">
					<div class="w-full sm:max-w-xs">
						<NumberField
							v-model="budget.salary"
							:label="t('budget.salary.label')"
							unit="€"
							:min="0"
							:step="50"
						/>
					</div>
					<dl v-if="!outcome.error" class="flex gap-8 pb-3">
						<div>
							<dt class="text-sm text-ink-muted">{{ t("budget.salary.planned") }}</dt>
							<dd class="font-bold tabular-nums">
								{{ n(outcome.plan.totalPlanned, "currency") }}
							</dd>
						</div>
						<div>
							<dt class="text-sm text-ink-muted">
								{{ outcome.plan.unassigned < 0 ? t("budget.salary.overAssigned") : t("budget.salary.unassigned") }}
							</dt>
							<dd
								class="font-bold tabular-nums"
								:class="outcome.plan.unassigned < 0 ? 'text-tangerine-strong' : 'text-brand-strong'"
							>
								{{ n(Math.abs(outcome.plan.unassigned), "currency") }}
							</dd>
						</div>
					</dl>
				</div>
			</section>

			<section class="flex flex-col gap-4">
				<div class="flex flex-wrap items-end justify-between gap-3">
					<div>
						<h2 class="text-heading">{{ t("budget.categories.title") }}</h2>
						<p class="text-sm text-ink-muted">
							{{ t("budget.categories.subtitle", { max: MAX_CATEGORIES }) }}
						</p>
					</div>
					<button
						type="button"
						class="btn-secondary btn-sm"
						:disabled="isFull"
						@click="addCategory"
					>
						<AppIcon name="add" :size="16" />
						{{ t("budget.categories.add") }}
					</button>
				</div>
				<p v-if="isFull" class="text-sm text-ink-muted">
					{{ t("budget.categories.full", { max: MAX_CATEGORIES }) }}
				</p>
				<p v-if="addError" class="text-sm font-semibold text-tangerine-strong" role="alert">
					{{ t(`errors.${addError}`) }}
				</p>

				<div v-if="budget.categories.length" class="grid grid-cols-1 gap-4 lg:grid-cols-2">
					<BudgetCategoryCard
						v-for="category in budget.categories"
						:key="category.id"
						:category="category"
						:spent="spent.get(category.id) ?? 0"
						@remove="removeCategory(category)"
					/>
				</div>
				<div v-else class="panel tone-neutral flex flex-col items-start gap-3">
					<span class="icon-tile tone-brand">
						<AppIcon name="budget" />
					</span>
					<h3 class="text-subheading">{{ t("budget.categories.emptyTitle") }}</h3>
					<p class="text-ink-muted">{{ t("budget.categories.emptyDetail") }}</p>
					<button type="button" class="btn-secondary btn-sm" @click="addSuggestedCategories">
						<AppIcon name="sparkle" :size="16" />
						{{ t("budget.categories.useSuggested") }}
					</button>
				</div>
			</section>

			<section class="flex flex-col gap-4">
				<div>
					<h2 class="text-heading">{{ t("budget.expenses.title") }}</h2>
					<p class="text-sm text-ink-muted">{{ t("budget.expenses.subtitle") }}</p>
				</div>
				<div class="card flex flex-col gap-5">
					<ExpenseForm v-if="budget.categories.length" :categories="budget.categories" />
					<p v-else class="text-sm text-ink-muted">{{ t("budget.expenses.needCategory") }}</p>

					<ul v-if="monthExpenses.length" class="flex flex-col divide-y divide-line">
						<li v-for="expense in monthExpenses" :key="expense.id">
							<StatRow
								:icon="BUDGET_GROUP_ICONS[expenseGroup(expense)]"
								:tone="BUDGET_GROUP_TONES[expenseGroup(expense)]"
								:title="expenseTitle(expense)"
								:detail="t('budget.expenses.detail', { category: categoryName(expense), date: d(dateFromKey(expense.date), 'dayMonth') })"
								:value="n(expense.amount, 'currency')"
							>
								<template #trailing>
									<button
										type="button"
										class="btn-secondary btn-icon"
										:aria-label="t('budget.expenses.remove', { name: expenseTitle(expense), amount: n(expense.amount, 'currency') })"
										@click="removeExpense(expense)"
									>
										<AppIcon name="remove" :size="16" />
									</button>
								</template>
							</StatRow>
						</li>
					</ul>
					<p v-else-if="budget.categories.length" class="text-sm text-ink-muted">
						{{ t("budget.expenses.empty") }}
					</p>

					<StatRow
						v-if="monthExpenses.length && !outcome.error"
						icon="expense"
						tone="sun"
						:title="t('budget.expenses.total')"
						:detail="t('budget.expenses.totalDetail', { planned: n(outcome.plan.totalPlanned, 'currency') })"
						:value="n(monthTotal, 'currency')"
						class="border-t border-line-strong"
					/>
				</div>
			</section>

			<p v-if="outcome.error" class="card font-semibold text-tangerine-strong" role="alert">
				{{ t(`errors.${outcome.error}`) }}
			</p>
			<template v-else>
				<section class="flex flex-col gap-4">
					<div>
						<h2 class="text-heading">{{ t("budget.rule.title") }}</h2>
						<p class="text-sm text-ink-muted">{{ t("budget.rule.subtitle") }}</p>
					</div>
					<div class="card flex flex-col gap-2">
						<BudgetRuleCheck v-if="outcome.rule" :checks="outcome.rule" />
						<p v-else class="text-sm text-ink-muted">{{ t("budget.rule.noSalary") }}</p>
						<p v-if="outcome.rule" class="text-xs text-ink-muted">{{ t("budget.rule.savingsNote") }}</p>
					</div>
				</section>

				<section class="flex flex-col gap-4">
					<div>
						<h2 class="text-heading">{{ t("budget.year.title") }}</h2>
						<p class="text-sm text-ink-muted">{{ t("budget.year.subtitle") }}</p>
					</div>
					<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
						<StatCard
							icon="calendar"
							tone="grape"
							:label="t('budget.year.income')"
							:value="n(outcome.year.income, 'currency')"
							:detail="t('budget.year.incomeDetail', { monthly: n(outcome.plan.salary, 'currency') })"
						/>
						<StatCard
							icon="expense"
							tone="tangerine"
							:label="t('budget.year.spending')"
							:value="n(outcome.year.spending, 'currency')"
							:detail="t('budget.year.spendingDetail')"
						/>
						<StatCard
							v-if="outcome.year.saving >= 0"
							icon="savings"
							tone="brand"
							:label="t('budget.year.saving')"
							:value="n(outcome.year.saving, 'currency')"
							:detail="t('budget.year.savingDetail')"
						/>
						<StatCard
							v-else
							icon="alert"
							tone="tangerine"
							:label="t('budget.year.deficit')"
							:value="n(-outcome.year.saving, 'currency')"
							:detail="t('budget.year.deficitDetail')"
						/>
					</div>
				</section>
			</template>
		</template>
	</div>
</template>
