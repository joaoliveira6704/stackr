<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { YearReturn } from "../lib/market";

const props = defineProps<{ returns: YearReturn[] }>();
const { t, n } = useI18n();

const PLOT_HEIGHT = 96;

// The zero line sits where the range needs it: at the bottom when every year
// went up, at the top when every year went down, in between otherwise. So
// the columns always use the whole height.
const scale = computed(() => {
	const percents = props.returns.map((entry) => entry.percent);
	const highest = Math.max(0, ...percents);
	const lowest = Math.min(0, ...percents);
	const span = highest - lowest || 1;
	return { span, zeroTop: (highest / span) * PLOT_HEIGHT };
});

interface Column extends YearReturn {
	top: number;
	height: number;
	gain: boolean;
	shortYear: string;
}

const columns = computed<Column[]>(() =>
	props.returns.map((entry) => {
		const height = (Math.abs(entry.percent) / scale.value.span) * PLOT_HEIGHT;
		const gain = entry.percent >= 0;
		return {
			...entry,
			gain,
			height,
			top: gain ? scale.value.zeroTop - height : scale.value.zeroTop,
			shortYear: String(entry.year).slice(-2),
		};
	}),
);

function entryLabel(entry: YearReturn): string {
	return t("simulator.holding.yearlyEntry", {
		year: entry.year,
		change: n(entry.percent / 100, "signedPercent"),
	});
}
</script>

<template>
	<figure class="flex flex-col gap-2">
		<figcaption class="text-xs font-semibold text-ink-muted">
			{{ t("simulator.holding.yearlyTitle") }}
		</figcaption>
		<ul class="mt-7 flex gap-1">
			<li
				v-for="column in columns"
				:key="column.year"
				class="group flex min-w-0 flex-1 flex-col items-center gap-1.5"
			>
				<span class="sr-only">{{ entryLabel(column) }}</span>
				<span
					aria-hidden="true"
					class="relative block w-full"
					:style="{ height: `${PLOT_HEIGHT}px` }"
				>
					<span
						class="absolute inset-x-0 h-px bg-line-strong"
						:style="{ top: `${scale.zeroTop}px` }"
					/>
					<span
						class="absolute left-1/2 w-full max-w-6 -translate-x-1/2 transition-opacity duration-150 group-hover:opacity-80"
						:class="column.gain ? 'rounded-t bg-chart-1' : 'rounded-b bg-chart-4'"
						:style="{ top: `${column.top}px`, height: `${Math.max(column.height, 1)}px` }"
					/>
					<span
						class="pointer-events-none absolute -top-7 left-1/2 z-10 hidden -translate-x-1/2 rounded-full bg-ink px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-surface tabular-nums group-hover:block"
					>
						{{ entryLabel(column) }}
					</span>
				</span>
				<span aria-hidden="true" class="text-xs text-ink-muted tabular-nums">
					{{ column.shortYear }}
				</span>
			</li>
		</ul>
	</figure>
</template>
