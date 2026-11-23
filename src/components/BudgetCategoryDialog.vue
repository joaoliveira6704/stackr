<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { type BudgetCategory, EXPENSE_GROUPS, RECURRENCES } from "../lib/budget";
import { type ErrorCode, errorCode } from "../lib/errors";
import { type NewCategory, useBudgetStore } from "../stores/budget";
import AppIcon from "./AppIcon.vue";
import FormDialog from "./FormDialog.vue";
import NumberField from "./NumberField.vue";
import SelectField from "./SelectField.vue";
import TextField from "./TextField.vue";

// Without a category the dialog adds a new one. With one it edits a copy, so
// nothing changes on the card until the user saves.
const props = defineProps<{ category?: BudgetCategory }>();
const emit = defineEmits<{ close: [] }>();
const store = useBudgetStore();
const { t } = useI18n();

const draft = ref<NewCategory>({
	name: props.category?.name ?? "",
	description: props.category?.description ?? "",
	group: props.category?.group ?? "needs",
	planned: props.category?.planned ?? Number.NaN,
	recurrence: props.category?.recurrence ?? "monthly",
	dueDate: props.category?.dueDate ?? "",
});
const error = ref<ErrorCode | null>(null);
const mode = computed(() => (props.category ? "edit" : "add"));

// Savings are not created here, but an older savings entry keeps its type.
const groups = computed(() =>
	props.category?.group === "savings"
		? [...EXPENSE_GROUPS, props.category.group]
		: EXPENSE_GROUPS,
);
const groupOptions = computed(() =>
	groups.value.map((group) => ({ value: group, label: t(`budget.groups.${group}`) })),
);
const recurrenceOptions = computed(() =>
	RECURRENCES.map((recurrence) => ({
		value: recurrence,
		label: t(`budget.category.recurrences.${recurrence}`),
	})),
);
const isDueDateOptional = computed(() => draft.value.recurrence === "once");

function save() {
	error.value = null;
	try {
		if (props.category) store.updateCategory(props.category.id, draft.value);
		else store.addCategory(draft.value);
	} catch (cause) {
		error.value = errorCode(cause);
		return;
	}
	emit("close");
}
</script>

<template>
	<FormDialog
		:title="t(`budget.categoryDialog.${mode}Title`)"
		:subtitle="t('budget.categoryDialog.subtitle')"
		@close="emit('close')"
	>
		<form class="flex flex-col gap-4" novalidate @submit.prevent="save">
			<TextField v-model="draft.name" :label="t('budget.category.name')" />
			<TextField
				v-model="draft.description"
				:label="t('budget.category.description')"
				optional
			/>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<SelectField
					v-model="draft.group"
					:label="t('budget.category.group')"
					:options="groupOptions"
				/>
				<SelectField
					v-model="draft.recurrence"
					:label="t('budget.category.recurrence')"
					:options="recurrenceOptions"
				/>
				<NumberField
					v-model="draft.planned"
					:label="t('budget.category.planned')"
					unit="€"
					:min="0"
					:step="10"
				/>
				<TextField
					v-model="draft.dueDate"
					type="date"
					:label="t(isDueDateOptional ? 'budget.category.dueDateOptional' : 'budget.category.dueDate')"
					:optional="isDueDateOptional"
				/>
			</div>
			<p v-if="error" class="text-sm font-semibold text-tangerine-strong" role="alert">
				{{ t(`errors.${error}`) }}
			</p>
			<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
				<button type="button" class="btn-secondary" @click="emit('close')">
					{{ t("common.cancel") }}
				</button>
				<button type="submit" class="btn-primary">
					<AppIcon :name="mode === 'add' ? 'add' : 'save'" :size="18" />
					{{ t(`budget.categoryDialog.${mode}Submit`) }}
				</button>
			</div>
		</form>
	</FormDialog>
</template>
