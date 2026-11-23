<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import {
	type BudgetCategory,
	billCycle,
	dateFromKey,
	spendingProgress,
} from "../lib/budget";
import { type ErrorCode, errorCode } from "../lib/errors";
import { useBudgetStore } from "../stores/budget";
import AppIcon from "./AppIcon.vue";
import { BUDGET_GROUP_ICONS } from "./icons";
import PaymentSlider from "./PaymentSlider.vue";
import { BUDGET_GROUP_TONES, paymentColours, TONE_CLASSES } from "./tones";

const props = defineProps<{
	category: BudgetCategory;
	spent: number;
	/** The current day as YYYY-MM-DD, which decides the cycle being paid. */
	today: string;
}>();
defineEmits<{ edit: []; remove: [] }>();
const store = useBudgetStore();
const { t, n, d } = useI18n();

const paidError = ref<ErrorCode | null>(null);

const progress = computed(() => spendingProgress(props.spent, props.category.planned));
const colours = computed(() => paymentColours(progress.value));
const status = computed(() =>
	t(`budget.category.status.${progress.value.state}`, {
		amount: n(Math.abs(progress.value.remaining), "currency"),
	}),
);
const dueDate = computed(() => billCycle(props.category, props.today).dueDate);
const isOverdue = computed(
	() => progress.value.state === "left" && !!dueDate.value && dueDate.value < props.today,
);
const dueLabel = computed(() =>
	t(`budget.category.${isOverdue.value ? "overdue" : "due"}`, {
		date: d(dateFromKey(dueDate.value), "dayMonthYear"),
	}),
);

function updatePaid(amount: number) {
	paidError.value = null;
	try {
		store.setPaid(props.category.id, amount, props.today);
	} catch (cause) {
		paidError.value = errorCode(cause);
	}
}
</script>

<template>
	<article class="card flex flex-col gap-4">
		<header class="flex items-start justify-between gap-2">
			<span class="icon-tile" :class="TONE_CLASSES[BUDGET_GROUP_TONES[category.group]]">
				<AppIcon :name="BUDGET_GROUP_ICONS[category.group]" />
			</span>
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

		<div class="flex min-w-0 flex-col gap-1">
			<h3 class="truncate text-subheading">{{ category.name }}</h3>
			<p class="text-sm text-ink-muted">{{ t(`budget.groups.${category.group}`) }}</p>
			<p class="text-sm font-semibold tabular-nums">
				{{ t("budget.category.summary", { planned: n(category.planned, "currency"), recurrence: t(`budget.category.recurrences.${category.recurrence}`) }) }}
			</p>
			<p
				v-if="dueDate"
				class="flex items-center gap-1 text-sm"
				:class="isOverdue ? 'font-semibold text-cherry-strong' : 'text-ink-muted'"
			>
				<AppIcon name="calendar" :size="14" />
				{{ dueLabel }}
			</p>
		</div>

		<p v-if="category.description" class="text-sm text-ink-muted">{{ category.description }}</p>

		<div class="mt-auto flex flex-col gap-2">
			<PaymentSlider
				:name="category.name"
				:paid="spent"
				:planned="category.planned"
				:colours="colours"
				:status="status"
				@change="updatePaid"
			/>
			<p v-if="paidError" class="text-sm font-semibold text-tangerine-strong" role="alert">
				{{ t(`errors.${paidError}`) }}
			</p>
		</div>
	</article>
</template>
