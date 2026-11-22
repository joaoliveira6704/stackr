<script setup lang="ts">
import { useId } from "vue";
import { useI18n } from "vue-i18n";
import { MAX_YEARS } from "../lib/projection";

const PRESETS = [5, 10, 20, 30];

const years = defineModel<number>({ required: true });
const { t } = useI18n();
const labelId = useId();

function pick(event: Event) {
	years.value = (event.target as HTMLInputElement).valueAsNumber;
}
</script>

<template>
	<div class="card flex flex-col gap-4">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<p :id="labelId" class="font-bold">{{ t("simulator.duration.label") }}</p>
			<div class="flex flex-wrap gap-2" role="group" :aria-labelledby="labelId">
				<button
					v-for="preset in PRESETS"
					:key="preset"
					type="button"
					class="btn-secondary btn-toggle btn-sm tabular-nums"
					:aria-pressed="years === preset"
					@click="years = preset"
				>
					{{ t("simulator.duration.years", { years: preset }, preset) }}
				</button>
			</div>
		</div>
		<div class="flex items-center gap-4">
			<input
				type="range"
				min="1"
				:max="MAX_YEARS"
				step="1"
				:value="years"
				:aria-label="t('simulator.duration.slider')"
				:aria-valuetext="t('simulator.duration.years', { years }, years)"
				class="h-2 flex-1 cursor-pointer accent-brand"
				@input="pick"
			/>
			<span class="w-20 shrink-0 text-right text-subheading tabular-nums" aria-hidden="true">
				{{ t('simulator.duration.years', { years }, years) }}
			</span>
		</div>
	</div>
</template>
