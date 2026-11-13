<!--
	The visual part of the dark mode switch: a small track whose knob slides
	across and turns from a sun into a moon, with a few stars coming out in
	the track. It reads the on state from the closest parent with the
	"group/switch" class and aria-checked, so the parent stays the one real
	control for screen readers.
-->
<script setup lang="ts">
import AppIcon from "./AppIcon.vue";

const STARS = ["top-1 left-2", "top-3.5 left-3.5", "top-1.5 left-5"];
</script>

<template>
	<span
		aria-hidden="true"
		class="relative inline-flex h-6 w-11 shrink-0 items-center overflow-hidden rounded-full border border-glass-border bg-sun/25 transition-colors duration-300 group-aria-checked/switch:bg-grape/35"
	>
		<span
			v-for="star in STARS"
			:key="star"
			class="absolute size-0.5 rounded-full bg-ink opacity-0 transition-opacity duration-500 group-aria-checked/switch:opacity-80"
			:class="star"
		/>
		<span
			class="absolute left-0.5 grid size-5 place-items-center rounded-full bg-surface shadow-glass transition-transform duration-300 ease-out group-aria-checked/switch:translate-x-5 motion-reduce:transition-none"
		>
			<AppIcon
				name="sun"
				:size="12"
				class="absolute text-sun-strong transition duration-300 group-aria-checked/switch:rotate-90 group-aria-checked/switch:opacity-0"
			/>
			<AppIcon
				name="moon"
				:size="12"
				class="absolute -rotate-90 text-grape-strong opacity-0 transition duration-300 group-aria-checked/switch:rotate-0 group-aria-checked/switch:opacity-100"
			/>
		</span>
	</span>
</template>
