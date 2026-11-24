<!-- One module in the grid on the Learn page. Closed, it only shows the
number, the name, how many lessons are done and, while locked, the price.
Pressing it opens the card across the whole row with the summary and the
lessons, and pressing the name again closes it. -->
<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { Lesson, Module } from "../content/types";
import { useLocalized } from "../content/use-localized";
import type { LessonStatus, ModuleStatus } from "../lib/learning";
import { MODULE_REWARD } from "../lib/rewards";
import AppIcon from "./AppIcon.vue";
import LessonRow from "./LessonRow.vue";
import ProgressBar from "./ProgressBar.vue";
import UnlockButton from "./UnlockButton.vue";

const props = defineProps<{
	module: Module;
	number: number;
	status: ModuleStatus;
	lessons: { lesson: Lesson; status: LessonStatus }[];
	expanded: boolean;
}>();
defineEmits<{ toggle: []; unlock: [] }>();

const { t, n } = useI18n();
const localized = useLocalized();

const done = computed(
	() => props.lessons.filter((row) => row.status === "done").length,
);
const total = computed(() => props.lessons.length);
const bodyId = computed(() => `module-${props.module.id}-lessons`);
</script>

<template>
	<article
		class="card relative flex flex-col gap-4 transition-transform not-data-expanded:hover:-translate-y-0.5 data-expanded:col-span-full"
		:data-module="module.id"
		:data-expanded="expanded || undefined"
		:style="{ viewTransitionName: `module-${module.id}` }"
	>
		<div class="flex items-center justify-between gap-3">
			<p class="text-sm font-semibold text-ink-muted">
				{{ t("learn.module", { number }) }}
			</p>
			<span v-if="status === 'locked'" class="chip tone-neutral tabular-nums">
				<AppIcon name="lock" :size="14" />
				{{ t("learn.modulePrice", { price: n(module.price) }) }}
			</span>
			<span v-else-if="status === 'done'" class="chip tone-brand">
				<AppIcon name="check" :size="14" />
				{{ t("learn.moduleDone") }}
			</span>
		</div>

		<h2 class="text-subheading">
			<!-- Closed, the button stretches over the whole card through its
			after: layer, so the card is pressed anywhere. Open, the layer goes
			away so the lessons and buttons inside can be pressed. -->
			<button
				type="button"
				class="group/toggle flex w-full items-center justify-between gap-3 text-left after:absolute after:inset-0 after:rounded-card aria-expanded:after:hidden"
				:aria-expanded="expanded"
				:aria-controls="bodyId"
				@click="$emit('toggle')"
			>
				{{ localized(module.title) }}
				<AppIcon
					name="dropdown"
					class="shrink-0 text-ink-muted transition-transform group-aria-expanded/toggle:rotate-180"
				/>
			</button>
		</h2>

		<div class="flex flex-col gap-2">
			<ProgressBar :value="done" :max="total" :label="t('learn.lessonsDone', { done, total })" />
			<p class="text-sm text-ink-muted tabular-nums">
				{{ t("learn.lessonsShort", { done, total }) }}
			</p>
		</div>

		<div v-if="expanded" :id="bodyId" class="flex flex-col gap-5 border-t border-line pt-5">
			<p class="text-ink-muted">{{ localized(module.summary) }}</p>
			<UnlockButton
				v-if="status === 'locked'"
				:price="module.price"
				@unlock="$emit('unlock')"
			/>
			<p v-else-if="status === 'open'" class="text-sm text-ink-muted tabular-nums">
				{{ t("learn.moduleBonus", { xp: n(MODULE_REWARD.xp), stacks: n(MODULE_REWARD.stacks) }) }}
			</p>
			<div class="-mx-3 flex flex-col">
				<LessonRow
					v-for="row in lessons"
					:key="row.lesson.id"
					:lesson="row.lesson"
					:status="row.status"
					:locked-hint="status === 'locked' ? t('learn.moduleLockedHint') : undefined"
				/>
			</div>
		</div>
	</article>
</template>
