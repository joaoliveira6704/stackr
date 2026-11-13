<script setup lang="ts">
defineProps<{
	label: string;
	type?: string;
	autocomplete?: string;
}>();

const value = defineModel<string>({ required: true });
</script>

<template>
	<label class="flex flex-col gap-1.5 text-sm font-medium text-ink">
		{{ label }}
		<input
			v-model="value"
			:type="type ?? 'text'"
			:autocomplete="autocomplete"
			required
			class="rounded-xl border border-line px-4 py-3 text-base text-ink outline-none transition-colors focus:border-ink"
		/>
	</label>
</template>
