<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from "vue";
import { useI18n } from "vue-i18n";
import { niceTicks, yearTicks } from "../lib/chart-scale";
import type { YearPoint } from "../lib/projection";
import { useElementWidth } from "../lib/use-element-width";
import { SERIES } from "./chart-colors";

const props = defineProps<{ timeline: YearPoint[] }>();
const { t, n } = useI18n();

type SeriesKey = "value" | "invested" | "realValue";
const LINES: { key: SeriesKey; color: (typeof SERIES)[number] }[] = [
	{ key: "value", color: SERIES[0] },
	{ key: "invested", color: SERIES[1] },
	{ key: "realValue", color: SERIES[2] },
];

const HEIGHT = 280;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 28;
const FALLBACK_WIDTH = 640;
// Below this width there is no room for the values at the end of the lines,
// so the legend and the tooltip carry them instead.
const END_LABELS_MIN_WIDTH = 480;
const END_LABEL_GAP = 16;
// Room for compact euro labels such as "108,7 mil €" on the axis and at the
// end of the lines.
const AXIS_LABEL_SPACE = 68;
const END_LABEL_SPACE = 92;
const FALLBACK_TOOLTIP_WIDTH = 240;

const container = useTemplateRef<HTMLDivElement>("container");
const width = useElementWidth(container, FALLBACK_WIDTH);
const activeIndex = ref<number | null>(null);

const showEndLabels = computed(() => width.value >= END_LABELS_MIN_WIDTH);
const padding = computed(() => ({
	top: PADDING_TOP,
	right: showEndLabels.value ? END_LABEL_SPACE : 16,
	bottom: PADDING_BOTTOM,
	left: AXIS_LABEL_SPACE,
}));
const lastYear = computed(() => props.timeline.at(-1)?.year ?? 0);
const plotWidth = computed(
	() => width.value - padding.value.left - padding.value.right,
);
const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;

const valueTicks = computed(() =>
	niceTicks(
		Math.max(
			...props.timeline.flatMap((point) => [point.value, point.invested]),
		),
	),
);
const maxTick = computed(() => valueTicks.value.at(-1) ?? 1);

function x(year: number): number {
	const share = lastYear.value > 0 ? year / lastYear.value : 0;
	return padding.value.left + share * plotWidth.value;
}

function y(value: number): number {
	return padding.value.top + (1 - value / maxTick.value) * plotHeight;
}

function linePath(key: SeriesKey): string {
	return props.timeline
		.map((point, index) => `${index ? "L" : "M"}${x(point.year)},${y(point[key])}`)
		.join(" ");
}

// The end labels are pushed apart so close values never overlap.
const endLabels = computed(() => {
	const last = props.timeline.at(-1);
	if (!last) return [];
	const labels = LINES.map((line) => ({ ...line, top: y(last[line.key]) })).sort(
		(a, b) => a.top - b.top,
	);
	for (let index = 1; index < labels.length; index++) {
		const previous = labels[index - 1].top;
		labels[index].top = Math.max(labels[index].top, previous + END_LABEL_GAP);
	}
	return labels.map((label) => ({ ...label, value: last[label.key] }));
});

const activePoint = computed(() =>
	activeIndex.value === null ? null : props.timeline[activeIndex.value],
);

// The dots follow the hovered year and rest on the last one otherwise.
const markerPoint = computed(() => activePoint.value ?? props.timeline.at(-1));

// The tooltip is as wide as its longest line, so it is measured once shown
// and kept inside the chart.
const tooltip = useTemplateRef<HTMLDivElement>("tooltip");
const tooltipWidth = ref(FALLBACK_TOOLTIP_WIDTH);
watch(activeIndex, async () => {
	await nextTick();
	tooltipWidth.value = tooltip.value?.offsetWidth || FALLBACK_TOOLTIP_WIDTH;
});

const tooltipLeft = computed(() => {
	if (!activePoint.value) return 0;
	const tooltipHalf = Math.min(tooltipWidth.value, width.value) / 2;
	return Math.min(
		Math.max(x(activePoint.value.year), tooltipHalf),
		width.value - tooltipHalf,
	);
});

function pointAt(event: PointerEvent) {
	const bounds = (event.currentTarget as SVGElement).getBoundingClientRect();
	const share = (event.clientX - bounds.left - padding.value.left) / plotWidth.value;
	const index = Math.round(share * (props.timeline.length - 1));
	activeIndex.value = Math.min(Math.max(index, 0), props.timeline.length - 1);
}

function moveWithKeys(event: KeyboardEvent) {
	const last = props.timeline.length - 1;
	const current = activeIndex.value ?? last;
	const moves: Record<string, number> = {
		ArrowLeft: Math.max(current - 1, 0),
		ArrowRight: Math.min(current + 1, last),
		Home: 0,
		End: last,
	};
	if (!(event.key in moves)) return;
	event.preventDefault();
	activeIndex.value = moves[event.key];
}

function money(value: number): string {
	return n(value, "currency");
}
</script>

<template>
	<div class="flex flex-col gap-4">
		<ul class="flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-muted">
			<li v-for="line in LINES" :key="line.key" class="flex items-center gap-2">
				<span aria-hidden="true" class="h-0.5 w-4 rounded-full" :class="line.color.swatch" />
				{{ t(`simulator.chart.${line.key}`) }}
			</li>
		</ul>

		<div
			ref="container"
			class="relative rounded-field outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
			tabindex="0"
			role="group"
			:aria-label="t('simulator.chart.label')"
			:aria-describedby="activePoint ? undefined : 'growth-chart-hint'"
			@keydown="moveWithKeys"
			@focus="activeIndex = activeIndex ?? timeline.length - 1"
			@blur="activeIndex = null"
		>
			<p id="growth-chart-hint" class="sr-only">{{ t("simulator.chart.hint") }}</p>
			<svg
				:width="width"
				:height="HEIGHT"
				:viewBox="`0 0 ${width} ${HEIGHT}`"
				class="block w-full touch-pan-y overflow-visible"
				aria-hidden="true"
				@pointermove="pointAt"
				@pointerdown="pointAt"
				@pointerleave="activeIndex = null"
			>
				<g class="text-xs">
					<g v-for="tick in valueTicks" :key="`y${tick}`">
						<line
							:x1="padding.left"
							:x2="width - padding.right"
							:y1="y(tick)"
							:y2="y(tick)"
							class="stroke-line"
							stroke-width="1"
						/>
						<text
							:x="padding.left - 8"
							:y="y(tick)"
							text-anchor="end"
							dominant-baseline="middle"
							class="fill-ink-muted tabular-nums"
						>
							{{ n(tick, "compactCurrency") }}
						</text>
					</g>
					<text
						v-for="year in yearTicks(lastYear)"
						:key="`x${year}`"
						:x="x(year)"
						:y="HEIGHT - 8"
						text-anchor="middle"
						class="fill-ink-muted tabular-nums"
					>
						{{ t("simulator.chart.yearTick", { year }) }}
					</text>
				</g>

				<line
					v-if="activePoint"
					:x1="x(activePoint.year)"
					:x2="x(activePoint.year)"
					:y1="padding.top"
					:y2="HEIGHT - padding.bottom"
					class="stroke-line-strong"
					stroke-width="1"
				/>

				<path
					v-for="line in LINES"
					:key="line.key"
					:d="linePath(line.key)"
					fill="none"
					stroke-width="2"
					stroke-linejoin="round"
					stroke-linecap="round"
					:class="line.color.stroke"
				/>

				<g v-if="markerPoint">
					<circle
						v-for="line in LINES"
						:key="`dot-${line.key}`"
						:cx="x(markerPoint.year)"
						:cy="y(markerPoint[line.key])"
						r="4"
						stroke-width="2"
						class="stroke-surface"
						:class="line.color.fill"
					/>
				</g>

				<g v-if="showEndLabels" class="text-xs font-semibold">
					<text
						v-for="label in endLabels"
						:key="`end-${label.key}`"
						:x="width - padding.right + 10"
						:y="label.top"
						dominant-baseline="middle"
						class="fill-ink tabular-nums"
					>
						{{ n(label.value, "compactCurrency") }}
					</text>
				</g>
			</svg>

			<div
				v-if="activePoint"
				ref="tooltip"
				class="popover pointer-events-none absolute top-0 w-max max-w-full -translate-x-1/2 px-4 py-3 text-sm whitespace-nowrap"
				:style="{ left: `${tooltipLeft}px` }"
				aria-live="polite"
			>
				<p class="mb-1.5 font-bold">
					{{ t("simulator.chart.yearLabel", { year: activePoint.year }) }}
				</p>
				<p
					v-for="line in LINES"
					:key="`tip-${line.key}`"
					class="flex items-center gap-2"
				>
					<span aria-hidden="true" class="size-2 shrink-0 rounded-full" :class="line.color.swatch" />
					<span class="flex-1 text-ink-muted">{{ t(`simulator.chart.${line.key}`) }}</span>
					<span class="font-semibold tabular-nums">{{ money(activePoint[line.key]) }}</span>
				</p>
			</div>
		</div>
	</div>
</template>
