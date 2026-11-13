<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { levelProgress } from "../lib/rewards";
import ProgressBar from "./ProgressBar.vue";

const props = defineProps<{ xp: number }>();

const { t, n } = useI18n();
const progress = computed(() => levelProgress(props.xp));

const remainingText = computed(() => {
	const { nextLevel, remainingXp } = progress.value;
	if (!nextLevel) return t("progress.maxLevel");
	return t("progress.remaining", {
		xp: n(remainingXp),
		next: t(`levels.${nextLevel.id}`),
	});
});
</script>

<template>
	<div class="flex flex-col gap-4">
		<div class="flex items-end justify-between gap-4">
			<div>
				<p class="text-sm text-ink-muted">
					{{ t("progress.level", { level: progress.level.level }) }}
				</p>
				<p class="text-heading">
					{{ t(`levels.${progress.level.id}`) }}
				</p>
			</div>
			<p class="text-sm font-semibold text-brand-strong tabular-nums">
				{{ n(progress.percent) }}%
			</p>
		</div>
		<ProgressBar
			:value="progress.percent"
			:max="100"
			:label="t('progress.label')"
		/>
		<p class="text-sm text-ink-muted">{{ remainingText }}</p>
	</div>
</template>
