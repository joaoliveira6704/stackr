<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { IconName } from "../components/icons";
import LevelCard from "../components/LevelCard.vue";
import StatCard from "../components/StatCard.vue";
import type { Tone } from "../components/tones";
import { useAuth } from "../lib/use-auth";
import { useProgressStore } from "../stores/progress";

const { user } = useAuth();
const progress = useProgressStore();
const { t, n } = useI18n();

const firstName = computed(() => user.value?.name.split(" ")[0] ?? "");

interface Stat {
	key: "xp" | "stacks" | "streak" | "lessons";
	icon: IconName;
	tone: Tone;
	value: number;
}

const stats = computed<Stat[]>(() => [
	{ key: "xp", icon: "sparkle", tone: "grape", value: progress.xp },
	{ key: "stacks", icon: "stacks", tone: "sun", value: progress.stacks },
	{ key: "streak", icon: "flame", tone: "tangerine", value: progress.streak },
	{
		key: "lessons",
		icon: "book",
		tone: "brand",
		value: progress.completedLessons.length,
	},
]);
</script>

<template>
	<div class="flex flex-col gap-8">
		<div>
			<h1 class="text-title sm:text-display">
				{{ t("dashboard.greeting", { name: firstName }) }}
			</h1>
			<p class="mt-2 text-lead text-ink-muted">{{ t("dashboard.subtitle") }}</p>
		</div>

		<section class="card">
			<h2 class="mb-4 text-sm font-semibold text-ink-muted">
				{{ t("dashboard.currentLevel") }}
			</h2>
			<LevelCard :xp="progress.xp" />
		</section>

		<section class="flex flex-col gap-4">
			<h2 class="text-heading">{{ t("dashboard.statsTitle") }}</h2>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<StatCard
					v-for="stat in stats"
					:key="stat.key"
					:icon="stat.icon"
					:tone="stat.tone"
					:label="t(`stats.${stat.key}`)"
					:detail="t(`stats.${stat.key}Detail`)"
					:value="n(stat.value)"
				/>
			</div>
		</section>
	</div>
</template>
