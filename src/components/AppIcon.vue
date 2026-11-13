<script setup lang="ts">
import { ICON_PATHS, type IconName } from "./icons";

withDefaults(defineProps<{ name: IconName; size?: number }>(), { size: 20 });
</script>

<template>
	<svg
		:width="size"
		:height="size"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="1.75"
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-hidden="true"
	>
		<path v-for="path in ICON_PATHS[name]" :key="path" :d="path" />
	</svg>
</template>
