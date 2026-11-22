<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { dateKey } from "../lib/budget";
import { type ErrorCode, errorCode } from "../lib/errors";
import {
	defaultSavingsTerms,
	type Holding,
	type NewRecord,
} from "../lib/portfolio";
import { usePortfolioStore } from "../stores/portfolio";
import AppIcon from "./AppIcon.vue";
import FormDialog from "./FormDialog.vue";
import NumberField from "./NumberField.vue";
import SavingsTermsFields from "./SavingsTermsFields.vue";
import TextField from "./TextField.vue";

const props = defineProps<{ record: NewRecord }>();
const emit = defineEmits<{ close: []; addedHolding: [holding: Holding] }>();
const store = usePortfolioStore();
const { t } = useI18n();

const name = ref("");
const terms = ref({
	...defaultSavingsTerms(),
	startDate: dateKey(new Date()),
});
const amount = ref(Number.NaN);
const shares = ref(Number.NaN);
const startDate = ref(dateKey(new Date()));
const adding = ref(false);
const error = ref<ErrorCode | null>(null);

const ticker = computed(() =>
	props.record.kind === "investment" ? props.record.ticker : null,
);

async function addRecord() {
	if (props.record.kind === "savings") {
		store.addSavings(name.value, {
			...terms.value,
			initial: amount.value,
		});
		return;
	}
	const holding = ticker.value
		? await store.addTicker(ticker.value, amount.value, shares.value, startDate.value)
		: store.addManual(name.value, amount.value, startDate.value);
	emit("addedHolding", holding);
}

async function submit() {
	adding.value = true;
	error.value = null;
	try {
		await addRecord();
		emit("close");
	} catch (cause) {
		error.value = errorCode(cause);
	} finally {
		adding.value = false;
	}
}
</script>

<template>
	<FormDialog
		:title="ticker?.name ?? t(`register.dialog.${record.kind}Title`)"
		:subtitle="t(ticker ? 'register.dialog.tickerSubtitle' : 'register.dialog.subtitle')"
		@close="emit('close')"
	>
		<form class="flex flex-col gap-4" novalidate @submit.prevent="submit">
			<TextField v-if="!ticker" v-model="name" :label="t('register.dialog.name')" />
			<SavingsTermsFields v-if="record.kind === 'savings'" v-model="terms" />
			<TextField
				v-else
				v-model="startDate"
				type="date"
				:label="t('register.dialog.investmentStart')"
			/>
			<NumberField
				v-model="amount"
				:label="t(record.kind === 'savings' ? 'register.dialog.amountOnDate' : 'register.entry.addLabel')"
				unit="€"
				:min="0"
				:step="50"
			/>
			<NumberField
				v-if="ticker"
				v-model="shares"
				:label="t('register.entry.sharesLabel')"
				:min="0"
			/>
			<p v-if="error" class="text-sm font-semibold text-tangerine-strong" role="alert">
				{{ t(`errors.${error}`) }}
			</p>
			<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
				<button type="button" class="btn-secondary" @click="emit('close')">
					{{ t("common.cancel") }}
				</button>
				<button type="submit" class="btn-primary" :disabled="adding">
					<AppIcon name="add" :size="18" />
					{{ t("register.dialog.submit") }}
				</button>
			</div>
		</form>
	</FormDialog>
</template>
