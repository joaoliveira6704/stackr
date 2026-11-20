<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { type BudgetCategory, spendingProgress } from "../lib/budget";
import AppIcon from "./AppIcon.vue";
import { BUDGET_GROUP_ICONS } from "./icons";
import ProgressBar from "./ProgressBar.vue";
import { BUDGET_GROUP_TONES, SPENDING_LEVEL_CLASSES, TONE_CLASSES } from "./tones";

const props = defineProps<{ category: BudgetCategory; spent: number }>();
defineEmits<{ edit: []; remove: [] }>();
const { t, n } = useI18n();

const progress = computed(() => spendingProgress(props.spent, props.category.planned));
const colours = computed(() => SPENDING_LEVEL_CLASSES[progress.value.level]);
const status = computed(() =>
	t(`budget.category.status.${progress.value.state}`, {
		amount: n(Math.abs(progress.value.remaining), "currency"),
	}),
);
</script>

<template>
	<article class="card flex flex-col gap-4">
		<header class="flex items-start gap-3">
			<span class="icon-tile" :class="TONE_CLASSES[BUDGET_GROUP_TONES[category.group]]">
				<AppIcon :name="BUDGET_GROUP_ICONS[category.group]" />
			</span>
			<div class="min-w-0 flex-1">
				<h3 class="truncate text-subheading">{{ category.name }}</h3>
				<p class="text-sm text-ink-muted">
					{{ t("budget.category.summary", { group: t(`budget.groups.${category.group}`), planned: n(category.planned, "currency") }) }}
				</p>
			</div>
			<div class="flex gap-2">
				<button
					type="button"
					class="btn-secondary btn-icon"
					:aria-label="t('budget.category.edit', { name: category.name })"
					@click="$emit('edit')"
				>
					<AppIcon name="manual" :size="16" />
				</button>
				<button
					type="button"
					class="btn-secondary btn-icon"
					:aria-label="t('budget.category.remove', { name: category.name })"
					@click="$emit('remove')"
				>
					<AppIcon name="remove" :size="16" />
				</button>
			</div>
		</header>

		<p v-if="category.description" class="text-ink-muted">{{ category.description }}</p>

		<div class="mt-auto flex flex-col gap-2">
			<div class="flex flex-wrap items-baseline justify-between gap-2 text-sm">
				<span class="text-ink-muted tabular-nums">
					{{ t("budget.category.spent", { spent: n(spent, "currency"), planned: n(category.planned, "currency") }) }}
				</span>
				<span class="font-semibold tabular-nums" :class="colours.text">{{ status }}</span>
			</div>
			<ProgressBar
				:value="spent"
				:max="category.planned"
				:fill-class="colours.bar"
				:label="t('budget.category.spentLabel', { name: category.name })"
			/>
		</div>
	</article>
</template>
