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
import SimulatorResults from "../components/SimulatorResults.vue";
import TickerSearch from "../components/TickerSearch.vue";
import { type ErrorCode, errorCode } from "../lib/errors";
import type { Holding } from "../lib/portfolio";
import { MAX_HOLDINGS } from "../lib/portfolio";
import {
	type Projection,
	projectPortfolio,
	projectScenarios,
	type Scenarios,
} from "../lib/projection";
import { useConfirm } from "../lib/use-confirm";
import { useSavedPlan } from "../lib/use-saved-plan";
import { type TickerChoice, usePortfolioStore } from "../stores/portfolio";

const store = usePortfolioStore();
const { portfolio, hasUnsavedChanges, isFull } = storeToRefs(store);
const { confirm } = useConfirm();
const { t } = useI18n();

const adding = ref(false);
const addError = ref<ErrorCode | null>(null);
const addNotice = ref<string | null>(null);

const { loading, loadError, saving, saveError, justSaved, load, save } =
	useSavedPlan(store, hasUnsavedChanges, () => ({
		title: t("simulator.confirmLeave.title"),
		message: t("simulator.confirmLeave.message"),
		confirmLabel: t("simulator.confirmLeave.confirm"),
	}));

type Outcome =
	| { projection: Projection; scenarios: Scenarios; error: null }
	| { error: ErrorCode };

const outcome = computed<Outcome | null>(() => {
	const { holdings, years, inflationPercent } = portfolio.value;
	if (!holdings.length) return null;
	const plans = holdings.map(({ id, initial, monthly, annualReturnPercent }) => ({
		id,
		initial,
		monthly,
		annualReturnPercent,
	}));
	const settings = { years, inflationPercent };
	try {
		return {
			projection: projectPortfolio(plans, settings),
			scenarios: projectScenarios(plans, settings),
			error: null,
		};
	} catch (cause) {
		return { error: errorCode(cause) };
	}
});

async function runAdd(add: () => Promise<Holding> | Holding) {
	adding.value = true;
	addError.value = null;
	addNotice.value = null;
	justSaved.value = false;
	try {
		const holding = await add();
		if (holding.symbol && holding.returnSource === "manual") {
			addNotice.value = t("simulator.search.noHistoryNotice", { name: holding.name });
		}
	} catch (cause) {
		addError.value = errorCode(cause);
	} finally {
		adding.value = false;
	}
}

function addTicker(choice: TickerChoice) {
	void runAdd(() => store.addTicker(choice));
}

function addManual() {
	const name = t("simulator.holding.defaultName", {
		number: portfolio.value.holdings.length + 1,
	});
	void runAdd(() => store.addManual(name));
}

async function removeHolding(holding: Holding) {
	const confirmed = await confirm({
		title: t("simulator.confirmRemove.title", { name: holding.name }),
		message: t("simulator.confirmRemove.message"),
		confirmLabel: t("simulator.confirmRemove.confirm"),
		destructive: true,
	});
	if (confirmed) store.removeHolding(holding.id);
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
						<h2 class="text-heading">{{ t("simulator.holdings.title") }}</h2>
						<p class="text-sm text-ink-muted">
							{{ t("simulator.holdings.subtitle", { max: MAX_HOLDINGS }) }}
						</p>
					</div>
					<button
						type="button"
						class="btn-secondary btn-sm"
						:disabled="isFull || adding"
						@click="addManual"
					>
						<AppIcon name="manual" :size="16" />
						{{ t("simulator.holdings.addManual") }}
					</button>
				</div>

				<div class="card flex flex-col gap-3">
					<TickerSearch :disabled="isFull || adding" @pick="addTicker" />
					<p v-if="adding" class="text-sm text-ink-muted" aria-live="polite">
						{{ t("simulator.search.adding") }}
					</p>
					<p v-if="isFull" class="text-sm text-ink-muted">
						{{ t("simulator.holdings.full", { max: MAX_HOLDINGS }) }}
					</p>
					<p v-if="addError" class="text-sm font-semibold text-tangerine-strong" role="alert">
						{{ t(`errors.${addError}`) }}
					</p>
					<p v-if="addNotice" class="chip tone-sun self-start" role="status">
						<AppIcon name="info" :size="14" />
						{{ addNotice }}
					</p>
				</div>

				<div v-if="portfolio.holdings.length" class="flex flex-col gap-4">
					<HoldingCard
						v-for="(holding, index) in portfolio.holdings"
						:key="holding.id"
						:holding="holding"
						:color="seriesColor(index)"
						@remove="removeHolding(holding)"
					/>
				</div>
				<div v-else class="panel tone-neutral flex flex-col items-start gap-2">
					<span class="icon-tile tone-brand">
						<AppIcon name="simulator" />
					</span>
					<h3 class="text-subheading">{{ t("simulator.holdings.emptyTitle") }}</h3>
					<p class="text-ink-muted">{{ t("simulator.holdings.emptyDetail") }}</p>
				</div>
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
					:holdings="portfolio.holdings"
					:years="portfolio.years"
				/>
			</section>
		</template>
	</div>
</template>
