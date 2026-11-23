<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { TrialComparison } from "../lib/trial-investment";
import type { IconName } from "./icons";
import StatRow from "./StatRow.vue";
import type { Tone } from "./tones";

const props = defineProps<{ comparison: TrialComparison; years: number }>();
const { t, n } = useI18n();

function money(amount: number): string {
	return n(amount, "currency");
}

interface Verdict {
	icon: IconName;
	tone: Tone;
	title: string;
	detail: string;
}

const affordable = computed<Verdict>(() => {
	const { affordability, freeAfterTrial } = props.comparison;
	if (affordability === "unknown" || freeAfterTrial === null) {
		return {
			icon: "info",
			tone: "neutral",
			title: t("simulator.trial.unknownTitle"),
			detail: t("simulator.trial.unknownDetail"),
		};
	}
	return affordability === "fits"
		? {
				icon: "budget",
				tone: "brand",
				title: t("simulator.trial.fitsTitle"),
				detail: t("simulator.trial.fitsDetail", { amount: money(freeAfterTrial) }),
			}
		: {
				icon: "alert",
				tone: "tangerine",
				title: t("simulator.trial.tooMuchTitle"),
				detail: t("simulator.trial.tooMuchDetail", {
					amount: money(Math.abs(freeAfterTrial)),
				}),
			};
});

const worthwhile = computed<Verdict>(() => {
	const { realNetGain } = props.comparison;
	const detail = { amount: money(Math.abs(realNetGain)) };
	return realNetGain > 0
		? {
				icon: "trendingUp",
				tone: "brand",
				title: t("simulator.trial.beatsInflationTitle"),
				detail: t("simulator.trial.beatsInflationDetail", detail),
			}
		: {
				icon: "trendingDown",
				tone: "tangerine",
				title: t("simulator.trial.losesToInflationTitle"),
				detail: t("simulator.trial.losesToInflationDetail", detail),
			};
});

const versusPortfolio = computed(() => {
	const { beatsPortfolio } = props.comparison;
	if (beatsPortfolio === null) return null;
	return beatsPortfolio
		? t("simulator.trial.abovePortfolio")
		: t("simulator.trial.belowPortfolio");
});
</script>

<template>
	<section class="card flex flex-col gap-2">
		<div>
			<h3 class="text-subheading">{{ t("simulator.trial.verdictTitle") }}</h3>
			<p class="text-sm text-ink-muted">
				{{ t("simulator.trial.verdictSubtitle", { years }, years) }}
			</p>
		</div>
		<div class="divide-y divide-line">
			<StatRow
				icon="growth"
				tone="grape"
				:title="t('simulator.trial.extraValue')"
				:detail="t('simulator.trial.extraValueDetail', {
					without: money(comparison.withoutTrial),
					with: money(comparison.withTrial),
				})"
				:value="money(comparison.extraValue)"
			/>
			<StatRow
				:icon="affordable.icon"
				:tone="affordable.tone"
				:title="affordable.title"
				:detail="affordable.detail"
				value=""
			/>
			<StatRow
				:icon="worthwhile.icon"
				:tone="worthwhile.tone"
				:title="worthwhile.title"
				:detail="versusPortfolio ? `${worthwhile.detail} ${versusPortfolio}` : worthwhile.detail"
				:value="money(comparison.netGain)"
			/>
		</div>
	</section>
</template>
