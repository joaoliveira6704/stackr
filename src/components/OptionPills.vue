<script setup lang="ts" generic="T extends string">
import { useId } from "vue";

// A short list of choices, all visible and one click away.
defineProps<{
	label: string;
	options: { value: T; label: string }[];
}>();

const value = defineModel<T>({ required: true });
const labelId = useId();
</script>

<template>
	<div class="flex flex-col gap-1.5">
		<p :id="labelId" class="text-label font-semibold text-ink">{{ label }}</p>
		<div class="flex flex-wrap gap-2" role="group" :aria-labelledby="labelId">
			<button
				v-for="option in options"
				:key="option.value"
				type="button"
				class="btn-secondary btn-toggle btn-sm"
				:aria-pressed="value === option.value"
				@click="value = option.value"
			>
				{{ option.label }}
			</button>
		</div>
	</div>
</template>
