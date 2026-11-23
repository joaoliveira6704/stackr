<script setup lang="ts">
import { computed, ref, useId, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";
import {
	type FlowGroup,
	type FlowLink,
	type FlowNode,
	type FundsFlow,
	layoutFundsFlow,
} from "../lib/funds-flow";
import { useElementWidth } from "../lib/use-element-width";
import AppIcon from "./AppIcon.vue";
import { SERIES, type SeriesColor } from "./chart-colors";

const props = defineProps<{ flow: FundsFlow }>();
const { t, n } = useI18n();

const FALLBACK_WIDTH = 640;
const MIN_HEIGHT = 320;
const HEIGHT_PER_ROW = 34;
const NODE_WIDTH = 10;
const NODE_GAP = 18;
const NODE_LABEL_GAP = 6;
// Below this width only the names fit next to the blocks, and the tooltip and
// the table carry the amounts.
const AMOUNTS_MIN_WIDTH = 560;
const WIDE_LABEL_SPACE = 190;
const NARROW_LABEL_SPACE = 96;
const WIDE_NAME_LENGTH = 16;
const NARROW_NAME_LENGTH = 11;

const GROUP_COLORS: Record<FlowGroup, SeriesColor> = {
	needs: SERIES[0],
	wants: SERIES[1],
	savings: SERIES[2],
	unassigned: SERIES[3],
};
const LEGEND: FlowGroup[] = ["needs", "wants", "savings", "unassigned"];

const container = useTemplateRef<HTMLDivElement>("container");
const width = useElementWidth(container, FALLBACK_WIDTH);
const activeIndex = ref<number | null>(null);
const showTable = ref(false);
const tableId = useId();
const hintId = useId();

const showAmounts = computed(() => width.value >= AMOUNTS_MIN_WIDTH);
const height = computed(() => {
	const rows = props.flow.nodes.filter((node) => node.column === 2).length;
	return Math.max(MIN_HEIGHT, rows * HEIGHT_PER_ROW);
});
const layout = computed(() =>
	layoutFundsFlow(props.flow, {
		width: width.value,
		height: height.value,
		nodeWidth: NODE_WIDTH,
		nodeGap: NODE_GAP,
		labelSpace: showAmounts.value ? WIDE_LABEL_SPACE : NARROW_LABEL_SPACE,
	}),
);
const activeLink = computed(() =>
	activeIndex.value === null ? null : (props.flow.links[activeIndex.value] ?? null),
);

function nodeById(id: string): FlowNode | undefined {
	return props.flow.nodes.find((node) => node.id === id);
}

function nodeName(node: FlowNode | undefined): string {
	if (!node) return "";
	if (node.kind === "salary") return t("budget.flow.salary");
	if (node.kind === "shortfall") return t("budget.flow.shortfall");
	if (node.kind === "item") return node.name;
	if (node.kind === "others") return t("budget.flow.others", { count: node.count });
	return groupName(node.group);
}

function groupName(group: FlowGroup): string {
	return group === "unassigned"
		? t("budget.salary.unassigned")
		: t(`budget.groups.${group}`);
}

function nodeFill(node: FlowNode): string {
	if (node.kind === "salary") return "fill-ink-muted";
	if (node.kind === "shortfall") return "fill-cherry";
	return GROUP_COLORS[node.group].fill;
}

function shortName(node: FlowNode): string {
	const name = nodeName(node);
	const limit = showAmounts.value ? WIDE_NAME_LENGTH : NARROW_NAME_LENGTH;
	return name.length > limit ? `${name.slice(0, limit - 1)}…` : name;
}

function linkLabel(link: FlowLink): string {
	return t("budget.flow.link", {
		from: nodeName(nodeById(link.from)),
		to: nodeName(nodeById(link.to)),
		amount: n(link.amount, "currency"),
	});
}

function moveWithKeys(event: KeyboardEvent) {
	const last = props.flow.links.length - 1;
	const current = activeIndex.value ?? 0;
	const moves: Record<string, number> = {
		ArrowLeft: Math.max(current - 1, 0),
		ArrowUp: Math.max(current - 1, 0),
		ArrowRight: Math.min(current + 1, last),
		ArrowDown: Math.min(current + 1, last),
		Home: 0,
		End: last,
	};
	if (!(event.key in moves)) return;
	event.preventDefault();
	activeIndex.value = moves[event.key];
}
</script>

<template>
	<div class="flex flex-col gap-4">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<ul class="flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-muted">
				<li v-for="group in LEGEND" :key="group" class="flex items-center gap-2">
					<span aria-hidden="true" class="size-2.5 rounded-full" :class="GROUP_COLORS[group].swatch" />
					{{ groupName(group) }}
				</li>
			</ul>
			<button
				type="button"
				class="btn-ghost btn-sm"
				:aria-expanded="showTable"
				:aria-controls="tableId"
				@click="showTable = !showTable"
			>
				<AppIcon name="table" :size="16" />
				{{ showTable ? t("simulator.chart.hideTable") : t("simulator.chart.showTable") }}
			</button>
		</div>

		<div
			ref="container"
			class="relative rounded-field outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
			tabindex="0"
			role="group"
			:aria-label="t('budget.flow.label')"
			:aria-describedby="hintId"
			@keydown="moveWithKeys"
			@focus="activeIndex = activeIndex ?? 0"
			@blur="activeIndex = null"
		>
			<p :id="hintId" class="sr-only">{{ t("budget.flow.hint") }}</p>
			<svg
				:width="width"
				:height="height"
				:viewBox="`0 0 ${width} ${height}`"
				class="block w-full touch-pan-y overflow-visible"
				aria-hidden="true"
				@pointerleave="activeIndex = null"
			>
				<path
					v-for="(placed, index) in layout.links"
					:key="`${placed.link.from}-${placed.link.to}`"
					:d="placed.path"
					class="transition-opacity duration-150"
					:class="[
						GROUP_COLORS[placed.link.group].fill,
						activeIndex === index ? 'opacity-70' : activeIndex === null ? 'opacity-35' : 'opacity-15',
					]"
					@pointerenter="activeIndex = index"
					@pointerdown="activeIndex = index"
				/>
				<g v-for="placed in layout.nodes" :key="placed.node.id">
					<rect
						:x="placed.x"
						:y="placed.y"
						:width="NODE_WIDTH"
						:height="placed.height"
						rx="3"
						:class="nodeFill(placed.node)"
					/>
					<text
						:x="placed.x + NODE_WIDTH + NODE_LABEL_GAP"
						:y="placed.y + placed.height / 2"
						dominant-baseline="middle"
						class="fill-ink text-xs font-semibold"
					>
						{{ shortName(placed.node) }}
						<tspan v-if="showAmounts" class="fill-ink-muted font-normal tabular-nums">
							{{ n(placed.node.amount, "compactCurrency") }}
						</tspan>
					</text>
				</g>
			</svg>

			<div
				v-if="activeLink"
				class="popover pointer-events-none absolute top-0 left-1/2 w-max max-w-full -translate-x-1/2 px-4 py-3 text-sm font-semibold tabular-nums"
				aria-live="polite"
			>
				{{ linkLabel(activeLink) }}
			</div>
		</div>

		<div v-if="showTable" :id="tableId" class="max-h-80 overflow-auto rounded-field border border-line">
			<table class="w-full text-sm">
				<caption class="sr-only">{{ t("budget.flow.title") }}</caption>
				<thead class="sticky top-0 bg-surface text-ink-muted">
					<tr>
						<th scope="col" class="px-4 py-2 text-left font-semibold">{{ t("budget.flow.from") }}</th>
						<th scope="col" class="px-4 py-2 text-left font-semibold">{{ t("budget.flow.to") }}</th>
						<th scope="col" class="px-4 py-2 text-right font-semibold">{{ t("budget.flow.amount") }}</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-line">
					<tr v-for="link in flow.links" :key="`${link.from}-${link.to}`">
						<td class="px-4 py-2">{{ nodeName(nodeById(link.from)) }}</td>
						<td class="px-4 py-2">
							<span class="flex items-center gap-2">
								<span aria-hidden="true" class="size-2.5 shrink-0 rounded-full" :class="GROUP_COLORS[link.group].swatch" />
								{{ nodeName(nodeById(link.to)) }}
								<span class="sr-only">({{ groupName(link.group) }})</span>
							</span>
						</td>
						<td class="px-4 py-2 text-right tabular-nums">{{ n(link.amount, "currency") }}</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
</template>
