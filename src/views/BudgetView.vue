<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import AppIcon from "../components/AppIcon.vue";
import AutoSaveStatus from "../components/AutoSaveStatus.vue";
import BudgetCategoryCard from "../components/BudgetCategoryCard.vue";
import BudgetCategoryDialog from "../components/BudgetCategoryDialog.vue";
import BudgetRuleCheck from "../components/BudgetRuleCheck.vue";
import LessonBadges from "../components/LessonBadges.vue";
import NumberField from "../components/NumberField.vue";
import StatCard from "../components/StatCard.vue";
import StatRow from "../components/StatRow.vue";
import {
	type BudgetCategory,
	checkRule,
	dateKey,
	estimateYear,
	MAX_CATEGORIES,
	type MonthlyPlan,
	monthKey,
	paidByCategory,
	planMonth,
	type RuleCheck,
	sumMoney,
	type YearlyEstimate,
} from "../lib/budget";
import { type ErrorCode, errorCode } from "../lib/errors";
import { useConfirm } from "../lib/use-confirm";
import { useSavedPlan } from "../lib/use-saved-plan";
import { useBudgetStore } from "../stores/budget";

const store = useBudgetStore();
const { budget, hasUnsavedChanges, isFull } = storeToRefs(store);
const { confirm } = useConfirm();
const { t, n } = useI18n();

const { loading, loadError, saving, saveError, justSaved, load, saveLatest } =
	useSavedPlan(
		store,
		hasUnsavedChanges,
		() => ({
			title: t("budget.confirmLeave.title"),
			message: t("budget.confirmLeave.message"),
			confirmLabel: t("budget.confirmLeave.confirm"),
		}),
		{ source: budget, canSave: () => !outcome.value.error },
	);

// The month is read once, so a page left open past midnight on the last day
// keeps showing the month the user started in.
const now = new Date();
const today = dateKey(now);
const month = monthKey(now);

// Null while the dialog is closed, "new" to add a category, or the one being edited.
const categoryInDialog = ref<BudgetCategory | "new" | null>(null);

type Outcome =
	| { plan: MonthlyPlan; rule: RuleCheck[] | null; year: YearlyEstimate; error: null }
	| { error: ErrorCode };

const outcome = computed<Outcome>(() => {
	try {
		const plan = planMonth(budget.value, month);
		return { plan, rule: checkRule(plan), year: estimateYear(plan), error: null };
	} catch (cause) {
		return { error: errorCode(cause) };
	}
});

const spent = computed(() => paidByCategory(budget.value, today));
const paidTotal = computed(() => sumMoney([...spent.value.values()]));
const billsTotal = computed(() =>
	sumMoney(budget.value.categories.map((category) => category.planned)),
);

function openCategoryDialog(category: BudgetCategory | "new") {
	categoryInDialog.value = category;
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
			<AutoSaveStatus
				v-if="!loading && !loadError"
				:saved-message="t('budget.saved')"
				:retry-label="t('budget.retry')"
				:has-unsaved-changes="hasUnsavedChanges"
				:can-save="!outcome.error"
				:saving="saving"
				:just-saved="justSaved"
				:error="saveError"
				@retry="saveLatest"
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
						v-if="budget.categories.length"
						type="button"
						class="btn-primary btn-sm"
						:disabled="isFull"
						@click="openCategoryDialog('new')"
					>
						<AppIcon name="add" :size="16" />
						{{ t("budget.categories.add") }}
					</button>
				</div>
				<p v-if="isFull" class="text-sm text-ink-muted">
					{{ t("budget.categories.full", { max: MAX_CATEGORIES }) }}
				</p>

				<div class="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
					<button
						v-if="!budget.categories.length"
						type="button"
						class="glass flex items-center gap-3 rounded-card p-4 text-left transition-colors hover:bg-glass-strong"
						@click="openCategoryDialog('new')"
					>
						<span class="icon-tile icon-tile-sm tone-brand">
							<AppIcon name="add" :size="16" />
						</span>
						<span class="min-w-0">
							<span class="block font-bold">{{ t("budget.categories.add") }}</span>
							<span class="block text-sm text-ink-muted">
								{{ t("budget.categories.emptyTitle") }}
							</span>
						</span>
					</button>
					<BudgetCategoryCard
						v-for="category in budget.categories"
						:key="category.id"
						:category="category"
						:spent="spent.get(category.id) ?? 0"
						:today="today"
						@edit="openCategoryDialog(category)"
						@remove="removeCategory(category)"
					/>
				</div>
				<div v-if="paidTotal > 0 && !outcome.error" class="card">
					<StatRow
						icon="expense"
						tone="sun"
						:title="t('budget.categories.total')"
						:detail="t('budget.categories.totalDetail', { planned: n(billsTotal, 'currency') })"
						:value="n(paidTotal, 'currency')"
					/>
				</div>
			</section>

			<BudgetCategoryDialog
				v-if="categoryInDialog"
				:category="categoryInDialog === 'new' ? undefined : categoryInDialog"
				@close="categoryInDialog = null"
			/>

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
							v-if="outcome.year.shortfall === 0"
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
							:value="n(outcome.year.shortfall, 'currency')"
							:detail="t('budget.year.deficitDetail')"
						/>
					</div>
				</section>
			</template>
		</template>
	</div>
</template>
