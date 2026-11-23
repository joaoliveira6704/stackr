<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { dateFromKey } from "../lib/budget";
import type { SavingsStats } from "../lib/portfolio";
import AllocationBar from "./AllocationBar.vue";
import StatRow from "./StatRow.vue";

const props = defineProps<{ stats: SavingsStats }>();
const { t, n, d } = useI18n();

const allocation = computed(() =>
	props.stats.byType.map(({ type, amount }) => ({
		id: type,
		name: t(`register.savings.types.${type}`),
		amount,
	})),
);

const lastDeposit = computed(() =>
	props.stats.lastDepositDate
		? d(dateFromKey(props.stats.lastDepositDate), "dayMonthYear")
		: t("register.stats.noDeposit"),
);
</script>

<template>
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<section class="card flex flex-col gap-2">
			<div>
				<h3 class="text-subheading">{{ t("register.stats.title") }}</h3>
				<p class="text-sm text-ink-muted">{{ t("register.stats.subtitle") }}</p>
			</div>
			<div class="divide-y divide-line">
				<StatRow
					icon="savings"
					tone="brand"
					:title="t('register.stats.total')"
					:detail="t('register.stats.totalDetail')"
					:value="n(stats.total, 'currency')"
				/>
				<StatRow
					icon="trendingUp"
					tone="brand"
					:title="t('register.stats.interestEarned')"
					:detail="t('register.stats.interestEarnedDetail')"
					:value="n(stats.interestEarned, 'currency')"
				/>
				<StatRow
					icon="calendar"
					tone="grape"
					:title="t('register.stats.addedThisMonth')"
					:detail="t('register.stats.addedThisMonthDetail')"
					:value="n(stats.addedThisMonth, 'currency')"
				/>
				<StatRow
					icon="growth"
					tone="tangerine"
					:title="t('register.stats.added')"
					:detail="t('register.stats.addedDetail', { count: stats.depositCount }, stats.depositCount)"
					:value="n(stats.added, 'currency')"
				/>
				<StatRow
					icon="clock"
					tone="sun"
					:title="t('register.stats.lastDeposit')"
					:detail="t('register.stats.lastDepositDetail')"
					:value="lastDeposit"
				/>
			</div>
		</section>
		<section class="card flex flex-col gap-4">
			<div>
				<h3 class="text-subheading">{{ t("register.stats.splitTitle") }}</h3>
				<p class="text-sm text-ink-muted">{{ t("register.stats.splitSubtitle") }}</p>
			</div>
			<AllocationBar :items="allocation" />
		</section>
	</div>
</template>
