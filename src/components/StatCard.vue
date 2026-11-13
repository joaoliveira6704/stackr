<script setup lang="ts">
import AppIcon from "./AppIcon.vue";
import type { IconName } from "./icons";
import { TONE_CLASSES, type Tone } from "./tones";

defineProps<{
	label: string;
	value: string;
	detail: string;
	icon: IconName;
	tone: Tone;
}>();
</script>

<template>
	<article class="card flex flex-col gap-4">
		<span class="icon-tile" :class="TONE_CLASSES[tone]">
			<AppIcon :name="icon" />
		</span>
		<div>
			<p class="text-sm font-semibold text-ink-muted">{{ label }}</p>
			<p class="text-title tabular-nums">{{ value }}</p>
		</div>
		<p class="text-sm text-ink-muted">{{ detail }}</p>
	</article>
</template>
