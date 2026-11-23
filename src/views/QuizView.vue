<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import AppIcon from "../components/AppIcon.vue";
import LoadState from "../components/LoadState.vue";
import ProgressBar from "../components/ProgressBar.vue";
import type { QuizQuestion } from "../content/types";
import { useLocalized } from "../content/use-localized";
import { canOpenLesson } from "../lib/learning";
import { isCorrect, type QuizAnswers } from "../lib/quiz";
import { useLesson } from "../lib/use-lesson";
import { type QuizOutcome, useProgressStore } from "../stores/progress";

const props = defineProps<{ lessonId: string }>();

const progress = useProgressStore();
const { t, n } = useI18n();
const localized = useLocalized();
const { data, loading, error, reload, status, nextLesson } = useLesson(
	props.lessonId,
	{ withQuiz: true },
);

// Letters are a visual key next to each answer, so they are not translated.
const OPTION_LETTERS = ["A", "B", "C", "D"];

const index = ref(0);
const answers = ref<QuizAnswers>({});
const checked = ref(false);
const outcome = ref<QuizOutcome | null>(null);

const questions = computed(() => data.value?.quiz?.questions ?? []);
const question = computed<QuizQuestion | undefined>(
	() => questions.value[index.value],
);
const selected = computed(() =>
	question.value ? answers.value[question.value.id] : undefined,
);
const isLast = computed(() => index.value === questions.value.length - 1);

function choose(optionId: string) {
	if (!question.value || checked.value) return;
	answers.value = { ...answers.value, [question.value.id]: optionId };
}

function resultFor(optionId: string): "correct" | "wrong" | undefined {
	if (!checked.value || !question.value) return undefined;
	if (optionId === question.value.correctOptionId) return "correct";
	return optionId === selected.value ? "wrong" : undefined;
}

function goNext() {
	if (isLast.value) {
		outcome.value = progress.submitQuiz(props.lessonId, questions.value, answers.value);
		return;
	}
	index.value += 1;
	checked.value = false;
}
</script>

<template>
	<div class="mx-auto flex max-w-xl flex-col gap-8">
		<RouterLink :to="`/learn/${lessonId}`" class="btn-ghost btn-sm self-start">
			<AppIcon name="arrowLeft" :size="16" />
			{{ data ? localized(data.lesson.title) : t("lesson.back") }}
		</RouterLink>

		<LoadState
			:loading="loading"
			:error="error"
			:loading-text="t('quiz.loading')"
			@retry="reload"
		>
			<div v-if="!canOpenLesson(status)" class="card flex items-center gap-4">
				<span class="icon-tile tone-neutral"><AppIcon name="lock" /></span>
				<p class="font-semibold">{{ t("lesson.locked") }}</p>
			</div>

			<div
				v-else-if="!outcome && !progress.canTakeQuiz(lessonId)"
				class="card flex flex-col items-start gap-4"
			>
				<span class="icon-tile icon-tile-lg tone-grape"><AppIcon name="book" :size="24" /></span>
				<div>
					<h1 class="text-heading">{{ t("quiz.readFirstTitle") }}</h1>
					<p class="mt-2 text-ink-muted">{{ t("quiz.readFirstMessage") }}</p>
				</div>
				<RouterLink :to="`/learn/${lessonId}`" class="btn-primary">
					{{ t("quiz.goToLesson") }}
					<AppIcon name="arrowRight" :size="18" />
				</RouterLink>
			</div>

			<section v-else-if="outcome" class="card flex flex-col gap-5" aria-live="polite">
				<span
					class="icon-tile icon-tile-xl"
					:class="outcome.score.passed ? 'tone-brand' : 'tone-tangerine'"
				>
					<AppIcon :name="outcome.score.passed ? 'trophy' : 'target'" :size="28" />
				</span>
				<div>
					<h1 class="text-title">
						{{ outcome.score.passed ? t("quiz.passTitle") : t("quiz.failTitle") }}
					</h1>
					<p class="mt-2 text-ink-muted">
						{{
							t(outcome.score.passed ? "quiz.passMessage" : "quiz.failMessage", {
								correct: outcome.score.correct,
								total: outcome.score.total,
							})
						}}
					</p>
				</div>
				<div class="flex items-center justify-between border-t border-line pt-4">
					<p class="font-bold">{{ t("quiz.score") }}</p>
					<p class="text-title tabular-nums">{{ n(outcome.score.percent) }}%</p>
				</div>
				<div v-if="outcome.score.passed" class="flex flex-wrap gap-2">
					<template v-if="outcome.firstCompletion">
						<span class="chip tone-grape tabular-nums">
							{{ t("quiz.xpEarned", { amount: n(outcome.reward.xp) }) }}
						</span>
						<span class="chip tone-sun tabular-nums">
							{{ t("quiz.stacksEarned", { amount: n(outcome.reward.stacks) }) }}
						</span>
					</template>
					<p v-else class="text-sm text-ink-muted">{{ t("quiz.alreadyDone") }}</p>
				</div>
				<div class="flex flex-col gap-3 sm:flex-row">
					<template v-if="outcome.score.passed">
						<RouterLink v-if="nextLesson" :to="`/learn/${nextLesson}`" class="btn-primary">
							{{ t("quiz.nextLesson") }}
							<AppIcon name="arrowRight" :size="18" />
						</RouterLink>
						<RouterLink to="/learn" class="btn-secondary">
							{{ t("quiz.backToLearn") }}
						</RouterLink>
					</template>
					<template v-else>
						<RouterLink :to="`/learn/${lessonId}`" class="btn-primary">
							{{ t("quiz.review") }}
						</RouterLink>
						<RouterLink to="/learn" class="btn-secondary">
							{{ t("quiz.backToLearn") }}
						</RouterLink>
					</template>
				</div>
			</section>

			<section v-else-if="question" :key="question.id" class="flex flex-col gap-6">
				<div class="flex flex-col gap-3">
					<div class="flex items-center justify-between text-sm">
						<span class="text-ink-muted tabular-nums">
							{{ t("quiz.progress", { current: index + 1, total: questions.length }) }}
						</span>
						<span class="text-ink-faint">{{ t("quiz.passMark") }}</span>
					</div>
					<ProgressBar
						:value="index + 1"
						:max="questions.length"
						:label="t('quiz.progress', { current: index + 1, total: questions.length })"
					/>
				</div>

				<h1 class="text-heading sm:text-title">{{ localized(question.prompt) }}</h1>

				<fieldset class="flex flex-col gap-3">
					<legend class="sr-only">{{ localized(question.prompt) }}</legend>
					<label
						v-for="(option, optionIndex) in question.options"
						:key="option.id"
						class="choice"
						:data-result="resultFor(option.id)"
					>
						<input
							type="radio"
							class="sr-only"
							:name="question.id"
							:value="option.id"
							:checked="selected === option.id"
							:disabled="checked"
							@change="choose(option.id)"
						/>
						<span aria-hidden="true" class="choice-key">
							{{ OPTION_LETTERS[optionIndex] }}
						</span>
						<span class="flex-1 font-semibold">{{ localized(option.text) }}</span>
						<span aria-hidden="true" class="choice-mark" />
					</label>
				</fieldset>

				<div
					v-if="checked"
					role="status"
					class="card-tint flex items-start gap-3"
					:class="isCorrect(question, selected) ? 'tone-brand' : 'tone-tangerine'"
				>
					<AppIcon
						:name="isCorrect(question, selected) ? 'check' : 'alert'"
						class="mt-0.5 shrink-0"
					/>
					<div>
						<p class="font-bold">
							{{ isCorrect(question, selected) ? t("quiz.correct") : t("quiz.wrong") }}
						</p>
						<p class="mt-1 text-sm text-ink">{{ localized(question.explanation) }}</p>
					</div>
				</div>

				<button
					v-if="!checked"
					type="button"
					class="btn-primary self-end"
					:disabled="!selected"
					@click="checked = true"
				>
					{{ t("quiz.check") }}
				</button>
				<button v-else type="button" class="btn-primary self-end" @click="goNext">
					{{ isLast ? t("quiz.finish") : t("quiz.next") }}
					<AppIcon name="arrowRight" :size="18" />
				</button>
			</section>
		</LoadState>
	</div>
</template>
