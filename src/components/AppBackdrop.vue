<!-- Soft blurred colour behind every page. Glass panels are see-through, so
without something colourful underneath they would look flat and grey. The
lights are placed along the whole page and scroll with it, so long pages get
colour all the way down. Their colours come from the orb tokens, so a colour
theme from the shop can change them.

With an animated theme from the shop (level 3) each light drifts slowly and
fades into the colour of the next one, so the backdrop keeps changing while
staying inside the theme's palette. The delays are negative and different per
light, so they start mid way and never move in step. The default and the
static themes stand still, and so does everything for people who ask for less
motion. -->
<script setup lang="ts">
import { computed } from "vue";
import { isAnimatedTheme } from "../lib/shop";
import { useProgressStore } from "../stores/progress";

const progress = useProgressStore();
const animated = computed(() =>
	isAnimatedTheme(progress.equipped.colourTheme),
);

const LIGHTS = [
	{
		place: "-top-40 -left-32 size-[34rem]",
		colour: "bg-orb-1",
		next: "bg-orb-2",
		delay: "[animation-delay:0s]",
	},
	{
		place: "top-[22%] -right-40 size-[30rem]",
		colour: "bg-orb-2",
		next: "bg-orb-3",
		delay: "[animation-delay:-11s]",
	},
	{
		place: "top-[52%] -left-40 size-[30rem]",
		colour: "bg-orb-3",
		next: "bg-orb-4",
		delay: "[animation-delay:-23s]",
	},
	{
		place: "-bottom-48 left-1/4 size-[28rem]",
		colour: "bg-orb-4",
		next: "bg-orb-1",
		delay: "[animation-delay:-31s]",
	},
];
</script>

<template>
	<div
		aria-hidden="true"
		class="group pointer-events-none absolute inset-0 -z-10 overflow-hidden"
		:data-animated="animated || undefined"
	>
		<div
			v-for="light in LIGHTS"
			:key="light.colour"
			class="absolute group-data-animated:motion-safe:animate-orb-drift"
			:class="[light.place, light.delay]"
			data-orb
		>
			<div class="orb inset-0" :class="light.colour" />
			<div
				class="orb inset-0 hidden animate-orb-shift group-data-animated:motion-safe:block"
				:class="[light.next, light.delay]"
				data-orb-next
			/>
		</div>
	</div>
</template>
