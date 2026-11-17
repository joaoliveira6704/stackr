<script setup lang="ts">
defineProps<{
	label: string;
	/** A unit shown inside the field, such as "€" or "%". */
	unit?: string;
	min?: number;
	max?: number;
	step?: number;
}>();

// An empty or half typed field gives NaN, which the projection reports as an
// invalid amount instead of quietly reading it as zero.
const value = defineModel<number>({ required: true });

function update(event: Event) {
	value.value = (event.target as HTMLInputElement).valueAsNumber;
}
</script>

<template>
	<label class="flex flex-col gap-1.5 text-label font-semibold text-ink">
		<span>
			{{ label }}
			<span v-if="unit" class="sr-only">({{ unit }})</span>
		</span>
		<span class="relative flex items-center">
			<input
				type="number"
				inputmode="decimal"
				:value="Number.isFinite(value) ? value : ''"
				:min="min"
				:max="max"
				:step="step ?? 'any'"
				class="field pr-10 font-normal tabular-nums"
				@input="update"
			/>
			<span
				v-if="unit"
				aria-hidden="true"
				class="pointer-events-none absolute right-4 text-ink-muted"
			>
				{{ unit }}
			</span>
		</span>
	</label>
</template>
