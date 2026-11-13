<script setup lang="ts">
import { ICONS, type IconName } from "./icons";

withDefaults(defineProps<{ name: IconName; size?: number }>(), { size: 20 });
</script>

<template>
	<component
		:is="ICONS[name]"
		:size="size"
		:stroke-width="1.75"
		aria-hidden="true"
	/>
</template>
