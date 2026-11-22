<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { SAVINGS_TYPES, type SavingsTerms } from "../lib/portfolio";
import { INTEREST_KINDS, RATE_BASES, RATE_PATHS } from "../lib/projection";
import NumberField from "./NumberField.vue";
import OptionPills from "./OptionPills.vue";
import SelectField from "./SelectField.vue";
import TextField from "./TextField.vue";

const terms = defineModel<SavingsTerms>({ required: true });
const { t } = useI18n();

const typeOptions = computed(() =>
	SAVINGS_TYPES.map((value) => ({
		value,
		label: t(`register.savings.types.${value}`),
	})),
);
const interestOptions = computed(() =>
	INTEREST_KINDS.map((value) => ({
		value,
		label: t(`register.savings.interestKinds.${value}`),
	})),
);
const basisOptions = computed(() =>
	RATE_BASES.map((value) => ({
		value,
		label: t(`register.savings.rateBases.${value}`),
	})),
);
const pathOptions = computed(() =>
	RATE_PATHS.map((value) => ({
		value,
		label: t(`register.savings.ratePaths.${value}`),
	})),
);
</script>

<template>
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
		<div class="sm:col-span-2">
			<SelectField v-model="terms.type" :label="t('register.savings.type')" :options="typeOptions" />
		</div>
		<div class="sm:col-span-2">
			<OptionPills v-model="terms.rateBasis" :label="t('register.savings.rateBasis')" :options="basisOptions" />
		</div>
		<div class="sm:col-span-2">
			<OptionPills v-model="terms.interest" :label="t('register.savings.interest')" :options="interestOptions" />
		</div>
		<div class="sm:col-span-2">
			<OptionPills v-model="terms.ratePath" :label="t('register.savings.ratePath')" :options="pathOptions" />
		</div>
		<NumberField
			v-model="terms.contractRatePercent"
			:label="t(`simulator.rates.label.${terms.rateBasis}`)"
			unit="%"
			:step="0.1"
		/>
		<NumberField
			v-if="terms.ratePath === 'stepped'"
			v-model="terms.rateStepPercent"
			:label="t('simulator.rates.step')"
			unit="%"
			:step="0.05"
		/>
		<template v-if="terms.ratePath === 'mixed'">
			<NumberField
				v-model="terms.rateFixedYears"
				:label="t('simulator.rates.fixedYears')"
				:min="0"
				:step="1"
			/>
			<NumberField
				v-model="terms.rateLaterPercent"
				:label="t('simulator.rates.later')"
				unit="%"
				:step="0.1"
			/>
		</template>
		<div class="flex flex-col gap-1.5 sm:col-span-2">
			<TextField
				v-model="terms.startDate"
				type="date"
				:label="t('register.savings.startDate')"
				optional
			/>
			<p class="text-sm text-ink-muted">{{ t("register.savings.startDateHint") }}</p>
		</div>
	</div>
</template>
