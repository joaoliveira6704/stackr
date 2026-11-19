<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { type BadgeScreen, badgesForScreen } from "../lib/badges";
import { useProgressStore } from "../stores/progress";
import AppIcon from "./AppIcon.vue";
import { BADGE_ICONS } from "./icons";
import { BADGE_TONES, TONE_CLASSES } from "./tones";

// The badges of the lessons a screen puts into practice. Earned ones show in
// their own colour, the others stay muted with a lock until the lesson is done.
const props = defineProps<{ screen: BadgeScreen }>();
const progress = useProgressStore();
const { t } = useI18n();

const badges = computed(() => badgesForScreen(props.screen, progress.badges));
const earnedCount = computed(() => badges.value.filter((badge) => badge.earned).length);
</script>

<template>
	<section class="card flex flex-col gap-4" :aria-label="t('badges.title')">
		<header class="flex flex-wrap items-end justify-between gap-2">
			<div>
				<h2 class="text-subheading">{{ t("badges.title") }}</h2>
				<p class="text-sm text-ink-muted">{{ t("badges.subtitle") }}</p>
			</div>
			<span class="chip tone-sun">
				<AppIcon name="badge" :size="14" />
				{{ t("badges.count", { earned: earnedCount, total: badges.length }) }}
			</span>
		</header>
		<ul class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
			<li
				v-for="badge in badges"
				:key="badge.id"
				:data-locked="badge.earned ? undefined : ''"
				class="group flex items-center gap-3"
			>
				<span
					class="icon-tile shrink-0"
					:class="badge.earned ? TONE_CLASSES[BADGE_TONES[badge.id]] : 'tone-neutral'"
				>
					<AppIcon :name="badge.earned ? BADGE_ICONS[badge.id] : 'lock'" />
				</span>
				<div class="min-w-0">
					<p class="font-bold group-data-locked:text-ink-muted">
						{{ t(`badges.items.${badge.id}.name`) }}
					</p>
					<p class="text-xs text-ink-muted">
						{{ badge.earned ? t("badges.earned") : t(`badges.items.${badge.id}.lesson`) }}
					</p>
				</div>
			</li>
		</ul>
	</section>
</template>
