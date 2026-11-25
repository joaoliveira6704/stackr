<!-- The user's profile picture: an identicon drawn from their id, like the
default pictures on GitHub, in the style bought in the shop. The shop passes
`avatar` to preview a given style on the user's own pattern. -->
<script setup lang="ts">
import { computed } from "vue";
import { IDENTICON_SIZE, identicon } from "../lib/identicon";
import {
	type AvatarId,
	type AvatarMotion,
	DEFAULT_AVATAR_COLOURS,
	findAvatar,
} from "../lib/shop";
import { useProgressStore } from "../stores/progress";
import { SWATCH_CLASSES } from "./tones";

const props = defineProps<{
	seed: string;
	avatar?: AvatarId | null;
	/** "large" grows the picture on wider screens, next to a display heading. */
	size?: "large";
}>();

const progress = useProgressStore();

const style = computed(() =>
	findAvatar(props.avatar === undefined ? progress.equipped.avatar : props.avatar),
);
const colours = computed(() => style.value?.colours ?? DEFAULT_AVATAR_COLOURS);

const cells = computed(() =>
	identicon(props.seed, colours.value.length).map((colour, index) => ({
		colour,
		// Squares on the same diagonal move together, so the motion reads as
		// one wave from the top left corner to the bottom right one.
		diagonal:
			Math.floor(index / IDENTICON_SIZE) + (index % IDENTICON_SIZE),
	})),
);

const MOTION_CLASSES: Record<AvatarMotion, string> = {
	wave: "motion-safe:animate-identicon-wave",
	cycle: "motion-safe:animate-identicon-cycle",
};

// One delay per diagonal, written out in full so Tailwind can find them.
const DIAGONAL_DELAYS = [
	"[animation-delay:0s]",
	"[animation-delay:-0.2s]",
	"[animation-delay:-0.4s]",
	"[animation-delay:-0.6s]",
	"[animation-delay:-0.8s]",
	"[animation-delay:-1s]",
	"[animation-delay:-1.2s]",
	"[animation-delay:-1.4s]",
	"[animation-delay:-1.6s]",
];

function cellClasses(colour: number | null, diagonal: number): string[] {
	if (colour === null) return [];
	const painted = [SWATCH_CLASSES[colours.value[colour]]];
	const motion = style.value?.motion;
	return motion
		? [...painted, MOTION_CLASSES[motion], DIAGONAL_DELAYS[diagonal]]
		: painted;
}
</script>

<template>
	<span
		aria-hidden="true"
		class="icon-tile icon-tile-xl bg-surface-muted p-2.5 ring-1 ring-line data-large:sm:icon-tile-2xl data-large:sm:p-3.5"
		:data-large="size === 'large' || undefined"
		:data-avatar="style?.id ?? 'default'"
	>
		<span class="grid size-full grid-cols-5 grid-rows-5 gap-0.5">
			<span
				v-for="(cell, index) in cells"
				:key="index"
				class="rounded-xs"
				:class="cellClasses(cell.colour, cell.diagonal)"
				:data-cell="cell.colour === null ? undefined : cell.colour"
			/>
		</span>
	</span>
</template>
