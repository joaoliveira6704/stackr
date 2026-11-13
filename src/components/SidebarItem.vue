<script setup lang="ts">
import AppIcon from "./AppIcon.vue";
import type { IconName } from "./icons";
import ThemeSwitch from "./ThemeSwitch.vue";

// switchState is a string rather than a boolean, because Vue turns a missing
// boolean prop into false and the item could not tell "no switch" from "off".
defineProps<{
	icon: IconName;
	label: string;
	to?: string;
	switchState?: "on" | "off";
}>();
defineEmits<{ click: [] }>();
</script>

<template>
	<RouterLink v-if="to" :to="to" class="nav-item">
		<AppIcon :name="icon" class="shrink-0" />
		<span class="sidebar-label">{{ label }}</span>
	</RouterLink>
	<button
		v-else-if="switchState"
		type="button"
		role="switch"
		:aria-checked="switchState === 'on'"
		class="nav-item group/switch"
		@click="$emit('click')"
	>
		<AppIcon :name="icon" class="shrink-0" />
		<span class="sidebar-label flex flex-1 items-center justify-between gap-3">
			{{ label }}
			<ThemeSwitch />
		</span>
	</button>
	<button v-else type="button" class="nav-item" @click="$emit('click')">
		<AppIcon :name="icon" class="shrink-0" />
		<span class="sidebar-label">{{ label }}</span>
	</button>
</template>
