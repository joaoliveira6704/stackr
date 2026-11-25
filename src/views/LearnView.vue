<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { useI18n } from "vue-i18n";
import HorizontalScroller from "../components/HorizontalScroller.vue";
import LoadState from "../components/LoadState.vue";
import ModuleCard from "../components/ModuleCard.vue";
import OneOffCard from "../components/OneOffCard.vue";
import StacksBalance from "../components/StacksBalance.vue";
import type { Lesson, Module } from "../content/types";
import { useLocalized } from "../content/use-localized";
import {
	fetchLessons,
	fetchOneOffLessons,
	fetchTrack,
} from "../lib/content-api";
import { AppError } from "../lib/errors";
import { lessonStatuses, moduleStatus, oneOffStatus } from "../lib/learning";
import { useAuth } from "../lib/use-auth";
import { useLoad } from "../lib/use-load";
import { useUnlock } from "../lib/use-unlock";
import { useProgressStore } from "../stores/progress";

const { user } = useAuth();
const progress = useProgressStore();
const { t } = useI18n();
const localized = useLocalized();
const { unlock, error: unlockError } = useUnlock();

const { data, loading, error, reload } = useLoad(async () => {
	const track = user.value?.track;
	if (!track) throw new AppError("contentNotFound");
	const [content, lessons, oneOffs] = await Promise.all([
		fetchTrack(track),
		fetchLessons(track),
		fetchOneOffLessons(),
	]);
	const byId = new Map<string, Lesson>(lessons.map((lesson) => [lesson.id, lesson]));
	return { content, byId, oneOffs };
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
		return { module, lessons, status: moduleStatus(module, progress) };
	});
});

const oneOffs = computed(() =>
	(data.value?.oneOffs ?? []).map((item) => ({
		...item,
		status: oneOffStatus(item.oneOff, progress),
	})),
);

// One module open at a time. Where the browser supports it, a view
// transition lets the opened card grow across the row and the others slide
// into their new places instead of jumping.
const expandedModuleId = ref<string | null>(null);

function toggleModule(moduleId: string) {
	const change = () => {
		expandedModuleId.value =
			expandedModuleId.value === moduleId ? null : moduleId;
	};
	const reduceMotion = window.matchMedia?.(
		"(prefers-reduced-motion: reduce)",
	).matches;
	if (!document.startViewTransition || reduceMotion) {
		change();
		return;
	}
	document.startViewTransition(async () => {
		change();
		await nextTick();
	});
}

function unlockModule(module: Module) {
	void unlock({
		id: module.id,
		price: module.price,
		title: localized(module.title),
		kind: "module",
	});
}

function unlockOneOff(id: string, price: number, lesson: Lesson) {
	void unlock({ id, price, title: localized(lesson.title), kind: "oneOff" });
}
</script>

<template>
	<div class="flex flex-col gap-8">
		<header class="flex flex-wrap items-end justify-between gap-4">
			<div>
				<h1 class="text-title">{{ t("learn.title") }}</h1>
				<p class="mt-2 text-lead text-ink-muted">{{ t("learn.subtitle") }}</p>
			</div>
			<StacksBalance />
		</header>

		<p v-if="unlockError" role="alert" class="card-tint tone-tangerine font-semibold">
			{{ t(`errors.${unlockError}`) }}
		</p>

		<LoadState
			:loading="loading"
			:error="error"
			:loading-text="t('learn.loading')"
			@retry="reload"
		>
			<div class="grid grid-flow-row-dense gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<ModuleCard
					v-for="({ module, lessons, status }, index) in modules"
					:key="module.id"
					:module="module"
					:number="index + 1"
					:status="status"
					:lessons="lessons"
					:expanded="expandedModuleId === module.id"
					@toggle="toggleModule(module.id)"
					@unlock="unlockModule(module)"
				/>
			</div>

			<section aria-labelledby="extras-title">
				<HorizontalScroller v-if="oneOffs.length" :label="t('learn.extras.title')">
					<template #header>
						<div>
							<h2 id="extras-title" class="text-heading">{{ t("learn.extras.title") }}</h2>
							<p class="mt-2 text-ink-muted">{{ t("learn.extras.subtitle") }}</p>
						</div>
					</template>
					<OneOffCard
						v-for="item in oneOffs"
						:key="item.oneOff.id"
						:lesson="item.lesson"
						:status="item.status"
						:price="item.oneOff.price"
						@unlock="unlockOneOff(item.oneOff.id, item.oneOff.price, item.lesson)"
					/>
				</HorizontalScroller>
				<template v-else>
					<h2 id="extras-title" class="text-heading">{{ t("learn.extras.title") }}</h2>
					<p class="mt-2 text-ink-muted">{{ t("learn.extras.empty") }}</p>
				</template>
			</section>
		</LoadState>
	</div>
</template>
