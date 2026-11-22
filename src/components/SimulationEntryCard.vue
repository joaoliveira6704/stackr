<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import {
	currentValue,
	type Holding,
	recordName,
	type SavingsEntry,
} from "../lib/portfolio";
import { rateEquivalents } from "../lib/projection";
import type { SeriesColor } from "./chart-colors";
import NumberField from "./NumberField.vue";

// The monthly deposit and the rate here are only a simulation. The real value
// and the real rate come from the register and cannot be changed here.
const props = defineProps<{
	entry: Holding | SavingsEntry;
	color: SeriesColor;
	today: string;
}>();
const { t, n } = useI18n();

const detail = computed(() => {
	const { entry } = props;
	if ("interest" in entry) {
		return `${t(`register.savings.types.${entry.type}`)} · ${t(`register.savings.interestKinds.${entry.interest}`)}`;
	}
	const kind = entry.kind ? t(`simulator.kinds.${entry.kind}`) : t("simulator.kinds.manual");
	return entry.symbol ? `${entry.symbol} · ${kind}` : kind;
});

const saving = computed(() => ("interest" in props.entry ? props.entry : null));
const rateLabel = computed(() =>
	saving.value
		? t(`simulator.rates.label.${saving.value.rateBasis}`)
		: t("simulator.holding.return"),
);
const equivalents = computed(() => {
	if (!saving.value || !Number.isFinite(saving.value.annualReturnPercent)) {
		return null;
	}
	const { annualReturnPercent, rateBasis, interest } = saving.value;
	const { tanb, tanl, tae } = rateEquivalents(annualReturnPercent, rateBasis, interest);
	const percent = (value: number) => n(value / 100, "ratePercent");
	return t("simulator.rates.equivalents", {
		tanb: percent(tanb),
		tanl: percent(tanl),
		tae: percent(tae),
	});
});
</script>

<template>
	<article class="card flex flex-col gap-4">
		<header class="flex items-start gap-3">
			<span aria-hidden="true" class="mt-1.5 size-3 shrink-0 rounded-full" :class="color.swatch" />
			<div class="min-w-0 flex-1">
				<h4 class="truncate text-subheading">{{ recordName(entry) }}</h4>
				<p class="text-sm text-ink-muted">{{ detail }}</p>
			</div>
			<div class="shrink-0 text-right">
				<p class="text-sm text-ink-muted">{{ t("simulator.portfolio.current") }}</p>
				<p class="text-subheading tabular-nums">{{ n(currentValue(entry, today), "currency") }}</p>
			</div>
		</header>
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
			<NumberField
				v-model="entry.monthly"
				:label="t('simulator.portfolio.monthlyDeposit')"
				unit="€"
				:min="0"
				:step="10"
			/>
			<NumberField
				v-model="entry.annualReturnPercent"
				:label="rateLabel"
				unit="%"
				:step="0.1"
			/>
		</div>
		<p v-if="saving?.ratePath === 'variable'" class="text-sm text-ink-muted">
			{{ t("simulator.rates.variableHint") }}
		</p>
		<p v-if="equivalents" class="text-sm text-ink-muted tabular-nums">{{ equivalents }}</p>
	</article>
</template>
