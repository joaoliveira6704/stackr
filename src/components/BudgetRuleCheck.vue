<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { RuleCheck } from "../lib/budget";
import { BUDGET_GROUP_ICONS } from "./icons";
import StatRow from "./StatRow.vue";
import { BUDGET_GROUP_TONES } from "./tones";

defineProps<{ checks: RuleCheck[] }>();
const { t, n } = useI18n();

function verdict(check: RuleCheck): string {
	if (check.onTrack) return t("budget.rule.onTrack");
	return check.group === "savings" ? t("budget.rule.below") : t("budget.rule.above");
}

function targetText(check: RuleCheck): string {
	const target = n(check.target, "percent");
	return check.group === "savings"
		? t("budget.rule.targetMin", { target })
		: t("budget.rule.targetMax", { target });
}
</script>

<template>
	<ul class="flex flex-col divide-y divide-line">
		<li v-for="check in checks" :key="check.group" :data-off-track="check.onTrack ? undefined : ''" class="group">
			<StatRow
				:icon="BUDGET_GROUP_ICONS[check.group]"
				:tone="BUDGET_GROUP_TONES[check.group]"
				:title="t(`budget.groups.${check.group}`)"
				:detail="`${targetText(check)} · ${n(check.amount, 'currency')}`"
				:value="n(check.share, 'percent')"
			>
				<template #trailing>
					<span class="chip tone-brand group-data-off-track:tone-tangerine">
						{{ verdict(check) }}
					</span>
				</template>
			</StatRow>
		</li>
	</ul>
</template>
