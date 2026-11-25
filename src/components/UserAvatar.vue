<!-- The user's profile picture: the icon bought in the shop, or their initials
when none is in use. The shop passes `avatar` to preview a given icon. -->
<script setup lang="ts">
import { computed } from "vue";
import type { AvatarId } from "../lib/shop";
import { useProgressStore } from "../stores/progress";
import AppIcon from "./AppIcon.vue";
import { AVATAR_ICONS } from "./icons";
import { AVATAR_TONES, TONE_CLASSES } from "./tones";

const props = defineProps<{ name: string; avatar?: AvatarId | null }>();

const progress = useProgressStore();

const shown = computed(() =>
	props.avatar === undefined ? progress.equipped.avatar : props.avatar,
);

const initials = computed(() =>
	props.name
		.split(" ")
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join(""),
);
</script>

<template>
	<span
		aria-hidden="true"
		class="icon-tile icon-tile-xl text-heading"
		:class="TONE_CLASSES[shown ? AVATAR_TONES[shown] : 'brand']"
		:data-avatar="shown ?? 'initials'"
	>
		<AppIcon v-if="shown" :name="AVATAR_ICONS[shown]" :size="30" />
		<template v-else>{{ initials }}</template>
	</span>
</template>
