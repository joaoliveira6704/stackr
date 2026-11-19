<script setup lang="ts">
defineProps<{
	label: string;
	type?: string;
	autocomplete?: string;
	/** Fields are required unless they say otherwise. */
	optional?: boolean;
}>();

const value = defineModel<string>({ required: true });
</script>

<template>
	<label class="flex flex-col gap-1.5 text-label font-semibold text-ink">
		{{ label }}
		<input
			v-model="value"
			:type="type ?? 'text'"
			:autocomplete="autocomplete"
			:required="!optional"
			class="field font-normal"
		/>
	</label>
</template>
