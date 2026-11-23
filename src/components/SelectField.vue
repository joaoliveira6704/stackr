<script setup lang="ts" generic="T extends string">
import AppIcon from "./AppIcon.vue";

defineProps<{
	label: string;
	options: { value: T; label: string }[];
}>();

const value = defineModel<T>({ required: true });
</script>

<template>
	<label class="flex flex-col gap-1.5 text-label font-semibold text-ink">
		{{ label }}
		<span class="relative flex items-center">
			<select v-model="value" class="field appearance-none pr-10 font-normal">
				<option v-for="option in options" :key="option.value" :value="option.value">
					{{ option.label }}
				</option>
			</select>
			<AppIcon
				name="dropdown"
				:size="18"
				class="pointer-events-none absolute right-4 text-ink-muted"
			/>
		</span>
	</label>
</template>
