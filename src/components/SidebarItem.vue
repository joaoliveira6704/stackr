<script setup lang="ts">
import AppIcon from "./AppIcon.vue";
import type { IconName } from "./icons";

defineProps<{ icon: IconName; label: string; to?: string }>();
defineEmits<{ click: [] }>();
</script>

<template>
	<RouterLink v-if="to" :to="to" class="nav-item">
		<AppIcon :name="icon" class="shrink-0" />
		<span class="sidebar-label">{{ label }}</span>
	</RouterLink>
	<button v-else type="button" class="nav-item" @click="$emit('click')">
		<AppIcon :name="icon" class="shrink-0" />
		<span class="sidebar-label">{{ label }}</span>
	</button>
</template>
