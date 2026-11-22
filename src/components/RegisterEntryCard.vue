<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { dateFromKey, dateKey } from "../lib/budget";
import { type ErrorCode, errorCode } from "../lib/errors";
import { accrueSavings } from "../lib/interest-accrual";
import {
	type Holding,
	investmentStats,
	isMissingShares,
	recordName,
	type SavingsEntry,
} from "../lib/portfolio";
import { usePortfolioStore } from "../stores/portfolio";
import AppIcon from "./AppIcon.vue";
import NumberField from "./NumberField.vue";
import RecordLog from "./RecordLog.vue";

// A record only moves forward: the user adds money and the value follows.
const props = defineProps<{ entry: Holding | SavingsEntry; today: string }>();
defineEmits<{ edit: []; remove: [] }>();
const store = usePortfolioStore();
const { t, n, d } = useI18n();

const amount = ref(Number.NaN);
const shares = ref(Number.NaN);
const error = ref<ErrorCode | null>(null);

const saving = computed(() => ("interest" in props.entry ? props.entry : null));
const holding = computed(() => ("symbol" in props.entry ? props.entry : null));
const isTicker = computed(() => Boolean(holding.value?.symbol));
const position = computed(() =>
	holding.value ? investmentStats([holding.value]) : null,
);
const missingShares = computed(() => isMissingShares(props.entry));
const priceNote = computed(() => {
	if (!isTicker.value || missingShares.value) return null;
	const quote = holding.value?.quote;
	return quote
		? t("register.entry.priceNote", { date: d(new Date(quote.time), "dayMonthTime") })
		: t("register.entry.noPrice");
});
const startedOn = computed(() =>
	props.entry.startDate
		? t("register.entry.since", {
				date: d(dateFromKey(props.entry.startDate), "dayMonthYear"),
			})
		: null,
);
const accrual = computed(() =>
	saving.value ? accrueSavings(saving.value, props.today) : null,
);
const title = computed(() => recordName(props.entry));
const icon = computed(
	() => props.entry.icon ?? (saving.value ? "savings" : "growth"),
);
const kindLabel = computed(() => {
	const { entry } = props;
	if ("interest" in entry) return t(`register.savings.types.${entry.type}`);
	const kind = entry.kind
		? t(`simulator.kinds.${entry.kind}`)
		: t("simulator.kinds.manual");
	return entry.symbol ? `${entry.symbol} · ${kind}` : kind;
});
const detail = computed(() =>
	props.entry.nametag.trim()
		? `${props.entry.name} · ${kindLabel.value}`
		: kindLabel.value,
);

function addAmount() {
	error.value = null;
	try {
		store.addDeposit(
			props.entry.id,
			amount.value,
			dateKey(new Date()),
			isTicker.value ? shares.value : undefined,
		);
		amount.value = Number.NaN;
		shares.value = Number.NaN;
	} catch (cause) {
		error.value = errorCode(cause);
	}
}
</script>

<template>
	<article class="card flex flex-col gap-5">
		<header class="flex items-start gap-3">
			<span class="icon-tile" :class="saving ? 'tone-brand' : 'tone-grape'">
				<AppIcon :name="icon" />
			</span>
			<div class="min-w-0 flex-1">
				<h3 class="truncate text-subheading">{{ title }}</h3>
				<p class="text-sm text-ink-muted">{{ detail }}</p>
				<p v-if="startedOn" class="mt-0.5 flex items-center gap-1 text-xs text-ink-muted">
					<AppIcon name="calendar" :size="12" />
					{{ startedOn }}
				</p>
			</div>
			<button
				type="button"
				class="btn-secondary btn-icon"
				:aria-label="t('register.entry.edit', { name: title })"
				@click="$emit('edit')"
			>
				<AppIcon name="manual" :size="16" />
			</button>
			<button
				type="button"
				class="btn-secondary btn-icon"
				:aria-label="t('register.entry.remove', { name: title })"
				@click="$emit('remove')"
			>
				<AppIcon name="remove" :size="16" />
			</button>
		</header>

		<div>
			<p class="text-sm text-ink-muted">{{ t("register.entry.current") }}</p>
			<p class="text-heading tabular-nums">{{ n(accrual?.value ?? position?.value ?? entry.initial, "currency") }}</p>
			<p v-if="saving?.startDate && accrual" class="text-sm text-ink-muted tabular-nums">
				{{ t("register.entry.breakdown", {
					deposited: n(accrual.deposited, "currency"),
					interest: n(accrual.interest, "currency"),
				}) }}
			</p>
			<p v-if="isTicker && holding" class="text-sm text-ink-muted tabular-nums">
				{{ t("register.entry.position", {
					invested: n(holding.initial, "currency"),
					shares: n(holding.shares, "shares"),
				}) }}
			</p>
			<p v-else-if="holding" class="text-sm text-ink-muted tabular-nums">
				{{ t("register.entry.investedOnly", { invested: n(holding.initial, "currency") }) }}
			</p>
		</div>
		<span
			v-if="position && position.gain !== 0"
			class="chip self-start tabular-nums"
			:class="position.gain > 0 ? 'tone-brand' : 'tone-tangerine'"
		>
			<AppIcon :name="position.gain > 0 ? 'trendingUp' : 'trendingDown'" :size="14" />
			{{ n(position.gain, "signedCurrency") }} ({{ n(position.gainRate, "signedPercent") }})
		</span>
		<p v-if="priceNote" class="text-xs text-ink-muted">{{ priceNote }}</p>
		<button
			v-if="holding && !holding.startDate"
			type="button"
			class="chip tone-sun self-start"
			@click="$emit('edit')"
		>
			<AppIcon name="calendar" :size="14" />
			{{ t("register.entry.missingInvestmentDate") }}
		</button>
		<button
			v-if="missingShares"
			type="button"
			class="chip tone-sun self-start"
			@click="$emit('edit')"
		>
			<AppIcon name="growth" :size="14" />
			{{ t("register.entry.missingShares") }}
		</button>
		<button
			v-if="saving && !saving.startDate"
			type="button"
			class="chip tone-sun self-start"
			@click="$emit('edit')"
		>
			<AppIcon name="calendar" :size="14" />
			{{ t("register.entry.missingStartDate") }}
		</button>

		<div v-if="saving" class="flex flex-wrap gap-2">
			<span class="chip tone-neutral">{{ t(`register.savings.interestKinds.${saving.interest}`) }}</span>
			<span class="chip tone-neutral">{{ t(`register.savings.rateShort.${saving.rateBasis}`) }}</span>
			<span class="chip tone-neutral">{{ t(`register.savings.ratePaths.${saving.ratePath}`) }}</span>
		</div>

		<form v-if="!missingShares" class="flex items-end gap-3" novalidate @submit.prevent="addAmount">
			<div class="min-w-0 flex-1">
				<NumberField
					v-model="amount"
					:label="t('register.entry.addLabel')"
					unit="€"
					:min="0"
					:step="10"
				/>
			</div>
			<div v-if="isTicker" class="min-w-0 flex-1">
				<NumberField
					v-model="shares"
					:label="t('register.entry.sharesLabel')"
					:min="0"
				/>
			</div>
			<!-- The margin centres the round button on the taller field. -->
			<button
				type="submit"
				class="btn-primary btn-icon mb-1.5 shrink-0"
				:aria-label="t('register.entry.add', { name: title })"
				:title="t('register.entry.add', { name: title })"
			>
				<AppIcon name="add" :size="18" />
			</button>
		</form>
		<p v-if="error" class="text-sm font-semibold text-tangerine-strong" role="alert">
			{{ t(`errors.${error}`) }}
		</p>
		<RecordLog :entry="entry" />
	</article>
</template>
