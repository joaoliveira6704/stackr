<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import AppIcon from "../components/AppIcon.vue";
import LoadState from "../components/LoadState.vue";
import { useLocalized } from "../content/use-localized";
import { canOpenLesson } from "../lib/learning";
import { useLesson } from "../lib/use-lesson";
import { useProgressStore } from "../stores/progress";

const props = defineProps<{ lessonId: string }>();

const progress = useProgressStore();
const { t } = useI18n();
const localized = useLocalized();
const { data, loading, error, reload, status } = useLesson(props.lessonId);

const router = useRouter();

// Reaching the button at the end of the lesson is what counts as reading it.
function startQuiz() {
	progress.markLessonRead(props.lessonId);
	void router.push(`/learn/${props.lessonId}/quiz`);
}

const sectionsToReview = computed(
	() => progress.sectionsToReview[props.lessonId] ?? [],
);
</script>

<template>
	<div class="flex flex-col gap-8">
		<RouterLink to="/learn" class="btn-ghost btn-sm self-start">
			<AppIcon name="arrowLeft" :size="16" />
			{{ t("lesson.back") }}
		</RouterLink>

		<LoadState
			:loading="loading"
			:error="error"
			:loading-text="t('lesson.loading')"
			@retry="reload"
		>
			<div v-if="!canOpenLesson(status)" class="card flex items-center gap-4">
				<span class="icon-tile tone-neutral"><AppIcon name="lock" /></span>
				<p class="font-semibold">{{ t("lesson.locked") }}</p>
			</div>

			<article v-else-if="data" class="flex flex-col gap-6">
				<header>
					<p class="text-sm font-semibold text-ink-muted tabular-nums">
						{{ t("learn.minutes", { minutes: data.lesson.minutes }) }}
					</p>
					<h1 class="text-title">{{ localized(data.lesson.title) }}</h1>
					<p class="mt-2 text-lead text-ink-muted">
						{{ localized(data.lesson.summary) }}
					</p>
				</header>

				<div
					v-if="status === 'review'"
					role="status"
					class="card-tint tone-tangerine flex items-start gap-4"
				>
					<AppIcon name="alert" :size="22" class="mt-0.5 shrink-0" />
					<div>
						<p class="font-bold">{{ t("lesson.reviewTitle") }}</p>
						<p class="mt-1 text-sm text-ink">{{ t("lesson.reviewMessage") }}</p>
					</div>
				</div>

				<section
					v-for="section in data.lesson.sections"
					:key="section.id"
					class="card flex flex-col gap-3"
					:class="sectionsToReview.includes(section.id) && 'ring-2 ring-tangerine'"
				>
					<div class="flex items-start justify-between gap-3">
						<h2 class="text-heading">{{ localized(section.title) }}</h2>
						<span
							v-if="sectionsToReview.includes(section.id)"
							class="chip tone-tangerine shrink-0"
						>
							{{ t("lesson.reviewTag") }}
						</span>
					</div>
					<p class="leading-relaxed">{{ localized(section.body) }}</p>
					<div v-if="section.example" class="rounded-field bg-brand/12 p-4">
						<p class="text-sm font-semibold text-brand-strong">{{ t("lesson.example") }}</p>
						<p class="mt-1 text-sm">{{ localized(section.example) }}</p>
					</div>
				</section>

				<button type="button" class="btn-primary self-start" @click="startQuiz">
					{{ t("lesson.startQuiz") }}
					<AppIcon name="arrowRight" :size="18" />
				</button>
			</article>
		</LoadState>
	</div>
</template>
