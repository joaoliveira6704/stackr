<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { Lesson } from "../content/types";
import { useLocalized } from "../content/use-localized";
import { canOpenLesson, type LessonStatus } from "../lib/learning";
import AppIcon from "./AppIcon.vue";
import { LESSON_STATUS_LOOK } from "./lesson-status";
import { TONE_CLASSES } from "./tones";

defineProps<{ lesson: Lesson; status: LessonStatus }>();

const { t } = useI18n();
const localized = useLocalized();
</script>

<template>
	<component
		:is="canOpenLesson(status) ? 'RouterLink' : 'div'"
		:to="canOpenLesson(status) ? `/learn/${lesson.id}` : undefined"
		:title="canOpenLesson(status) ? undefined : t('learn.lockedHint')"
		:aria-disabled="canOpenLesson(status) ? undefined : 'true'"
		class="flex items-center gap-4 rounded-field p-3 transition-colors"
		:class="canOpenLesson(status) ? 'hover:bg-glass-strong' : 'opacity-60'"
	>
		<span class="icon-tile" :class="TONE_CLASSES[LESSON_STATUS_LOOK[status].tone]">
			<AppIcon :name="LESSON_STATUS_LOOK[status].icon" />
		</span>
		<div class="min-w-0 flex-1">
			<p class="font-bold">{{ localized(lesson.title) }}</p>
			<p class="truncate text-sm text-ink-muted">{{ localized(lesson.summary) }}</p>
		</div>
		<div class="flex shrink-0 flex-col items-end gap-1">
			<span class="chip" :class="TONE_CLASSES[LESSON_STATUS_LOOK[status].tone]">
				{{ t(`learn.status.${status}`) }}
			</span>
			<span class="text-xs text-ink-faint tabular-nums">
				{{ t("learn.minutes", { minutes: lesson.minutes }) }}
			</span>
		</div>
	</component>
</template>
