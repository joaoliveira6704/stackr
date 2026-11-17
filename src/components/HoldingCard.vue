<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { Holding } from "../lib/portfolio";
import AppIcon from "./AppIcon.vue";
import type { SeriesColor } from "./chart-colors";
import NumberField from "./NumberField.vue";
import TextField from "./TextField.vue";
import YearlyReturns from "./YearlyReturns.vue";

// The holding lives in the portfolio store and its fields are edited in
// place, the same object the projection reads from.
const props = defineProps<{ holding: Holding; color: SeriesColor }>();
defineEmits<{ remove: [] }>();
const { t } = useI18n();

const sourceNote = computed(() => {
	const { returnSource, symbol, historyYears } = props.holding;
	if (returnSource === "history") {
		return { tone: "tone-brand", text: t("simulator.holding.fromHistory", { years: historyYears }, historyYears) };
	}
	if (symbol) {
		return { tone: "tone-sun", text: t("simulator.holding.noHistory") };
	}
	return { tone: "tone-neutral", text: t("simulator.holding.manual") };
});
</script>

<template>
	<article class="card flex flex-col gap-5">
		<header class="flex items-start gap-3">
			<span aria-hidden="true" class="mt-1.5 size-3 shrink-0 rounded-full" :class="color.swatch" />
			<div class="min-w-0 flex-1">
				<h3 class="truncate text-subheading">{{ holding.name }}</h3>
				<p class="text-sm text-ink-muted">
					<template v-if="holding.symbol">{{ holding.symbol }} · </template>
					{{ holding.kind ? t(`simulator.kinds.${holding.kind}`) : t("simulator.kinds.manual") }}
				</p>
			</div>
			<button
				type="button"
				class="btn-secondary btn-icon"
				:aria-label="t('simulator.holding.remove', { name: holding.name })"
				@click="$emit('remove')"
			>
				<AppIcon name="remove" :size="16" />
			</button>
		</header>

		<span class="chip self-start" :class="sourceNote.tone">
			<AppIcon :name="holding.returnSource === 'history' ? 'growth' : 'manual'" :size="14" />
			{{ sourceNote.text }}
		</span>

		<TextField
			v-if="!holding.symbol"
			v-model="holding.name"
			:label="t('simulator.holding.name')"
		/>

		<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
			<NumberField
				v-model="holding.initial"
				:label="t('simulator.holding.initial')"
				unit="€"
				:min="0"
				:step="50"
			/>
			<NumberField
				v-model="holding.monthly"
				:label="t('simulator.holding.monthly')"
				unit="€"
				:min="0"
				:step="10"
			/>
			<NumberField
				v-model="holding.annualReturnPercent"
				:label="t('simulator.holding.return')"
				unit="%"
				:step="0.1"
			/>
		</div>

		<YearlyReturns v-if="holding.yearlyReturns.length" :returns="holding.yearlyReturns" />
	</article>
</template>
