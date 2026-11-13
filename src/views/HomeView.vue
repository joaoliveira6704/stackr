<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import AppIcon from "../components/AppIcon.vue";
import { TRACK_ICONS } from "../components/icons";
import LevelCard from "../components/LevelCard.vue";
import StatRow from "../components/StatRow.vue";
import { TONE_CLASSES, TRACK_TONES } from "../components/tones";
import { TRACKS } from "../lib/tracks";
import { useAuth } from "../lib/use-auth";

const { user } = useAuth();
const { t, n } = useI18n();

const FACTS = [
	{ key: "tracks", tone: "brand" },
	{ key: "lesson", tone: "grape" },
	{ key: "pass", tone: "tangerine" },
] as const;

const STEPS = [
	{ key: "lesson", icon: "book", tone: "brand" },
	{ key: "quiz", icon: "quiz", tone: "grape" },
	{ key: "reward", icon: "trophy", tone: "sun" },
] as const;

// Sample figures for the preview card only, they are not real user data.
const PREVIEW = { xp: 440, stacks: 85, streak: 6 };

const primaryAction = computed(() =>
	user.value
		? { to: "/dashboard", label: t("home.goToDashboard") }
		: { to: "/signup", label: t("home.start") },
);
</script>

<template>
	<div class="flex flex-col gap-24 sm:gap-32">
		<section class="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
			<div class="flex min-w-0 flex-col items-start gap-6">
				<span class="chip tone-brand">
					<AppIcon name="sparkle" :size="14" />
					{{ t("home.eyebrow") }}
				</span>
				<h1
					class="text-title text-balance sm:text-display"
				>
					{{ t("home.title") }}
				</h1>
				<p class="max-w-md text-lead text-ink-muted">{{ t("home.subtitle") }}</p>
				<div class="flex flex-wrap gap-3 pt-2">
					<RouterLink :to="primaryAction.to" class="btn-primary">
						{{ primaryAction.label }}
						<AppIcon name="arrowRight" :size="18" />
					</RouterLink>
					<RouterLink v-if="!user" to="/login" class="btn-secondary">
						{{ t("home.login") }}
					</RouterLink>
				</div>
			</div>
			<div class="panel min-w-0 bg-brand/12">
				<!-- biome-ignore lint/a11y/useAltText: the alt text is bound from i18n -->
				<img
					src="/hero-image.png"
					:alt="t('home.heroImageAlt')"
					class="mx-auto w-full max-w-lg"
					width="2969"
					height="2468"
				/>
			</div>
		</section>

		<section class="grid grid-cols-1 gap-4 sm:grid-cols-3">
			<div
				v-for="fact in FACTS"
				:key="fact.key"
				class="card-tint"
				:class="TONE_CLASSES[fact.tone]"
			>
				<p class="text-display tabular-nums">
					{{ t(`home.facts.${fact.key}.value`) }}
				</p>
				<p class="mt-2 font-semibold text-ink">
					{{ t(`home.facts.${fact.key}.label`) }}
				</p>
			</div>
		</section>

		<section class="flex flex-col gap-10">
			<div class="max-w-xl">
				<h2 class="text-title">
					{{ t("home.tracksTitle") }}
				</h2>
				<p class="mt-3 text-lead text-ink-muted">{{ t("home.tracksSubtitle") }}</p>
			</div>
			<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
				<article
					v-for="track in TRACKS"
					:key="track"
					class="card flex flex-col gap-4"
				>
					<span class="icon-tile icon-tile-lg" :class="TONE_CLASSES[TRACK_TONES[track]]">
						<AppIcon :name="TRACK_ICONS[track]" :size="26" />
					</span>
					<div>
						<h3 class="text-heading">
							{{ t(`tracks.${track}.name`) }}
						</h3>
						<p class="mt-1 text-sm font-semibold">
							{{ t(`tracks.${track}.tagline`) }}
						</p>
					</div>
					<p class="text-sm leading-relaxed text-ink-muted">
						{{ t(`tracks.${track}.description`) }}
					</p>
				</article>
			</div>
		</section>

		<section class="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
			<div class="flex flex-col gap-8">
				<div>
					<h2 class="text-title">
						{{ t("home.howTitle") }}
					</h2>
					<p class="mt-3 text-lead text-ink-muted">{{ t("home.howSubtitle") }}</p>
				</div>
				<ol class="flex flex-col gap-3">
					<li
						v-for="step in STEPS"
						:key="step.key"
						class="card flex items-start gap-4 p-5"
					>
						<span class="icon-tile" :class="TONE_CLASSES[step.tone]">
							<AppIcon :name="step.icon" :size="22" />
						</span>
						<div>
							<h3 class="font-bold">{{ t(`home.steps.${step.key}.title`) }}</h3>
							<p class="mt-1 text-sm text-ink-muted">
								{{ t(`home.steps.${step.key}.detail`) }}
							</p>
						</div>
					</li>
				</ol>
			</div>

			<div aria-hidden="true" class="panel min-w-0 bg-grape/15">
				<div class="card">
					<p class="text-sm text-ink-muted">{{ t("progress.label") }}</p>
					<div class="mt-3">
						<LevelCard :xp="PREVIEW.xp" />
					</div>
					<div class="mt-5 divide-y divide-line border-t border-line">
						<StatRow
							icon="sparkle"
							tone="grape"
							:title="t('stats.xp')"
							:detail="t('stats.xpDetail')"
							:value="n(PREVIEW.xp)"
						/>
						<StatRow
							icon="stacks"
							tone="sun"
							:title="t('stats.stacks')"
							:detail="t('stats.stacksDetail')"
							:value="n(PREVIEW.stacks)"
						/>
						<StatRow
							icon="flame"
							tone="tangerine"
							:title="t('stats.streak')"
							:detail="t('stats.streakDetail')"
							:value="n(PREVIEW.streak)"
						/>
					</div>
				</div>
				<div class="card mt-3 ml-auto flex w-fit max-w-full items-center gap-3 p-4">
					<span class="icon-tile tone-brand">
						<AppIcon name="book" />
					</span>
					<div class="min-w-0">
						<p class="text-xs text-ink-muted">{{ t("home.preview.nextLesson") }}</p>
						<p class="text-sm font-bold">{{ t("home.preview.nextLessonTitle") }}</p>
						<p class="text-xs text-ink-muted">
							{{ t("home.preview.nextLessonDetail") }}
						</p>
					</div>
				</div>
			</div>
		</section>

		<section
			class="panel grid grid-cols-1 items-center gap-8 overflow-hidden bg-tangerine/12 md:grid-cols-[1fr_auto]"
		>
			<div class="flex flex-col items-start gap-4">
				<span class="chip tone-tangerine">
					<AppIcon name="target" :size="14" />
					{{ t("home.rule.eyebrow") }}
				</span>
				<h2 class="text-title">{{ t("home.rule.title") }}</h2>
				<p class="max-w-xl text-ink-muted">{{ t("home.rule.detail") }}</p>
			</div>
			<!-- biome-ignore lint/a11y/useAltText: the alt text is bound from i18n -->
			<img
				src="/killer-feature.png"
				:alt="t('home.ruleImageAlt')"
				class="mx-auto w-56 sm:w-64"
				width="655"
				height="668"
			/>
		</section>

		<section
			class="panel grid grid-cols-1 items-center gap-8 overflow-hidden bg-on-brand/90 text-white md:grid-cols-[1fr_auto]"
		>
			<div class="flex flex-col items-start gap-4">
				<h2 class="text-title">
					{{ t("home.ctaTitle") }}
				</h2>
				<p class="text-lead text-white/70">{{ t("home.ctaSubtitle") }}</p>
				<RouterLink :to="primaryAction.to" class="btn-primary mt-2">
					{{ primaryAction.label }}
					<AppIcon name="arrowRight" :size="18" />
				</RouterLink>
			</div>
			<!-- biome-ignore lint/a11y/useAltText: the alt text is bound from i18n -->
			<img
				src="/social-proof.png"
				:alt="t('home.ctaImageAlt')"
				class="mx-auto w-64 sm:w-80"
				width="801"
				height="595"
			/>
		</section>
	</div>
</template>
