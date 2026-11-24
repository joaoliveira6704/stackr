<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { Lesson } from "../content/types";
import { useLocalized } from "../content/use-localized";
import { canOpenLesson, type LessonStatus } from "../lib/learning";
import { ONE_OFF_STACKS_PROFIT } from "../lib/rewards";
import AppIcon from "./AppIcon.vue";
import { LESSON_STATUS_LOOK } from "./lesson-status";
import { TONE_CLASSES } from "./tones";
import UnlockButton from "./UnlockButton.vue";

defineProps<{ lesson: Lesson; status: LessonStatus; price: number }>();
defineEmits<{ unlock: [] }>();

const { t, n } = useI18n();
const localized = useLocalized();
</script>

<template>
	<article class="card flex flex-col gap-4">
		<div class="flex items-start justify-between gap-3">
			<span class="icon-tile" :class="TONE_CLASSES[LESSON_STATUS_LOOK[status].tone]">
				<AppIcon :name="LESSON_STATUS_LOOK[status].icon" />
			</span>
			<span class="chip tone-sun tabular-nums">
				{{ t("learn.extras.reward", { amount: n(price + ONE_OFF_STACKS_PROFIT) }) }}
			</span>
		</div>
		<div class="flex-1">
			<h3 class="text-subheading">{{ localized(lesson.title) }}</h3>
			<p class="mt-1 text-sm text-ink-muted">{{ localized(lesson.summary) }}</p>
			<p class="mt-2 text-sm text-ink-faint tabular-nums">
				{{ t("learn.minutes", { minutes: lesson.minutes }) }}
			</p>
		</div>
		<div v-if="canOpenLesson(status)" class="flex items-center justify-between gap-3">
			<RouterLink :to="`/learn/${lesson.id}`" class="btn-secondary btn-sm">
				{{ t("learn.extras.open") }}
				<AppIcon name="arrowRight" :size="16" />
			</RouterLink>
			<span class="chip" :class="TONE_CLASSES[LESSON_STATUS_LOOK[status].tone]">
				{{ t(`learn.status.${status}`) }}
			</span>
		</div>
		<UnlockButton v-else :price="price" @unlock="$emit('unlock')" />
	</article>
</template>
