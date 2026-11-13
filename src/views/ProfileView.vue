<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import AppIcon from "../components/AppIcon.vue";
import { TRACK_ICONS } from "../components/icons";
import LevelCard from "../components/LevelCard.vue";
import StatRow from "../components/StatRow.vue";
import { TONE_CLASSES, TRACK_TONES } from "../components/tones";
import { ONBOARDING_PATH } from "../lib/onboarding";
import { useAuth } from "../lib/use-auth";
import { useLogout } from "../lib/use-logout";
import { useProgressStore } from "../stores/progress";

const { user } = useAuth();
const { logOut } = useLogout();
const progress = useProgressStore();
const { t, n } = useI18n();

const initials = computed(() =>
	(user.value?.name ?? "")
		.split(" ")
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join(""),
);

</script>

<template>
	<div class="flex flex-col gap-8">
		<div>
			<h1 class="text-title">{{ t("profile.title") }}</h1>
			<p class="mt-2 text-ink-muted">{{ t("profile.subtitle") }}</p>
		</div>

		<section class="card flex flex-col gap-4">
			<div class="flex items-center gap-4">
				<span aria-hidden="true" class="icon-tile icon-tile-xl tone-brand text-heading">
					{{ initials }}
				</span>
				<div class="min-w-0">
					<h2 class="text-heading truncate">{{ user?.name }}</h2>
					<p class="truncate text-sm text-ink-muted">{{ user?.email }}</p>
				</div>
			</div>
			<div class="divide-y divide-line border-t border-line">
				<StatRow icon="user" :title="t('profile.name')" :value="user?.name ?? '—'" />
				<StatRow icon="mail" :title="t('common.email')" :value="user?.email ?? '—'" />
			</div>
			<button type="button" class="btn-secondary self-start" @click="logOut">
				{{ t("nav.logout") }}
			</button>
		</section>

		<div class="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
			<section class="card flex flex-col gap-6">
				<LevelCard :xp="progress.xp" />
				<div class="divide-y divide-line border-t border-line">
					<StatRow
						icon="sparkle"
						tone="grape"
						:title="t('stats.xp')"
						:detail="t('stats.xpDetail')"
						:value="n(progress.xp)"
					/>
					<StatRow
						icon="stacks"
						tone="sun"
						:title="t('stats.stacks')"
						:detail="t('stats.stacksDetail')"
						:value="n(progress.stacks)"
					/>
					<StatRow
						icon="flame"
						tone="tangerine"
						:title="t('stats.streak')"
						:detail="t('stats.streakDetail')"
						:value="n(progress.streak)"
					/>
				</div>
			</section>

			<div class="flex flex-col gap-4">
				<section class="card flex flex-col gap-4">
					<p class="text-sm text-ink-muted">{{ t("profile.track") }}</p>
					<div v-if="user?.track" class="flex items-center gap-4">
						<span
							class="icon-tile icon-tile-lg"
							:class="TONE_CLASSES[TRACK_TONES[user.track]]"
						>
							<AppIcon :name="TRACK_ICONS[user.track]" :size="26" />
						</span>
						<div>
							<p class="text-heading">{{ t(`tracks.${user.track}.name`) }}</p>
							<p class="text-sm text-ink-muted">
								{{ t(`tracks.${user.track}.tagline`) }}
							</p>
						</div>
					</div>
					<p v-else class="text-heading">{{ t("profile.noTrack") }}</p>
					<RouterLink :to="ONBOARDING_PATH" class="btn-secondary btn-sm self-start">
						{{ t("profile.changeTrack") }}
					</RouterLink>
				</section>

				<section class="card-tint flex flex-col gap-3 bg-brand/12">
					<div class="flex items-center justify-between">
						<p class="text-sm text-ink-muted">{{ t("profile.nextStep") }}</p>
						<span class="chip bg-brand text-on-brand">{{ t("common.comingSoon") }}</span>
					</div>
					<p class="text-subheading">{{ t("profile.nextStepTitle") }}</p>
					<p class="text-sm text-ink-muted">{{ t("profile.nextStepDetail") }}</p>
				</section>
			</div>
		</div>
	</div>
</template>
