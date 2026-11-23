<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed, onUnmounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import AppIcon from "../components/AppIcon.vue";
import AutoSaveStatus from "../components/AutoSaveStatus.vue";
import InvestmentStatsPanel from "../components/InvestmentStatsPanel.vue";
import LessonBadges from "../components/LessonBadges.vue";
import RegisterEditDialog from "../components/RegisterEditDialog.vue";
import RegisterEntryCard from "../components/RegisterEntryCard.vue";
import RegisterEntryDialog from "../components/RegisterEntryDialog.vue";
import SavingsStatsPanel from "../components/SavingsStatsPanel.vue";
import StatCard from "../components/StatCard.vue";
import TickerSearch from "../components/TickerSearch.vue";
import { dateKey } from "../lib/budget";
import {
	type Holding,
	investmentStats,
	MAX_HOLDINGS,
	MAX_SAVINGS,
	type NewRecord,
	recordName,
	registeredTotals,
	type SavingsEntry,
	savingsStats,
	type TickerChoice,
} from "../lib/portfolio";
import { useConfirm } from "../lib/use-confirm";
import { useSavedPlan } from "../lib/use-saved-plan";
import { usePortfolioStore } from "../stores/portfolio";

const store = usePortfolioStore();
const { portfolio, hasUnsavedChanges, isFull, isSavingsFull } =
	storeToRefs(store);
const { confirm } = useConfirm();
const { t, n } = useI18n();

// The day is read once, like on the budget, so every figure on screen agrees.
const today = dateKey(new Date());
const recordInDialog = ref<NewRecord | null>(null);
const recordInEdit = ref<Holding | SavingsEntry | null>(null);
const addNotice = ref<string | null>(null);

let isOnScreen = true;
onUnmounted(() => {
	isOnScreen = false;
});

// Prices arrive after the page is up, so a slow market never holds it back.
async function loadAndRefreshPrices() {
	await store.load();
	void store.refreshQuotes(() => isOnScreen);
}

const { loading, loadError, saving, saveError, justSaved, load, saveLatest } =
	useSavedPlan(
		{ load: loadAndRefreshPrices, save: store.save },
		hasUnsavedChanges,
		() => ({
			title: t("register.confirmLeave.title"),
			message: t("register.confirmLeave.message"),
			confirmLabel: t("register.confirmLeave.confirm"),
		}),
		{ source: portfolio, canSave: () => true },
	);

const totals = computed(() => registeredTotals(portfolio.value, today));
const investmentSummary = computed(() =>
	portfolio.value.holdings.length
		? investmentStats(portfolio.value.holdings)
		: null,
);
const savingsSummary = computed(() =>
	portfolio.value.savings.length
		? savingsStats(portfolio.value.savings, today)
		: null,
);

function openDialog(record: NewRecord) {
	addNotice.value = null;
	recordInDialog.value = record;
}

function pickTicker(ticker: TickerChoice) {
	openDialog({ kind: "investment", ticker });
}

function noteMissingHistory(holding: Holding) {
	if (holding.symbol && holding.returnSource === "manual") {
		addNotice.value = t("register.noHistoryNotice", { name: holding.name });
	}
}

async function removeHolding(holding: Holding) {
	const confirmed = await confirm({
		title: t("simulator.confirmRemove.title", { name: recordName(holding) }),
		message: t("simulator.confirmRemove.message"),
		confirmLabel: t("simulator.confirmRemove.confirm"),
		destructive: true,
	});
	if (confirmed) store.removeHolding(holding.id);
}

async function removeSavings(entry: SavingsEntry) {
	const confirmed = await confirm({
		title: t("register.savings.confirmRemove.title", {
			name: recordName(entry),
		}),
		message: t("register.savings.confirmRemove.message"),
		confirmLabel: t("register.savings.confirmRemove.confirm"),
		destructive: true,
	});
	if (confirmed) store.removeSavings(entry.id);
}
</script>

<template>
	<div class="flex flex-col gap-8">
		<header class="flex flex-wrap items-end justify-between gap-4">
			<div class="flex max-w-2xl flex-col gap-3">
				<span class="chip tone-brand self-start">
					<AppIcon name="register" :size="14" />
					{{ t("register.eyebrow") }}
				</span>
				<h1 class="text-title sm:text-display">{{ t("register.title") }}</h1>
				<p class="text-lead text-ink-muted">{{ t("register.subtitle") }}</p>
			</div>
			<AutoSaveStatus
				v-if="!loading && !loadError"
				:saved-message="t('register.saved')"
				:retry-label="t('register.retry')"
				:has-unsaved-changes="hasUnsavedChanges"
				:can-save="true"
				:saving="saving"
				:just-saved="justSaved"
				:error="saveError"
				@retry="saveLatest"
			/>
		</header>

		<LessonBadges screen="register" />

		<p v-if="loading" class="text-ink-muted" aria-live="polite">{{ t("register.loading") }}</p>

		<section v-else-if="loadError" class="card flex flex-col items-start gap-4">
			<p class="font-semibold text-tangerine-strong">{{ t(`errors.${loadError}`) }}</p>
			<button type="button" class="btn-secondary" @click="load">{{ t("register.retry") }}</button>
		</section>

		<template v-else>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<StatCard
					icon="invested"
					tone="brand"
					:label="t('register.totals.value')"
					:value="n(totals.value, 'currency')"
					:detail="t('register.totals.valueDetail')"
				/>
				<StatCard
					icon="savings"
					tone="grape"
					:label="t('register.totals.monthly')"
					:value="n(totals.depositedThisMonth, 'currency')"
					:detail="t('register.totals.monthlyDetail')"
				/>
			</div>

			<section class="flex flex-col gap-4">
				<div class="flex flex-wrap items-end justify-between gap-3">
					<div>
						<h2 class="text-heading">{{ t("register.investments.title") }}</h2>
						<p class="text-sm text-ink-muted">
							{{ t("register.investments.subtitle", { max: MAX_HOLDINGS }) }}
						</p>
					</div>
					<button
						type="button"
						class="btn-secondary btn-sm"
						:disabled="isFull"
						@click="openDialog({ kind: 'investment', ticker: null })"
					>
						<AppIcon name="manual" :size="16" />
						{{ t("simulator.holdings.addManual") }}
					</button>
				</div>

				<div class="card flex flex-col gap-3">
					<TickerSearch :disabled="isFull" @pick="pickTicker" />
					<p v-if="isFull" class="text-sm text-ink-muted">
						{{ t("simulator.holdings.full", { max: MAX_HOLDINGS }) }}
					</p>
					<p v-if="addNotice" class="chip tone-sun self-start" role="status">
						<AppIcon name="info" :size="14" />
						{{ addNotice }}
					</p>
				</div>

				<div v-if="portfolio.holdings.length" class="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
					<RegisterEntryCard
						v-for="holding in portfolio.holdings"
						:key="holding.id"
						:entry="holding"
						:today="today"
						@edit="recordInEdit = holding"
						@remove="removeHolding(holding)"
					/>
				</div>
				<div v-else class="panel tone-neutral flex flex-col items-start gap-2">
					<span class="icon-tile tone-brand">
						<AppIcon name="simulator" />
					</span>
					<h3 class="text-subheading">{{ t("simulator.holdings.emptyTitle") }}</h3>
					<p class="text-ink-muted">{{ t("register.investments.emptyDetail") }}</p>
				</div>
				<InvestmentStatsPanel v-if="investmentSummary" :stats="investmentSummary" />
			</section>

			<section class="flex flex-col gap-4">
				<div class="flex flex-wrap items-end justify-between gap-3">
					<div>
						<h2 class="text-heading">{{ t("register.savings.title") }}</h2>
						<p class="text-sm text-ink-muted">
							{{ t("register.savings.subtitle", { max: MAX_SAVINGS }) }}
						</p>
					</div>
					<button
						v-if="portfolio.savings.length"
						type="button"
						class="btn-primary btn-sm"
						:disabled="isSavingsFull"
						@click="openDialog({ kind: 'savings' })"
					>
						<AppIcon name="add" :size="16" />
						{{ t("register.savings.add") }}
					</button>
				</div>
				<p v-if="isSavingsFull" class="text-sm text-ink-muted">
					{{ t("register.savings.full", { max: MAX_SAVINGS }) }}
				</p>
				<button
					v-if="!portfolio.savings.length"
					type="button"
					class="glass flex items-center gap-3 rounded-card p-4 text-left transition-colors hover:bg-glass-strong"
					@click="openDialog({ kind: 'savings' })"
				>
					<span class="icon-tile icon-tile-sm tone-brand">
						<AppIcon name="add" :size="16" />
					</span>
					<span class="min-w-0">
						<span class="block font-bold">{{ t("register.savings.add") }}</span>
						<span class="block text-sm text-ink-muted">{{ t("register.savings.empty") }}</span>
					</span>
				</button>
				<div v-if="portfolio.savings.length" class="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
					<RegisterEntryCard
						v-for="entry in portfolio.savings"
						:key="entry.id"
						:entry="entry"
						:today="today"
						@edit="recordInEdit = entry"
						@remove="removeSavings(entry)"
					/>
				</div>
				<SavingsStatsPanel v-if="savingsSummary" :stats="savingsSummary" />
			</section>

			<RegisterEntryDialog
				v-if="recordInDialog"
				:record="recordInDialog"
				@added-holding="noteMissingHistory"
				@close="recordInDialog = null"
			/>
			<RegisterEditDialog
				v-if="recordInEdit"
				:entry="recordInEdit"
				@close="recordInEdit = null"
			/>
		</template>
	</div>
</template>
