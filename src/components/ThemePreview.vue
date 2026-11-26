<!-- A small window sample of a colour theme for the shop: the theme's orbs
glowing behind a tiny glass sidebar and card, so the user sees the look before
buying it. An animated theme moves in the sample too, the same way the real
backdrop does, and stands still for people who ask for less motion. -->
<script setup lang="ts">
import { computed } from "vue";
import type { PaletteColour } from "../lib/shop";
import { SWATCH_CLASSES } from "./tones";

const props = defineProps<{
	/** The four orb colours, in the order of the real backdrop. */
	orbs: readonly PaletteColour[];
	animated: boolean;
	/** A taller window, for the preview dialog. */
	large?: boolean;
}>();

const PLACES = [
	{ place: "-top-8 -left-6 size-24", delay: "[animation-delay:0s]" },
	{ place: "-top-2 -right-8 size-20", delay: "[animation-delay:-4s]" },
	{ place: "-bottom-10 left-4 size-20", delay: "[animation-delay:-8s]" },
	{ place: "-right-2 -bottom-8 size-20", delay: "[animation-delay:-11s]" },
];

const lights = computed(() =>
	PLACES.map((spot, index) => ({
		...spot,
		colour: SWATCH_CLASSES[props.orbs[index]],
		next: SWATCH_CLASSES[props.orbs[(index + 1) % props.orbs.length]],
	})),
);
</script>

<template>
	<div
		aria-hidden="true"
		class="group relative isolate h-28 w-full data-large:h-48 overflow-hidden rounded-field bg-surface ring-1 ring-line"
		:data-animated="animated || undefined"
		:data-large="large || undefined"
		data-theme-preview
	>
		<div
			v-for="light in lights"
			:key="light.place"
			class="absolute group-data-animated:motion-safe:animate-orb-drift-sm"
			:class="[light.place, light.delay]"
			data-sample-orb
		>
			<div class="orb orb-sm inset-0" :class="light.colour" />
			<div
				class="orb orb-sm inset-0 hidden animate-orb-shift group-data-animated:motion-safe:block"
				:class="[light.next, light.delay]"
			/>
		</div>

		<div
			class="glass absolute top-1/2 left-2 flex h-16 w-4 -translate-y-1/2 flex-col items-center justify-center gap-1.5 rounded-full"
		>
			<span class="size-1.5 rounded-full bg-brand" />
			<span class="size-1.5 rounded-full bg-ink-faint" />
			<span class="size-1.5 rounded-full bg-ink-faint" />
		</div>
		<div
			class="glass absolute top-3 right-3 bottom-3 left-9 flex flex-col justify-between rounded-tile p-2.5"
		>
			<div class="flex flex-col gap-1.5">
				<span class="h-1.5 w-2/3 rounded-full bg-ink/25" />
				<span class="h-1.5 w-1/3 rounded-full bg-ink/15" />
			</div>
			<span class="h-2.5 w-10 rounded-full bg-brand" />
		</div>
	</div>
</template>
