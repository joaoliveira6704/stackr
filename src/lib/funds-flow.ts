import { type Budget, monthlyCost, yearlyCost } from "./budget";
import { roundCents, sumMoney } from "./money";

/** Each group shows this many destinations, the rest fold into one. */
export const MAX_FLOW_ITEMS = 4;

export type FlowPeriod = "month" | "year";
export type FlowGroup = "needs" | "wants" | "savings" | "unassigned";
export type FlowColumn = 0 | 1 | 2;

export type FlowNodeKind =
	| { kind: "salary" }
	| { kind: "shortfall" }
	| { kind: "group"; group: FlowGroup }
	| { kind: "item"; group: FlowGroup; name: string }
	| { kind: "others"; group: FlowGroup; count: number };

export type FlowNode = FlowNodeKind & {
	id: string;
	column: FlowColumn;
	amount: number;
};

export interface FlowLink {
	from: string;
	to: string;
	amount: number;
	/** The group whose colour the ribbon takes. */
	group: FlowGroup;
}

export interface FundsFlow {
	nodes: FlowNode[];
	links: FlowLink[];
}

export interface FlowItem {
	id: string;
	name: string;
	amount: number;
}

const PLANNED_GROUPS = ["needs", "wants", "savings"] as const;
type PlannedGroup = (typeof PLANNED_GROUPS)[number];
const MONTHS_PER_YEAR = 12;

function amountInPeriod(monthly: number, period: FlowPeriod): number {
	return roundCents(period === "year" ? monthly * MONTHS_PER_YEAR : monthly);
}

function itemNodes(group: FlowGroup, items: FlowItem[]): FlowNode[] {
	const sorted = items
		.filter((item) => item.amount > 0)
		.sort((a, b) => b.amount - a.amount);
	const own = sorted.slice(0, MAX_FLOW_ITEMS);
	const rest = sorted.slice(MAX_FLOW_ITEMS);
	const nodes: FlowNode[] = own.map((item) => ({
		id: `item:${group}:${item.id}`,
		column: 2,
		kind: "item",
		group,
		name: item.name,
		amount: roundCents(item.amount),
	}));
	if (rest.length) {
		nodes.push({
			id: `others:${group}`,
			column: 2,
			kind: "others",
			group,
			count: rest.length,
			amount: sumMoney(rest.map((item) => item.amount)),
		});
	}
	return nodes;
}

function categoryItems(
	budget: Budget,
	group: FlowGroup,
	month: string,
	period: FlowPeriod,
): FlowItem[] {
	return budget.categories
		.filter((category) => category.group === group)
		.map((category) => ({
			id: category.id,
			name: category.name,
			amount:
				period === "year"
					? yearlyCost(category, month.slice(0, 4))
					: monthlyCost(category, month),
		}));
}

// The salary pays for the groups in order, so when the plan asks for more
// than it covers, the last groups are the ones drawn as money that is missing.
function sourceLinks(salary: number, groups: FlowNode[]): FlowLink[] {
	let salaryLeft = salary;
	return groups.flatMap((node) => {
		if (node.kind !== "group") return [];
		const fromSalary = Math.min(salaryLeft, node.amount);
		const missing = roundCents(node.amount - fromSalary);
		salaryLeft = roundCents(salaryLeft - fromSalary);
		const links: FlowLink[] = [];
		if (fromSalary > 0) {
			links.push({
				from: "salary",
				to: node.id,
				amount: fromSalary,
				group: node.group,
			});
		}
		if (missing > 0) {
			links.push({
				from: "shortfall",
				to: node.id,
				amount: missing,
				group: node.group,
			});
		}
		return links;
	});
}

/**
 * Where the money of the month or of the calendar year goes: from the salary,
 * through needs, wants and savings, to each bill and each registered saving.
 * Registered savings are what was really added during that same period.
 */
export function buildFundsFlow(
	budget: Budget,
	month: string,
	registeredSavings: FlowItem[],
	period: FlowPeriod = "month",
): FundsFlow {
	const itemsOf = (group: PlannedGroup) => [
		...categoryItems(budget, group, month, period),
		...(group === "savings" ? registeredSavings : []),
	];
	const planned = Object.fromEntries(
		PLANNED_GROUPS.map((group) => [
			group,
			sumMoney(itemsOf(group).map((item) => item.amount)),
		]),
	) as Record<PlannedGroup, number>;
	const salary = amountInPeriod(budget.salary, period);
	const unassigned = roundCents(salary - sumMoney(Object.values(planned)));
	const groups: FlowNode[] = PLANNED_GROUPS.filter(
		(group) => planned[group] > 0,
	).map((group) => ({
		id: `group:${group}`,
		column: 1,
		kind: "group",
		group,
		amount: planned[group],
	}));
	if (unassigned > 0) {
		groups.push({
			id: "group:unassigned",
			column: 1,
			kind: "group",
			group: "unassigned",
			amount: unassigned,
		});
	}
	if (!groups.length) return { nodes: [], links: [] };

	const sources: FlowNode[] = [];
	if (salary > 0) {
		sources.push({
			id: "salary",
			column: 0,
			kind: "salary",
			amount: salary,
		});
	}
	if (unassigned < 0) {
		sources.push({
			id: "shortfall",
			column: 0,
			kind: "shortfall",
			amount: -unassigned,
		});
	}
	const items = groups.flatMap((node) =>
		node.kind === "group" && node.group !== "unassigned"
			? itemNodes(node.group, itemsOf(node.group))
			: [],
	);
	const itemLinks: FlowLink[] = items.flatMap((node) =>
		node.kind === "item" || node.kind === "others"
			? [
					{
						from: `group:${node.group}`,
						to: node.id,
						amount: node.amount,
						group: node.group,
					},
				]
			: [],
	);
	return {
		nodes: [...sources, ...groups, ...items],
		links: [...sourceLinks(salary, groups), ...itemLinks],
	};
}

export interface FlowLayoutOptions {
	width: number;
	height: number;
	nodeWidth: number;
	nodeGap: number;
	/** Room kept on the right for the labels of the last column. */
	labelSpace: number;
}

export interface PlacedNode {
	node: FlowNode;
	x: number;
	y: number;
	height: number;
}

export interface PlacedLink {
	link: FlowLink;
	path: string;
}

export interface FlowLayout {
	nodes: PlacedNode[];
	links: PlacedLink[];
}

// Tiny amounts stay visible and can still be hovered.
const MIN_THICKNESS = 2;

function ribbonPath(
	startX: number,
	startY: number,
	endX: number,
	endY: number,
	thickness: number,
): string {
	const middle = (startX + endX) / 2;
	const top = `M${startX},${startY} C${middle},${startY} ${middle},${endY} ${endX},${endY}`;
	const bottom = `L${endX},${endY + thickness} C${middle},${endY + thickness} ${middle},${startY + thickness} ${startX},${startY + thickness} Z`;
	return `${top} ${bottom}`;
}

function flowScale(flow: FundsFlow, options: FlowLayoutOptions): number {
	const scales = ([0, 1, 2] as const).flatMap((column) => {
		const nodes = flow.nodes.filter((node) => node.column === column);
		const total = nodes.reduce((sum, node) => sum + node.amount, 0);
		if (total <= 0) return [];
		const room =
			options.height -
			options.nodeGap * (nodes.length - 1) -
			MIN_THICKNESS * nodes.length;
		return [Math.max(room, 1) / total];
	});
	return Math.min(...scales);
}

/** Works out where each block and ribbon of the chart is drawn. */
export function layoutFundsFlow(
	flow: FundsFlow,
	options: FlowLayoutOptions,
): FlowLayout {
	if (!flow.nodes.length) return { nodes: [], links: [] };
	const scale = flowScale(flow, options);
	const thickness = (amount: number) => Math.max(amount * scale, MIN_THICKNESS);
	const usable = options.width - options.labelSpace - options.nodeWidth;
	const placed = new Map<string, PlacedNode>();
	for (const column of [0, 1, 2] as const) {
		let y = 0;
		for (const node of flow.nodes.filter((entry) => entry.column === column)) {
			const height = thickness(node.amount);
			placed.set(node.id, { node, x: (usable * column) / 2, y, height });
			y += height + options.nodeGap;
		}
	}
	const outOffset = new Map<string, number>();
	const inOffset = new Map<string, number>();
	const links = flow.links.flatMap((link) => {
		const from = placed.get(link.from);
		const to = placed.get(link.to);
		if (!from || !to) return [];
		const startOffset = outOffset.get(link.from) ?? 0;
		const endOffset = inOffset.get(link.to) ?? 0;
		const size = thickness(link.amount);
		outOffset.set(link.from, startOffset + size);
		inOffset.set(link.to, endOffset + size);
		return [
			{
				link,
				path: ribbonPath(
					from.x + options.nodeWidth,
					from.y + startOffset,
					to.x,
					to.y + endOffset,
					size,
				),
			},
		];
	});
	return { nodes: [...placed.values()], links };
}
