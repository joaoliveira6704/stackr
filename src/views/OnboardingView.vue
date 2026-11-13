<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import AppIcon from "../components/AppIcon.vue";
import type { IconName } from "../components/icons";
import OnboardingResult from "../components/OnboardingResult.vue";
import ProgressBar from "../components/ProgressBar.vue";
import { TONE_CLASSES } from "../components/tones";
import { type ErrorCode, errorCode } from "../lib/errors";
import {
	ONBOARDING_QUESTIONS,
	ONBOARDING_XP,
	type OnboardingAnswers,
	type OnboardingQuestion,
	scoreAnswers,
	trackForScore,
} from "../lib/onboarding";
import type { Track } from "../lib/tracks";
import { useAuth } from "../lib/use-auth";
import { useProgressStore } from "../stores/progress";

type Step = "intro" | "questions" | "result";

const INTRO_FACTS = [
	{ key: "questions", icon: "quiz", tone: "brand" },
	{ key: "duration", icon: "clock", tone: "grape" },
	{ key: "reward", icon: "trophy", tone: "sun" },
] as const;

const KIND_ICONS: Record<OnboardingQuestion["kind"], IconName> = {
	knowledge: "book",
	risk: "target",
};

// Letters are a visual key next to each answer, so they are not translated.
const OPTION_LETTERS = ["A", "B", "C", "D"];

const { user, saveOnboarding } = useAuth();
const progress = useProgressStore();
const { t } = useI18n();
const router = useRouter();

const step = ref<Step>("intro");
const questionIndex = ref(0);
const answers = ref<OnboardingAnswers>({});
const assignedTrack = ref<Track | null>(null);
const earnedXp = ref(false);
const pending = ref(false);
const error = ref<ErrorCode | null>(null);

const total = ONBOARDING_QUESTIONS.length;
const question = computed(() => ONBOARDING_QUESTIONS[questionIndex.value]);
const selected = computed(() => answers.value[question.value.id]);
const isLastQuestion = computed(() => questionIndex.value === total - 1);

function start() {
	answers.value = {};
	questionIndex.value = 0;
	error.value = null;
	step.value = "questions";
}

function choose(option: string) {
	answers.value = { ...answers.value, [question.value.id]: option };
}

function goBack() {
	if (questionIndex.value === 0) {
		step.value = "intro";
		return;
	}
	questionIndex.value -= 1;
}

function goNext() {
	if (isLastQuestion.value) {
		void finish();
		return;
	}
	questionIndex.value += 1;
}

// XP is only given the first time, so retaking the quiz cannot farm rewards.
function applyOnboardingResult(track: Track, isFirstTime: boolean) {
	progress.setTrack(track);
	progress.completeOnboarding();
	earnedXp.value = isFirstTime;
	if (isFirstTime) progress.addXp(ONBOARDING_XP);
}

async function finish() {
	const track = trackForScore(scoreAnswers(answers.value));
	const isFirstTime = !user.value?.onboardingDone;
	pending.value = true;
	error.value = null;
	try {
		await saveOnboarding(track);
		applyOnboardingResult(track, isFirstTime);
		assignedTrack.value = track;
		step.value = "result";
	} catch (cause) {
		error.value = errorCode(cause);
	} finally {
		pending.value = false;
	}
}
</script>

<template>
	<div class="mx-auto max-w-xl">
		<Transition
			mode="out-in"
			enter-active-class="transition duration-200 ease-out motion-reduce:transition-none"
			leave-active-class="transition duration-200 ease-in motion-reduce:transition-none"
			enter-from-class="translate-x-4 opacity-0"
			leave-to-class="-translate-x-4 opacity-0"
		>
			<section v-if="step === 'intro'" key="intro" class="flex flex-col gap-6">
				<span class="chip tone-brand self-start">
					<AppIcon name="sparkle" :size="14" />
					{{ t("onboarding.intro.eyebrow") }}
				</span>
				<h1 class="text-title text-balance sm:text-display">
					{{ t("onboarding.intro.title") }}
				</h1>
				<p class="text-lead text-ink-muted">{{ t("onboarding.intro.subtitle") }}</p>
				<div class="card grid grid-cols-1 gap-1 p-2 sm:grid-cols-3">
					<div
						v-for="fact in INTRO_FACTS"
						:key="fact.key"
						class="flex items-center gap-3 rounded-2xl p-3"
					>
						<span class="icon-tile icon-tile-sm" :class="TONE_CLASSES[fact.tone]">
							<AppIcon :name="fact.icon" :size="18" />
						</span>
						<span class="text-sm font-semibold">
							{{ t(`onboarding.intro.${fact.key}`) }}
						</span>
					</div>
				</div>
				<button type="button" class="btn-primary self-start" @click="start">
					{{ t("onboarding.intro.start") }}
					<AppIcon name="arrowRight" :size="18" />
				</button>
			</section>

			<section
				v-else-if="step === 'questions'"
				:key="question.id"
				class="flex flex-col gap-8"
			>
				<div class="flex flex-col gap-3">
					<div class="flex items-center justify-between text-sm">
						<span class="text-ink-muted tabular-nums">
							{{ t("onboarding.progress", { current: questionIndex + 1, total }) }}
						</span>
						<span class="chip" :class="question.kind === 'risk' ? 'tone-tangerine' : 'tone-brand'">
							<AppIcon :name="KIND_ICONS[question.kind]" :size="14" />
							{{ t(`onboarding.${question.kind}`) }}
						</span>
					</div>
					<ProgressBar
						:value="questionIndex + 1"
						:max="total"
						:label="t('onboarding.progress', { current: questionIndex + 1, total })"
					/>
				</div>

				<h1 class="text-heading sm:text-title">
					{{ t(`onboarding.questions.${question.id}.prompt`) }}
				</h1>

				<fieldset class="flex flex-col gap-3">
					<legend class="sr-only">
						{{ t(`onboarding.questions.${question.id}.prompt`) }}
					</legend>
					<label
						v-for="(option, index) in question.options"
						:key="option"
						class="choice"
					>
						<input
							type="radio"
							class="sr-only"
							:name="question.id"
							:value="option"
							:checked="selected === option"
							@change="choose(option)"
						/>
						<span aria-hidden="true" class="choice-key">
							{{ OPTION_LETTERS[index] }}
						</span>
						<span class="flex-1 font-semibold">
							{{ t(`onboarding.questions.${question.id}.options.${option}`) }}
						</span>
						<span aria-hidden="true" class="choice-mark" />
					</label>
				</fieldset>

				<p v-if="error" class="text-sm font-semibold text-tangerine-strong">
					{{ t(`errors.${error}`) }}
				</p>

				<div class="flex items-center justify-between">
					<button type="button" class="btn-secondary" @click="goBack">
						{{ t("common.back") }}
					</button>
					<button
						type="button"
						class="btn-primary"
						:disabled="!selected || pending"
						@click="goNext"
					>
						<template v-if="pending">{{ t("onboarding.saving") }}</template>
						<template v-else-if="isLastQuestion">
							{{ t("onboarding.seeResult") }}
						</template>
						<template v-else>{{ t("common.next") }}</template>
					</button>
				</div>
			</section>

			<OnboardingResult
				v-else-if="assignedTrack"
				key="result"
				:track="assignedTrack"
				:earned-xp="earnedXp"
				@continue="router.push('/dashboard')"
				@retake="start"
			/>
		</Transition>
	</div>
</template>
