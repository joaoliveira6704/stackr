<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import AppIcon from "../components/AppIcon.vue";
import { seriesColor } from "../components/chart-colors";
import DurationPicker from "../components/DurationPicker.vue";
import HoldingCard from "../components/HoldingCard.vue";
import LessonBadges from "../components/LessonBadges.vue";
import NumberField from "../components/NumberField.vue";
import SaveControl from "../components/SaveControl.vue";
import SimulationEntryCard from "../components/SimulationEntryCard.vue";
import SimulatorResults from "../components/SimulatorResults.vue";
import TickerSearch from "../components/TickerSearch.vue";
import TrialVerdict from "../components/TrialVerdict.vue";
import { dateKey, monthKey, planMonth } from "../lib/budget";
import { AppError, type ErrorCode, errorCode } from "../lib/errors";
import { sumMoney } from "../lib/money";
import {
	currentValue,
	type Holding,
	holdingFromTicker,
	newHolding,
	recordName,
	registeredPlans,
	type TickerChoice,
} from "../lib/portfolio";
import {
	type HoldingPlan,
	type Projection,
	projectPortfolio,
	projectScenarios,
	type Scenarios,
} from "../lib/projection";
import { compareTrial, type TrialComparison } from "../lib/trial-investment";
import { useConfirm } from "../lib/use-confirm";
import { useSavedPlan } from "../lib/use-saved-plan";
import { useBudgetStore } from "../stores/budget";
import { usePortfolioStore } from "../stores/portfolio";

const store = usePortfolioStore();
const budgetStore = useBudgetStore();
const { portfolio, hasUnsavedChanges } = storeToRefs(store);
const { confirm } = useConfirm();
const { t, n } = useI18n();

// The what-if investment lives only on this screen, so trying an idea never
// changes the portfolio the user registered.
const trial = ref<Holding | null>(null);
const addingTrial = ref(false);
const trialError = ref<ErrorCode | null>(null);
const trialNotice = ref<string | null>(null);
// The day is read once, so every figure on screen agrees.
const today = dateKey(new Date());
const budgetLoaded = ref(false);

async function loadBudget() {
	try {
		await budgetStore.load();
		budgetLoaded.value = true;
	} catch (cause) {
		// The simulator still works without a budget, it just cannot say
		// whether a new investment fits.
		if (!(cause instanceof AppError)) throw cause;
		budgetLoaded.value = false;
	}
}

/** Money left each month after the simulated deposits, null when not known. */
const freeMonthly = computed(() => {
	if (!budgetLoaded.value) return null;
	const deposits = registeredPlans(portfolio.value, today).map(
		(plan) => plan.monthly,
	);
	try {
		const plan = planMonth(
			budgetStore.budget,
			monthKey(new Date()),
			sumMoney(deposits),
		);
		return plan.salary > 0 ? plan.unassigned : null;
	} catch {
		return null;
	}
});

async function loadSimulator() {
	await store.load();
	await loadBudget();
}

const { loading, loadError, saving, saveError, justSaved, load, save } =
	useSavedPlan(
		{ load: loadSimulator, save: store.save },
		hasUnsavedChanges,
		() => ({
			title: t("simulator.confirmLeave.title"),
			message: t("simulator.confirmLeave.message"),
			confirmLabel: t("simulator.confirmLeave.confirm"),
		}),
	);

const registeredCount = computed(
	() => portfolio.value.holdings.length + portfolio.value.savings.length,
);

// Colours keep counting across both groups, so each record matches its series
// in the charts below.
const registeredGroups = computed(() => {
	const { holdings, savings } = portfolio.value;
	return [
		{ key: "investments", entries: holdings, firstColor: 0 },
		{ key: "savings", entries: savings, firstColor: holdings.length },
	]
		.filter((group) => group.entries.length)
		.map((group) => ({
			...group,
			total: sumMoney(
				group.entries.map((entry) => currentValue(entry, today)),
			),
		}));
});

const simulatedEntries = computed(() =>
	[
		...portfolio.value.holdings,
		...portfolio.value.savings,
		...(trial.value ? [trial.value] : []),
	].map((entry) => ({
		id: entry.id,
		name: recordName(entry),
		initial: entry.initial,
		monthly: entry.monthly,
	})),
);

function planOf({ id, initial, monthly, annualReturnPercent }: Holding): HoldingPlan {
	return { id, initial, monthly, annualReturnPercent };
}

type Outcome =
	| {
			projection: Projection;
			scenarios: Scenarios;
			comparison: TrialComparison | null;
			error: null;
	  }
	| { error: ErrorCode };

const outcome = computed<Outcome | null>(() => {
	if (!simulatedEntries.value.length) return null;
	const { years, inflationPercent } = portfolio.value;
	const settings = { years, inflationPercent };
	const base = registeredPlans(portfolio.value, today);
	const plans = trial.value ? [...base, planOf(trial.value)] : base;
	try {
		return {
			projection: projectPortfolio(plans, settings),
			scenarios: projectScenarios(plans, settings),
			comparison: trial.value
				? compareTrial(base, planOf(trial.value), settings, freeMonthly.value)
				: null,
			error: null,
		};
	} catch (cause) {
		return { error: errorCode(cause) };
	}
});

async function addTrialTicker(choice: TickerChoice) {
	addingTrial.value = true;
	trialError.value = null;
	trialNotice.value = null;
	try {
		const holding = await holdingFromTicker(choice);
		trial.value = holding;
		if (holding.returnSource === "manual") {
			trialNotice.value = t("simulator.search.noHistoryNotice", { name: holding.name });
		}
	} catch (cause) {
		trialError.value = errorCode(cause);
	} finally {
		addingTrial.value = false;
	}
}

function addTrialManual() {
	trialError.value = null;
	trialNotice.value = null;
	trial.value = newHolding({ name: t("simulator.trial.defaultName") });
}

async function removeTrial() {
	if (!trial.value) return;
	const confirmed = await confirm({
		title: t("simulator.trial.confirmRemove.title", { name: trial.value.name }),
		message: t("simulator.trial.confirmRemove.message"),
		confirmLabel: t("simulator.trial.confirmRemove.confirm"),
		destructive: true,
	});
	if (confirmed) {
		trial.value = null;
		trialNotice.value = null;
	}
}
</script>

<template>
	<div class="flex flex-col gap-8">
		<header class="flex flex-wrap items-end justify-between gap-4">
			<div class="flex max-w-2xl flex-col gap-3">
				<span class="chip tone-brand self-start">
					<AppIcon name="simulator" :size="14" />
					{{ t("simulator.eyebrow") }}
				</span>
				<h1 class="text-title sm:text-display">{{ t("simulator.title") }}</h1>
				<p class="text-lead text-ink-muted">{{ t("simulator.subtitle") }}</p>
			</div>
			<SaveControl
				v-if="!loading && !loadError"
				:label="t('simulator.save')"
				:saved-message="t('simulator.saved')"
				:has-unsaved-changes="hasUnsavedChanges"
				:saving="saving"
				:just-saved="justSaved"
				:error="saveError"
				@save="save"
			/>
		</header>

		<LessonBadges screen="simulator" />

		<p v-if="loading" class="text-ink-muted" aria-live="polite">{{ t("simulator.loading") }}</p>

		<section v-else-if="loadError" class="card flex flex-col items-start gap-4">
			<p class="font-semibold text-tangerine-strong">{{ t(`errors.${loadError}`) }}</p>
			<button type="button" class="btn-secondary" @click="load">{{ t("simulator.retry") }}</button>
		</section>

		<template v-else>
			<section class="card flex flex-col gap-4">
				<div>
					<h2 class="text-heading">{{ t("simulator.settings.title") }}</h2>
					<p class="text-sm text-ink-muted">{{ t("simulator.settings.subtitle") }}</p>
				</div>
				<div class="sm:max-w-xs">
					<NumberField
						v-model="portfolio.inflationPercent"
						:label="t('simulator.settings.inflation')"
						unit="%"
						:step="0.1"
					/>
				</div>
			</section>

			<section class="flex flex-col gap-4">
				<div class="flex flex-wrap items-end justify-between gap-3">
					<div>
						<h2 class="text-heading">{{ t("simulator.portfolio.title") }}</h2>
						<p class="text-sm text-ink-muted">{{ t("simulator.portfolio.subtitle") }}</p>
					</div>
					<RouterLink to="/register" class="btn-secondary btn-sm">
						<AppIcon name="register" :size="16" />
						{{ t("simulator.portfolio.edit") }}
					</RouterLink>
				</div>
				<div v-if="registeredCount" class="flex flex-col gap-6">
					<section
						v-for="group in registeredGroups"
						:key="group.key"
						class="flex flex-col gap-3"
					>
						<div class="flex items-baseline justify-between gap-3">
							<h3 class="text-subheading">{{ t(`simulator.portfolio.${group.key}`) }}</h3>
							<p class="font-bold whitespace-nowrap tabular-nums">{{ n(group.total, "currency") }}</p>
						</div>
						<div class="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
							<SimulationEntryCard
								v-for="(entry, index) in group.entries"
								:key="entry.id"
								:entry="entry"
								:color="seriesColor(group.firstColor + index)"
								:today="today"
							/>
						</div>
					</section>
				</div>
				<div v-else class="panel tone-neutral flex flex-col items-start gap-2">
					<span class="icon-tile tone-brand">
						<AppIcon name="register" />
					</span>
					<h3 class="text-subheading">{{ t("simulator.portfolio.emptyTitle") }}</h3>
					<p class="text-ink-muted">{{ t("simulator.portfolio.emptyDetail") }}</p>
				</div>
			</section>

			<section class="flex flex-col gap-4">
				<div class="flex flex-wrap items-end justify-between gap-3">
					<div>
						<h2 class="text-heading">{{ t("simulator.trial.title") }}</h2>
						<p class="text-sm text-ink-muted">{{ t("simulator.trial.subtitle") }}</p>
					</div>
					<button
						v-if="!trial"
						type="button"
						class="btn-secondary btn-sm"
						:disabled="addingTrial"
						@click="addTrialManual"
					>
						<AppIcon name="manual" :size="16" />
						{{ t("simulator.holdings.addManual") }}
					</button>
				</div>
				<div v-if="!trial" class="card flex flex-col gap-3">
					<TickerSearch :disabled="addingTrial" @pick="addTrialTicker" />
					<p v-if="addingTrial" class="text-sm text-ink-muted" aria-live="polite">
						{{ t("simulator.search.adding") }}
					</p>
					<p v-if="trialError" class="text-sm font-semibold text-tangerine-strong" role="alert">
						{{ t(`errors.${trialError}`) }}
					</p>
				</div>
				<template v-else>
					<p v-if="trialNotice" class="chip tone-sun self-start" role="status">
						<AppIcon name="info" :size="14" />
						{{ trialNotice }}
					</p>
					<HoldingCard
						:holding="trial"
						:color="seriesColor(registeredCount)"
						@remove="removeTrial"
					/>
					<TrialVerdict
						v-if="outcome && !outcome.error && outcome.comparison"
						:comparison="outcome.comparison"
						:years="portfolio.years"
					/>
				</template>
			</section>

			<section v-if="outcome" class="flex flex-col gap-4">
				<h2 class="text-heading">{{ t("simulator.results.title", { years: portfolio.years }, portfolio.years) }}</h2>
				<!-- Right above the numbers it changes, so the effect is seen at once. -->
				<DurationPicker v-model="portfolio.years" />
				<p
					v-if="outcome.error"
					class="card font-semibold text-tangerine-strong"
					role="alert"
				>
					{{ t(`errors.${outcome.error}`) }}
				</p>
				<SimulatorResults
					v-else
					:projection="outcome.projection"
					:scenarios="outcome.scenarios"
					:holdings="simulatedEntries"
					:years="portfolio.years"
				/>
			</section>
		</template>
	</div>
</template>
