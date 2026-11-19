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
		<!-- Rows that stand for a chart series put their colour here instead. -->
		<slot name="leading">
			<span v-if="icon" class="icon-tile" :class="TONE_CLASSES[tone ?? 'neutral']">
				<AppIcon :name="icon" />
			</span>
		</slot>
		<div class="min-w-0 flex-1">
			<p class="font-bold">{{ title }}</p>
			<p v-if="detail" class="truncate text-sm text-ink-muted">{{ detail }}</p>
		</div>
		<p class="shrink-0 text-right text-subheading whitespace-nowrap tabular-nums">
			{{ value }}
		</p>
		<!-- A status chip or a small action that belongs to the row. -->
		<slot name="trailing" />
	</div>
</template>
