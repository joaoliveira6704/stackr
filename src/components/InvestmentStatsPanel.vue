<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { InvestmentStats } from "../lib/portfolio";
import StatRow from "./StatRow.vue";

defineProps<{ stats: InvestmentStats }>();
const { t, n } = useI18n();
</script>

<template>
	<section class="card flex flex-col gap-2">
		<div>
			<h3 class="text-subheading">{{ t("register.portfolioStats.title") }}</h3>
			<p class="text-sm text-ink-muted">{{ t("register.portfolioStats.subtitle") }}</p>
		</div>
		<div class="divide-y divide-line">
			<StatRow
				icon="invested"
				tone="neutral"
				:title="t('register.portfolioStats.invested')"
				:detail="t('register.portfolioStats.investedDetail')"
				:value="n(stats.invested, 'currency')"
			/>
			<StatRow
				icon="growth"
				tone="grape"
				:title="t('register.portfolioStats.value')"
				:detail="t('register.portfolioStats.valueDetail')"
				:value="n(stats.value, 'currency')"
			/>
			<StatRow
				:icon="stats.gain < 0 ? 'trendingDown' : 'trendingUp'"
				:tone="stats.gain < 0 ? 'tangerine' : 'brand'"
				:title="t('register.portfolioStats.gain')"
				:detail="n(stats.gainRate, 'signedPercent')"
				:value="n(stats.gain, 'signedCurrency')"
			/>
		</div>
	</section>
</template>
