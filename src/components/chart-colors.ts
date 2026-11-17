// Chart series colours, in the fixed order validated for colour blind
// readers. Class names are written out in full so Tailwind finds them. Never
// cycle them: a fifth series folds into "Outros" with OTHER_SERIES.
export const SERIES = [
	{ stroke: "stroke-chart-1", fill: "fill-chart-1", swatch: "bg-chart-1" },
	{ stroke: "stroke-chart-2", fill: "fill-chart-2", swatch: "bg-chart-2" },
	{ stroke: "stroke-chart-3", fill: "fill-chart-3", swatch: "bg-chart-3" },
	{ stroke: "stroke-chart-4", fill: "fill-chart-4", swatch: "bg-chart-4" },
] as const;

export const OTHER_SERIES = {
	stroke: "stroke-ink-faint",
	fill: "fill-ink-faint",
	swatch: "bg-ink-faint",
} as const;

export type SeriesColor = (typeof SERIES)[number] | typeof OTHER_SERIES;

export function seriesColor(index: number): SeriesColor {
	return SERIES[index] ?? OTHER_SERIES;
}
