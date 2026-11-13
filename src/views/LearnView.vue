<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import LessonRow from "../components/LessonRow.vue";
import LoadState from "../components/LoadState.vue";
import ProgressBar from "../components/ProgressBar.vue";
import type { Lesson } from "../content/types";
import { useLocalized } from "../content/use-localized";
import { fetchLessons, fetchTrack } from "../lib/content-api";
import { AppError } from "../lib/errors";
import { lessonStatuses } from "../lib/learning";
import { useAuth } from "../lib/use-auth";
import { useLoad } from "../lib/use-load";
import { useProgressStore } from "../stores/progress";

const { user } = useAuth();
const progress = useProgressStore();
const { t } = useI18n();
const localized = useLocalized();

const { data, loading, error, reload } = useLoad(async () => {
	const track = user.value?.track;
	if (!track) throw new AppError("contentNotFound");
	const [content, lessons] = await Promise.all([
		fetchTrack(track),
		fetchLessons(track),
	]);
	const byId = new Map<string, Lesson>(lessons.map((lesson) => [lesson.id, lesson]));
	return { content, byId };
});

const statuses = computed(() =>
	data.value ? lessonStatuses(data.value.content, progress) : {},
);

// Each module with its lessons in order, ready for the template.
const modules = computed(() => {
	const loaded = data.value;
	if (!loaded) return [];
	return loaded.content.modules.map((module) => {
		const lessons = module.lessonIds.flatMap((id) => {
			const lesson = loaded.byId.get(id);
			return lesson ? [{ lesson, status: statuses.value[id] ?? "locked" }] : [];
		});
		const done = lessons.filter((row) => row.status === "done").length;
		return { module, lessons, done, total: lessons.length };
	});
});
</script>

<template>
	<div class="flex flex-col gap-8">
		<div>
			<h1 class="text-title">{{ t("learn.title") }}</h1>
			<p class="mt-2 text-lead text-ink-muted">{{ t("learn.subtitle") }}</p>
		</div>

		<LoadState
			:loading="loading"
			:error="error"
			:loading-text="t('learn.loading')"
			@retry="reload"
		>
			<section
				v-for="({ module, lessons, done, total }, index) in modules"
				:key="module.id"
				class="card flex flex-col gap-5"
			>
				<div class="flex flex-col gap-2">
					<p class="text-sm font-semibold text-ink-muted">
						{{ t("learn.module", { number: index + 1 }) }}
					</p>
					<h2 class="text-heading">{{ localized(module.title) }}</h2>
					<p class="text-ink-muted">{{ localized(module.summary) }}</p>
				</div>
				<div class="flex flex-col gap-2">
					<ProgressBar
						:value="done"
						:max="total"
						:label="t('learn.lessonsDone', { done, total })"
					/>
					<p class="text-sm text-ink-muted tabular-nums">
						{{ t("learn.lessonsDone", { done, total }) }}
					</p>
				</div>
				<div class="-mx-3 flex flex-col">
					<LessonRow
						v-for="row in lessons"
						:key="row.lesson.id"
						:lesson="row.lesson"
						:status="row.status"
					/>
				</div>
			</section>
		</LoadState>
	</div>
</template>
