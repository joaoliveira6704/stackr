<script setup lang="ts">
defineProps<{
	label: string;
	type?: string;
	autocomplete?: string;
}>();

const value = defineModel<string>({ required: true });
</script>

<template>
	<label class="flex flex-col gap-1 text-sm">
		{{ label }}
		<input
			v-model="value"
			:type="type ?? 'text'"
			:autocomplete="autocomplete"
			required
			class="rounded border border-neutral-300 px-3 py-2"
		/>
	</label>
</template>
