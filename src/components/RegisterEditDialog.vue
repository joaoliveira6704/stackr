<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { type ErrorCode, errorCode } from "../lib/errors";
import type {
	Holding,
	HoldingPosition,
	RecordIcon,
	SavingsEntry,
	SavingsTerms,
} from "../lib/portfolio";
import { usePortfolioStore } from "../stores/portfolio";
import AppIcon from "./AppIcon.vue";
import FormDialog from "./FormDialog.vue";
import IconPicker from "./IconPicker.vue";
import NumberField from "./NumberField.vue";
import SavingsTermsFields from "./SavingsTermsFields.vue";
import TextField from "./TextField.vue";

// Edits a copy, so nothing changes on the card until the user saves.
const props = defineProps<{ entry: Holding | SavingsEntry }>();
const emit = defineEmits<{ close: [] }>();
const store = usePortfolioStore();
const { t } = useI18n();

const nametag = ref(props.entry.nametag);
const icon = ref<RecordIcon | null>(props.entry.icon);
const error = ref<ErrorCode | null>(null);

function termsOf(entry: Holding | SavingsEntry): SavingsTerms | null {
	if (!("interest" in entry)) return null;
	return {
		type: entry.type,
		interest: entry.interest,
		contractRatePercent: entry.contractRatePercent,
		startDate: entry.startDate,
		rateBasis: entry.rateBasis,
		ratePath: entry.ratePath,
		rateStepPercent: entry.rateStepPercent,
		rateFixedYears: entry.rateFixedYears,
		rateLaterPercent: entry.rateLaterPercent,
	};
}

const terms = ref(termsOf(props.entry));
const holding = computed(() => ("symbol" in props.entry ? props.entry : null));
const invested = ref(holding.value?.initial ?? 0);
const shares = ref(holding.value?.shares ?? 0);
const manualValue = ref(holding.value?.manualValue ?? Number.NaN);
const startDate = ref(holding.value?.startDate ?? "");

// An empty current value means the card goes back to showing what was invested.
function editedPosition(): HoldingPosition | undefined {
	if (!holding.value) return undefined;
	return {
		initial: invested.value,
		shares: shares.value,
		manualValue: Number.isNaN(manualValue.value) ? null : manualValue.value,
		startDate: startDate.value,
	};
}
const defaultIcon = computed<RecordIcon>(() =>
	"interest" in props.entry ? "savings" : "growth",
);

function save() {
	error.value = null;
	try {
		store.updateRecord(props.entry.id, {
			nametag: nametag.value,
			icon: icon.value,
			terms: terms.value ?? undefined,
			position: editedPosition(),
		});
		emit("close");
	} catch (cause) {
		error.value = errorCode(cause);
	}
}
</script>

<template>
	<FormDialog
		:title="t('register.edit.title', { name: entry.name })"
		:subtitle="t('register.edit.subtitle')"
		@close="emit('close')"
	>
		<form class="flex flex-col gap-4" novalidate @submit.prevent="save">
			<div class="flex flex-col gap-1.5">
				<TextField v-model="nametag" :label="t('register.edit.nametag')" optional />
				<p class="text-sm text-ink-muted">
					{{ t("register.edit.nametagHint", { name: entry.name }) }}
				</p>
			</div>
			<IconPicker v-model="icon" :label="t('register.edit.icon')" :default-icon="defaultIcon" />
			<SavingsTermsFields v-if="terms" v-model="terms" />
			<div v-if="holding" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div class="sm:col-span-2">
					<TextField
						v-model="startDate"
						type="date"
						:label="t('register.dialog.investmentStart')"
						optional
					/>
				</div>
				<NumberField
					v-model="invested"
					:label="t('register.edit.invested')"
					unit="€"
					:min="0"
					:step="10"
				/>
				<NumberField
					v-if="holding.symbol"
					v-model="shares"
					:label="t('register.edit.shares')"
					:min="0"
				/>
				<NumberField
					v-else
					v-model="manualValue"
					:label="t('register.edit.manualValue')"
					unit="€"
					:min="0"
					:step="10"
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
					<AppIcon name="save" :size="18" />
					{{ t("register.edit.submit") }}
				</button>
			</div>
		</form>
	</FormDialog>
</template>
