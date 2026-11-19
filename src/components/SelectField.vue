<script setup lang="ts" generic="T extends string">
defineProps<{
	label: string;
	options: { value: T; label: string }[];
}>();

const value = defineModel<T>({ required: true });
</script>

<template>
	<label class="flex flex-col gap-1.5 text-label font-semibold text-ink">
		{{ label }}
		<select v-model="value" class="field font-normal">
			<option v-for="option in options" :key="option.value" :value="option.value">
				{{ option.label }}
			</option>
		</select>
	</label>
</template>
