<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { ONBOARDING_XP } from "../lib/onboarding";
import type { Track } from "../lib/tracks";
import AppIcon from "./AppIcon.vue";
import { TRACK_ICONS } from "./icons";
import { TONE_CLASSES, TRACK_TONES } from "./tones";

defineProps<{ track: Track; earnedXp: boolean }>();
defineEmits<{ continue: []; retake: [] }>();

const { t } = useI18n();
</script>

<template>
	<div class="flex flex-col gap-6">
		<div class="result-reveal flex flex-col items-start gap-3">
			<span class="icon-tile size-16 rounded-3xl" :class="TONE_CLASSES[TRACK_TONES[track]]">
				<AppIcon :name="TRACK_ICONS[track]" :size="30" />
			</span>
			<span class="chip mt-2">{{ t("onboarding.result.eyebrow") }}</span>
			<h1 class="text-5xl font-extrabold tracking-tight sm:text-6xl">
				{{ t(`tracks.${track}.name`) }}
			</h1>
			<p class="text-lg text-ink-muted">{{ t(`tracks.${track}.tagline`) }}</p>
		</div>

		<section class="card flex flex-col gap-5">
			<div>
				<h2 class="text-sm text-ink-muted">{{ t("onboarding.result.why") }}</h2>
				<p class="mt-1.5 text-ink">{{ t(`tracks.${track}.reason`) }}</p>
			</div>
			<div class="border-t border-line pt-5">
				<h2 class="text-sm text-ink-muted">
					{{ t("onboarding.result.whatYouLearn") }}
				</h2>
				<p class="mt-1.5 text-ink">{{ t(`tracks.${track}.description`) }}</p>
			</div>
		</section>

		<section v-if="earnedXp" class="card flex items-center gap-4">
			<span class="icon-tile" :class="TONE_CLASSES.sun">
				<AppIcon name="trophy" />
			</span>
			<div class="flex-1">
				<p class="font-semibold">{{ t("onboarding.result.reward") }}</p>
				<p class="text-sm text-ink-muted">{{ t("onboarding.result.rewardDetail") }}</p>
			</div>
			<p class="text-2xl font-bold text-brand-strong tabular-nums">
				{{ t("onboarding.result.xp", { amount: ONBOARDING_XP }) }}
			</p>
		</section>

		<div class="flex flex-col gap-3 sm:flex-row">
			<button type="button" class="btn-primary" @click="$emit('continue')">
				{{ t("onboarding.result.continue") }}
				<AppIcon name="arrowRight" :size="18" />
			</button>
			<button type="button" class="btn-secondary" @click="$emit('retake')">
				{{ t("onboarding.result.retake") }}
			</button>
		</div>
	</div>
</template>

<style scoped>
.result-reveal {
	animation: reveal 600ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

@keyframes reveal {
	from {
		opacity: 0;
		transform: translateY(16px) scale(0.98);
	}
	to {
		opacity: 1;
		transform: none;
	}
}

@media (prefers-reduced-motion: reduce) {
	.result-reveal {
		animation: none;
	}
}
</style>
