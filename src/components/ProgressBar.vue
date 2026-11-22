<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
	value: number;
	max: number;
	label: string;
}>();

// Anything above a goal of zero has already passed it, so the bar is full.
const percent = computed(() => {
	if (props.max > 0) return Math.min(100, (props.value / props.max) * 100);
	return props.value > 0 ? 100 : 0;
});
</script>

<template>
	<div
		role="progressbar"
		:aria-label="label"
		:aria-valuenow="value"
		aria-valuemin="0"
		:aria-valuemax="max"
		class="h-1.5 w-full overflow-hidden rounded-full bg-ink/10"
	>
		<div
			class="h-full rounded-full bg-brand transition-[width,background-color] duration-500 ease-out"
			:style="{ width: `${percent}%` }"
		/>
	</div>
</template>
