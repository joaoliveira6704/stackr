<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { BUDGET_GROUPS, type BudgetCategory } from "../lib/budget";
import { roundCents } from "../lib/money";
import AppIcon from "./AppIcon.vue";
import { BUDGET_GROUP_ICONS } from "./icons";
import NumberField from "./NumberField.vue";
import ProgressBar from "./ProgressBar.vue";
import SelectField from "./SelectField.vue";
import TextField from "./TextField.vue";
import { BUDGET_GROUP_TONES, TONE_CLASSES } from "./tones";

// The category lives in the budget store and its fields are edited in place,
// the same object the totals read from.
const props = defineProps<{ category: BudgetCategory; spent: number }>();
defineEmits<{ remove: [] }>();
const { t, n } = useI18n();

const planned = computed(() =>
	Number.isFinite(props.category.planned) ? props.category.planned : 0,
);
const difference = computed(() => roundCents(planned.value - props.spent));
const groupOptions = computed(() =>
	BUDGET_GROUPS.map((group) => ({ value: group, label: t(`budget.groups.${group}`) })),
);
</script>

<template>
	<article class="card flex flex-col gap-4">
		<header class="flex items-center gap-3">
			<span class="icon-tile" :class="TONE_CLASSES[BUDGET_GROUP_TONES[category.group]]">
				<AppIcon :name="BUDGET_GROUP_ICONS[category.group]" />
			</span>
			<div class="min-w-0 flex-1">
				<h3 class="truncate text-subheading">{{ category.name }}</h3>
				<p class="text-sm text-ink-muted">{{ t(`budget.groups.${category.group}`) }}</p>
			</div>
			<button
				type="button"
				class="btn-secondary btn-icon"
				:aria-label="t('budget.category.remove', { name: category.name })"
				@click="$emit('remove')"
			>
				<AppIcon name="remove" :size="16" />
			</button>
		</header>

		<TextField v-model="category.name" :label="t('budget.category.name')" />

		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
			<SelectField
				v-model="category.group"
				:label="t('budget.category.group')"
				:options="groupOptions"
			/>
			<NumberField
				v-model="category.planned"
				:label="t('budget.category.planned')"
				unit="€"
				:min="0"
				:step="10"
			/>
		</div>

		<div class="flex flex-col gap-2">
			<div class="flex flex-wrap items-baseline justify-between gap-2 text-sm">
				<span class="text-ink-muted tabular-nums">
					{{ t("budget.category.spent", { spent: n(spent, "currency"), planned: n(planned, "currency") }) }}
				</span>
				<span
					v-if="difference < 0"
					class="font-semibold text-tangerine-strong tabular-nums"
				>
					{{ t("budget.category.over", { amount: n(-difference, "currency") }) }}
				</span>
				<span v-else class="font-semibold text-brand-strong tabular-nums">
					{{ t("budget.category.left", { amount: n(difference, "currency") }) }}
				</span>
			</div>
			<ProgressBar
				:value="spent"
				:max="planned"
				:label="t('budget.category.spentLabel', { name: category.name })"
			/>
		</div>
	</article>
</template>
