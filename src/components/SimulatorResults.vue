<script setup lang="ts">
import { computed, ref, useId } from "vue";
import { useI18n } from "vue-i18n";
import type { Holding } from "../lib/portfolio";
import {
	CAPITAL_GAINS_TAX,
	type Projection,
	SCENARIO_SPREAD_PERCENT,
	type Scenarios,
} from "../lib/projection";
import AllocationBar from "./AllocationBar.vue";
import AppIcon from "./AppIcon.vue";
import { seriesColor } from "./chart-colors";
import GrowthChart from "./GrowthChart.vue";
import type { IconName } from "./icons";
import StatCard from "./StatCard.vue";
import StatRow from "./StatRow.vue";
import type { Tone } from "./tones";

const props = defineProps<{
	projection: Projection;
	scenarios: Scenarios;
	holdings: Holding[];
	years: number;
}>();
const { t, n } = useI18n();

const showTable = ref(false);
const tableId = useId();

function money(amount: number): string {
	return n(amount, "currency");
}

const startingAmount = computed(() =>
	props.holdings.reduce((sum, holding) => sum + holding.initial, 0),
);
const monthlyAmount = computed(() =>
	props.holdings.reduce((sum, holding) => sum + holding.monthly, 0),
);

interface Headline {
	key: "invested" | "value" | "gain" | "realGain";
	icon: IconName;
	tone: Tone;
	value: number;
	detail: string;
}

const headlines = computed<Headline[]>(() => {
	const result = props.projection;
	return [
		{
			key: "invested",
			icon: "invested",
			tone: "neutral",
			value: result.invested,
			detail: t("simulator.results.investedDetail", {
				initial: money(startingAmount.value),
				monthly: money(monthlyAmount.value),
			}),
		},
		{
			key: "value",
			icon: "growth",
			tone: "brand",
			value: result.value,
			detail: t("simulator.results.valueDetail", {
				rate: n(result.gainRate, "signedPercent"),
			}),
		},
		{
			key: "gain",
			icon: "sparkle",
			tone: "sun",
			value: result.gain,
			detail: t("simulator.results.gainDetail", { net: money(result.netGain) }),
		},
		{
			key: "realGain",
			icon: "inflation",
			tone: "grape",
			value: result.realGain,
			detail:
				result.realGain >= 0
					? t("simulator.results.realGainUp")
					: t("simulator.results.realGainDown"),
		},
	];
});

const allocation = computed(() =>
	props.holdings.map((holding, index) => ({
		id: holding.id,
		name: holding.name,
		amount: props.projection.holdings[index]?.invested ?? 0,
	})),
);

const scenarioRows = computed(() => [
	{ key: "pessimistic", icon: "trendingDown", tone: "tangerine", shift: -SCENARIO_SPREAD_PERCENT },
	{ key: "expected", icon: "growth", tone: "neutral", shift: 0 },
	{ key: "optimistic", icon: "trendingUp", tone: "brand", shift: SCENARIO_SPREAD_PERCENT },
] as const);

function scenarioDetail(shift: number): string {
	if (shift === 0) return t("simulator.scenarios.expectedDetail");
	const points = n(Math.abs(shift));
	return shift < 0
		? t("simulator.scenarios.lowerDetail", { points })
		: t("simulator.scenarios.higherDetail", { points });
}
</script>

<template>
	<div class="flex flex-col gap-6">
		<!-- Two per row at most, because euro amounts in the large type need
		the room that four narrow cards cannot give. -->
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
			<StatCard
				v-for="headline in headlines"
				:key="headline.key"
				:icon="headline.icon"
				:tone="headline.tone"
				:label="t(`simulator.results.${headline.key}`)"
				:value="money(headline.value)"
				:detail="headline.detail"
			/>
		</div>

		<section class="card flex flex-col gap-5">
			<div class="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h2 class="text-heading">{{ t("simulator.chart.title") }}</h2>
					<p class="text-sm text-ink-muted">{{ t("simulator.chart.subtitle") }}</p>
				</div>
				<button
					type="button"
					class="btn-ghost btn-sm"
					:aria-expanded="showTable"
					:aria-controls="tableId"
					@click="showTable = !showTable"
				>
					<AppIcon name="table" :size="16" />
					{{ showTable ? t("simulator.chart.hideTable") : t("simulator.chart.showTable") }}
				</button>
			</div>

			<GrowthChart :timeline="projection.timeline" />

			<div v-if="showTable" :id="tableId" class="max-h-80 overflow-auto rounded-field border border-line">
				<table class="w-full text-sm">
					<caption class="sr-only">{{ t("simulator.chart.title") }}</caption>
					<thead class="sticky top-0 bg-surface text-ink-muted">
						<tr>
							<th scope="col" class="px-4 py-2 text-left font-semibold">{{ t("simulator.chart.year") }}</th>
							<th scope="col" class="px-4 py-2 text-right font-semibold">{{ t("simulator.chart.invested") }}</th>
							<th scope="col" class="px-4 py-2 text-right font-semibold">{{ t("simulator.chart.value") }}</th>
							<th scope="col" class="px-4 py-2 text-right font-semibold">{{ t("simulator.chart.realValue") }}</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-line tabular-nums">
						<tr v-for="point in projection.timeline" :key="point.year">
							<th scope="row" class="px-4 py-2 text-left font-semibold">{{ point.year }}</th>
							<td class="px-4 py-2 text-right">{{ money(point.invested) }}</td>
							<td class="px-4 py-2 text-right">{{ money(point.value) }}</td>
							<td class="px-4 py-2 text-right">{{ money(point.realValue) }}</td>
						</tr>
					</tbody>
				</table>
			</div>
		</section>

		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			<section class="card flex flex-col gap-4">
				<div>
					<h2 class="text-heading">{{ t("simulator.allocation.title") }}</h2>
					<p class="text-sm text-ink-muted">{{ t("simulator.allocation.subtitle", { years }, years) }}</p>
				</div>
				<AllocationBar :items="allocation" />
			</section>

			<section class="card flex flex-col gap-2">
				<div>
					<h2 class="text-heading">{{ t("simulator.reality.title") }}</h2>
					<p class="text-sm text-ink-muted">{{ t("simulator.reality.subtitle") }}</p>
				</div>
				<div class="divide-y divide-line">
					<StatRow
						icon="inflation"
						tone="grape"
						:title="t('simulator.reality.realValue')"
						:detail="t('simulator.reality.realValueDetail')"
						:value="money(projection.realValue)"
					/>
					<StatRow
						icon="trendingDown"
						tone="tangerine"
						:title="t('simulator.reality.inflationCost')"
						:detail="t('simulator.reality.inflationCostDetail')"
						:value="money(projection.inflationCost)"
					/>
					<StatRow
						icon="tax"
						tone="neutral"
						:title="t('simulator.reality.tax')"
						:detail="t('simulator.reality.taxDetail', { rate: n(CAPITAL_GAINS_TAX, 'percent') })"
						:value="money(projection.tax)"
					/>
					<StatRow
						icon="growth"
						tone="brand"
						:title="t('simulator.reality.averageReturn')"
						:detail="t('simulator.reality.averageReturnDetail')"
						:value="n(projection.averageReturnPercent / 100, 'percent')"
					/>
				</div>
			</section>
		</div>

		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			<section class="card flex flex-col gap-2">
				<div>
					<h2 class="text-heading">{{ t("simulator.scenarios.title") }}</h2>
					<p class="text-sm text-ink-muted">{{ t("simulator.scenarios.subtitle") }}</p>
				</div>
				<div class="divide-y divide-line">
					<StatRow
						v-for="row in scenarioRows"
						:key="row.key"
						:icon="row.icon"
						:tone="row.tone"
						:title="t(`simulator.scenarios.${row.key}`)"
						:detail="scenarioDetail(row.shift)"
						:value="money(scenarios[row.key])"
					/>
				</div>
			</section>

			<section class="card flex flex-col gap-2">
				<div>
					<h2 class="text-heading">{{ t("simulator.breakdown.title") }}</h2>
					<p class="text-sm text-ink-muted">{{ t("simulator.breakdown.subtitle", { years }, years) }}</p>
				</div>
				<div class="divide-y divide-line">
					<StatRow
						v-for="(holding, index) in holdings"
						:key="holding.id"
						:title="holding.name"
						:detail="t('simulator.breakdown.detail', {
							invested: money(projection.holdings[index]?.invested ?? 0),
							gain: money(projection.holdings[index]?.gain ?? 0),
						})"
						:value="money(projection.holdings[index]?.value ?? 0)"
					>
						<template #leading>
							<span aria-hidden="true" class="icon-tile tone-neutral">
								<span class="size-3 rounded-full" :class="seriesColor(index).swatch" />
							</span>
						</template>
					</StatRow>
				</div>
			</section>
		</div>

		<p class="flex gap-2 text-sm text-ink-muted">
			<AppIcon name="info" :size="18" class="mt-0.5 shrink-0" />
			{{ t("simulator.disclaimer") }}
		</p>
	</div>
</template>
