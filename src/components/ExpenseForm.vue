<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { type BudgetCategory, dateKey } from "../lib/budget";
import { type ErrorCode, errorCode } from "../lib/errors";
import { useBudgetStore } from "../stores/budget";
import AppIcon from "./AppIcon.vue";
import NumberField from "./NumberField.vue";
import SelectField from "./SelectField.vue";
import TextField from "./TextField.vue";

const props = defineProps<{ categories: BudgetCategory[] }>();
const store = useBudgetStore();
const { t } = useI18n();

const amount = ref(Number.NaN);
const categoryId = ref(props.categories[0]?.id ?? "");
const description = ref("");
const date = ref(dateKey(new Date()));
const error = ref<ErrorCode | null>(null);

const categoryOptions = computed(() =>
	props.categories.map((category) => ({ value: category.id, label: category.name })),
);

// A removed category cannot stay picked, so fall back to the first one.
watch(
	() => props.categories.map((category) => category.id),
	(ids) => {
		if (!ids.includes(categoryId.value)) categoryId.value = ids[0] ?? "";
	},
);

function logExpense() {
	error.value = null;
	try {
		store.addExpense({
			categoryId: categoryId.value,
			amount: amount.value,
			description: description.value,
			date: date.value,
		});
	} catch (cause) {
		error.value = errorCode(cause);
		return;
	}
	// The category and the date stay, since several expenses in a row often share them.
	amount.value = Number.NaN;
	description.value = "";
}
</script>

<template>
	<form class="flex flex-col gap-4" novalidate @submit.prevent="logExpense">
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<NumberField v-model="amount" :label="t('budget.expenses.amount')" unit="€" :min="0" :step="0.01" />
			<SelectField
				v-model="categoryId"
				:label="t('budget.expenses.category')"
				:options="categoryOptions"
			/>
			<TextField v-model="description" :label="t('budget.expenses.description')" optional />
			<TextField v-model="date" type="date" :label="t('budget.expenses.date')" />
		</div>
		<div class="flex flex-wrap items-center gap-3">
			<button type="submit" class="btn-secondary">
				<AppIcon name="add" :size="18" />
				{{ t("budget.expenses.add") }}
			</button>
			<p v-if="error" class="text-sm font-semibold text-tangerine-strong" role="alert">
				{{ t(`errors.${error}`) }}
			</p>
		</div>
	</form>
</template>
