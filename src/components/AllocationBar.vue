<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { SERIES, type SeriesColor, seriesColor } from "./chart-colors";

export interface AllocationItem {
	id: string;
	name: string;
	amount: number;
}

const props = defineProps<{ items: AllocationItem[] }>();
const { t, n } = useI18n();

const OTHERS_ID = "others";

interface Segment extends AllocationItem {
	share: number;
	color: SeriesColor;
}

// Only the first four holdings get their own colour, the rest share one
// "Outros" segment so the colours stay easy to tell apart.
const segments = computed<Segment[]>(() => {
	const total = props.items.reduce((sum, item) => sum + item.amount, 0);
	if (total <= 0) return [];
	const own = props.items.slice(0, SERIES.length);
	const rest = props.items.slice(SERIES.length);
	const grouped = rest.length
		? [
				...own,
				{
					id: OTHERS_ID,
					name: t("simulator.allocation.others", { count: rest.length }),
					amount: rest.reduce((sum, item) => sum + item.amount, 0),
				},
			]
		: own;
	// Colours are given before empty holdings are dropped, so a colour always
	// follows its holding and matches the rest of the screen.
	return grouped
		.map((item, index) => ({
			...item,
			share: item.amount / total,
			color: item.id === OTHERS_ID ? seriesColor(SERIES.length) : seriesColor(index),
		}))
		.filter((item) => item.amount > 0);
});

const activeId = ref<string | null>(null);
</script>

<template>
	<div class="flex flex-col gap-5">
		<p v-if="!segments.length" class="text-sm text-ink-muted">
			{{ t("simulator.allocation.empty") }}
		</p>
		<template v-else>
			<div aria-hidden="true" class="flex h-10 w-full gap-0.5 overflow-hidden rounded-field">
				<span
					v-for="segment in segments"
					:key="segment.id"
					class="h-full transition-opacity duration-150"
					:class="[
						segment.color.swatch,
						activeId && activeId !== segment.id ? 'opacity-30' : '',
					]"
					:style="{ width: `${segment.share * 100}%` }"
					@pointerenter="activeId = segment.id"
					@pointerleave="activeId = null"
				/>
			</div>

			<ul class="flex flex-col gap-1">
				<li
					v-for="segment in segments"
					:key="segment.id"
					class="-mx-2 flex items-center gap-3 rounded-tile px-2 py-1.5 transition-colors duration-150"
					:class="activeId === segment.id ? 'bg-glass-strong' : ''"
					@pointerenter="activeId = segment.id"
					@pointerleave="activeId = null"
				>
					<span aria-hidden="true" class="size-3 shrink-0 rounded-full" :class="segment.color.swatch" />
					<span class="min-w-0 flex-1 truncate font-semibold">{{ segment.name }}</span>
					<span class="text-sm text-ink-muted tabular-nums">{{ n(segment.share, "percent") }}</span>
					<span class="shrink-0 text-right font-semibold whitespace-nowrap tabular-nums">{{ n(segment.amount, "currency") }}</span>
				</li>
			</ul>
		</template>
	</div>
</template>
