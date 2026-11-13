<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import AppIcon from "../components/AppIcon.vue";
import { TRACK_ICONS } from "../components/icons";
import LevelCard from "../components/LevelCard.vue";
import StatRow from "../components/StatRow.vue";
import { TONE_CLASSES, TRACK_TONES } from "../components/tones";
import { ONBOARDING_PATH } from "../lib/onboarding";
import { useAuth } from "../lib/use-auth";
import { useProgressStore } from "../stores/progress";

const { user, signOut } = useAuth();
const progress = useProgressStore();
const { t, n } = useI18n();
const router = useRouter();

const firstName = computed(() => user.value?.name.split(" ")[0] ?? "");

function handleSignOut() {
	signOut();
	void router.push("/");
}
</script>

<template>
	<div class="flex flex-col gap-8">
		<div>
			<h1 class="text-4xl font-extrabold tracking-tight">
				{{ t("dashboard.greeting", { name: firstName }) }}
			</h1>
			<p class="mt-2 text-ink-muted">{{ t("dashboard.subtitle") }}</p>
		</div>

		<div class="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
			<section class="card flex flex-col gap-6 p-7">
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
				<section class="card flex flex-col gap-4 p-7">
					<p class="text-sm text-ink-muted">{{ t("dashboard.track") }}</p>
					<div v-if="user?.track" class="flex items-center gap-4">
						<span
							class="icon-tile size-14 rounded-2xl"
							:class="TONE_CLASSES[TRACK_TONES[user.track]]"
						>
							<AppIcon :name="TRACK_ICONS[user.track]" :size="26" />
						</span>
						<div>
							<p class="text-2xl font-bold tracking-tight">
								{{ t(`tracks.${user.track}.name`) }}
							</p>
							<p class="text-sm text-ink-muted">
								{{ t(`tracks.${user.track}.tagline`) }}
							</p>
						</div>
					</div>
					<p v-else class="text-2xl font-bold">{{ t("dashboard.noTrack") }}</p>
					<RouterLink :to="ONBOARDING_PATH" class="btn-secondary self-start px-4 py-2 text-sm">
						{{ t("dashboard.changeTrack") }}
					</RouterLink>
				</section>

				<section class="flex flex-col gap-3 rounded-[1.75rem] bg-brand/12 p-7">
					<div class="flex items-center justify-between">
						<p class="text-sm text-ink-muted">{{ t("dashboard.nextStep") }}</p>
						<span class="chip bg-brand text-on-brand">{{ t("common.comingSoon") }}</span>
					</div>
					<p class="text-lg font-bold">{{ t("dashboard.nextStepTitle") }}</p>
					<p class="text-sm text-ink-muted">{{ t("dashboard.nextStepDetail") }}</p>
				</section>
			</div>
		</div>

		<section class="card p-7">
			<h2 class="font-semibold">{{ t("dashboard.account") }}</h2>
			<div class="mt-2 divide-y divide-line">
				<StatRow icon="user" :title="t('dashboard.name')" :value="user?.name ?? '—'" />
				<StatRow icon="mail" :title="t('common.email')" :value="user?.email ?? '—'" />
			</div>
			<button type="button" class="btn-secondary mt-4" @click="handleSignOut">
				{{ t("nav.logout") }}
			</button>
		</section>
	</div>
</template>
