<script setup lang="ts">
import AppIcon from "./AppIcon.vue";
import type { IconName } from "./icons";
import { TONE_CLASSES, type Tone } from "./tones";

defineProps<{
	title: string;
	detail?: string;
	value: string;
	icon?: IconName;
	tone?: Tone;
}>();
</script>

<template>
	<div class="flex items-center gap-4 py-3.5">
		<span v-if="icon" class="icon-tile" :class="tone && TONE_CLASSES[tone]">
			<AppIcon :name="icon" />
		</span>
		<div class="min-w-0 flex-1">
			<p class="font-bold">{{ title }}</p>
			<p v-if="detail" class="truncate text-sm text-ink-muted">{{ detail }}</p>
		</div>
		<p class="text-lg font-bold tabular-nums">{{ value }}</p>
	</div>
</template>
