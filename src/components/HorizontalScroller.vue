<!-- A titled row of cards that scrolls sideways. The arrow buttons only show
when the cards do not all fit, and each one turns off at its end of the row.
The row itself can take focus, so the arrow keys scroll it too. -->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import AppIcon from "./AppIcon.vue";

defineProps<{ label: string }>();

const { t } = useI18n();
const row = ref<HTMLElement | null>(null);
const atStart = ref(true);
const atEnd = ref(true);

// A pixel of slack, because browsers round the scroll position.
const EDGE_SLACK = 1;

function updateEdges() {
	const element = row.value;
	if (!element) return;
	atStart.value = element.scrollLeft <= EDGE_SLACK;
	atEnd.value =
		element.scrollLeft + element.clientWidth >= element.scrollWidth - EDGE_SLACK;
}

// Most of a screen at a time, so the last card seen stays in view.
function scrollPage(direction: -1 | 1) {
	const element = row.value;
	if (!element) return;
	const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
	element.scrollBy?.({
		left: direction * element.clientWidth * 0.8,
		behavior: reduceMotion ? "auto" : "smooth",
	});
}

let resizeObserver: ResizeObserver | undefined;

onMounted(() => {
	updateEdges();
	if (typeof ResizeObserver === "undefined" || !row.value) return;
	resizeObserver = new ResizeObserver(updateEdges);
	resizeObserver.observe(row.value);
});

onBeforeUnmount(() => resizeObserver?.disconnect());
</script>

<template>
	<div class="flex flex-col gap-4">
		<div class="flex items-end justify-between gap-4">
			<slot name="header" />
			<div v-if="!(atStart && atEnd)" class="flex shrink-0 gap-2">
				<button
					type="button"
					class="btn-secondary btn-icon btn-sm"
					:aria-label="t('scroller.previous')"
					:disabled="atStart"
					@click="scrollPage(-1)"
				>
					<AppIcon name="arrowLeft" :size="18" />
				</button>
				<button
					type="button"
					class="btn-secondary btn-icon btn-sm"
					:aria-label="t('scroller.next')"
					:disabled="atEnd"
					@click="scrollPage(1)"
				>
					<AppIcon name="arrowRight" :size="18" />
				</button>
			</div>
		</div>
		<div
			ref="row"
			class="scroller"
			role="region"
			:aria-label="label"
			tabindex="0"
			@scroll.passive="updateEdges"
		>
			<slot />
		</div>
	</div>
</template>
