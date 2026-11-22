import { describe, expect, it } from "vitest";
import type { Budget, BudgetCategory } from "./budget";
import {
	buildFundsFlow,
	type FlowItem,
	type FlowPeriod,
	layoutFundsFlow,
	MAX_FLOW_ITEMS,
} from "./funds-flow";

const MONTH = "2026-11";

function bill(
	id: string,
	group: BudgetCategory["group"],
	planned: number,
): BudgetCategory {
	return {
		id,
		name: id,
		description: "",
		group,
		planned,
		recurrence: "monthly",
		dueDate: "2026-11-30",
	};
}

function flowFor(
	salary: number,
	categories: BudgetCategory[],
	saved: FlowItem[] = [],
	period: FlowPeriod = "month",
) {
	const budget: Budget = { salary, categories, expenses: [] };
	return buildFundsFlow(budget, MONTH, saved, period);
}

function amountOf(flow: ReturnType<typeof flowFor>, from: string, to: string) {
	return flow.links.find((link) => link.from === from && link.to === to)
		?.amount;
}

describe("buildFundsFlow", () => {
	it("is empty without a salary or any plan", () => {
		expect(flowFor(0, [])).toEqual({ nodes: [], links: [] });
	});

	it("sends the salary through each group to its bills", () => {
		const flow = flowFor(1000, [
			bill("rent", "needs", 500),
			bill("fun", "wants", 200),
		]);

		expect(amountOf(flow, "salary", "group:needs")).toBe(500);
		expect(amountOf(flow, "group:needs", "item:needs:rent")).toBe(500);
		expect(amountOf(flow, "salary", "group:wants")).toBe(200);
	});

	it("shows the salary left over as unassigned", () => {
		const flow = flowFor(1000, [bill("rent", "needs", 600)]);

		expect(amountOf(flow, "salary", "group:unassigned")).toBe(400);
	});

	it("counts registered savings as a destination of the savings group", () => {
		const flow = flowFor(1000, [], [{ id: "ppr", name: "PPR", amount: 150 }]);

		expect(amountOf(flow, "salary", "group:savings")).toBe(150);
		expect(amountOf(flow, "group:savings", "item:savings:ppr")).toBe(150);
	});

	it("draws what the salary cannot cover as missing money", () => {
		const flow = flowFor(100, [
			bill("rent", "needs", 80),
			bill("fun", "wants", 50),
		]);

		expect(amountOf(flow, "salary", "group:wants")).toBe(20);
		expect(amountOf(flow, "shortfall", "group:wants")).toBe(30);
		expect(flow.nodes.find((node) => node.id === "shortfall")?.amount).toBe(30);
	});

	it("handles a plan with no salary at all as fully missing", () => {
		const flow = flowFor(0, [bill("rent", "needs", 80)]);

		expect(flow.nodes.some((node) => node.id === "salary")).toBe(false);
		expect(amountOf(flow, "shortfall", "group:needs")).toBe(80);
	});

	it("folds the smallest destinations into one", () => {
		const bills = [10, 20, 30, 40, 50, 60].map((planned) =>
			bill(`bill${planned}`, "needs", planned),
		);
		const flow = flowFor(1000, bills);
		const items = flow.nodes.filter((node) => node.column === 2);

		expect(items).toHaveLength(MAX_FLOW_ITEMS + 1);
		expect(items.at(-1)).toMatchObject({
			kind: "others",
			count: 2,
			amount: 30,
		});
	});

	it("leaves out a registered saving with nothing going in", () => {
		const flow = flowFor(1000, [], [{ id: "idle", name: "Idle", amount: 0 }]);

		expect(flow.nodes.some((node) => node.id.includes("idle"))).toBe(false);
	});

	it("rounds a quarterly bill to cents and keeps large salaries exact", () => {
		const quarterly = {
			...bill("tax", "needs", 100),
			recurrence: "quarterly" as const,
		};
		const flow = flowFor(10_000_000, [quarterly]);

		expect(amountOf(flow, "group:needs", "item:needs:tax")).toBe(33.33);
		expect(amountOf(flow, "salary", "group:unassigned")).toBe(9_999_966.67);
	});
});

describe("buildFundsFlow over the year", () => {
	it("multiplies the salary and a monthly bill by twelve", () => {
		const flow = flowFor(1000, [bill("rent", "needs", 500)], [], "year");

		expect(amountOf(flow, "salary", "group:needs")).toBe(6000);
		expect(amountOf(flow, "salary", "group:unassigned")).toBe(6000);
	});

	it("counts a yearly bill once instead of a twelfth of it", () => {
		const insurance = {
			...bill("insurance", "needs", 240),
			recurrence: "yearly" as const,
		};

		expect(
			amountOf(
				flowFor(1000, [insurance]),
				"group:needs",
				"item:needs:insurance",
			),
		).toBe(20);
		expect(
			amountOf(
				flowFor(1000, [insurance], [], "year"),
				"group:needs",
				"item:needs:insurance",
			),
		).toBe(240);
	});

	it("counts a one off bill due in another month of the year", () => {
		const trip = {
			...bill("trip", "wants", 300),
			recurrence: "once" as const,
			dueDate: "2026-03-10",
		};

		expect(amountOf(flowFor(1000, [trip]), "salary", "group:wants")).toBe(
			undefined,
		);
		expect(
			amountOf(flowFor(1000, [trip], [], "year"), "salary", "group:wants"),
		).toBe(300);
	});

	it("uses registered savings as given, without multiplying them", () => {
		const flow = flowFor(
			1000,
			[],
			[{ id: "ppr", name: "PPR", amount: 399.96 }],
			"year",
		);

		expect(amountOf(flow, "group:savings", "item:savings:ppr")).toBe(399.96);
	});

	it("shows the money missing over the whole year", () => {
		const flow = flowFor(100, [bill("rent", "needs", 150)], [], "year");

		expect(flow.nodes.find((node) => node.id === "shortfall")?.amount).toBe(
			600,
		);
	});
});

describe("layoutFundsFlow", () => {
	const options = {
		width: 800,
		height: 320,
		nodeWidth: 10,
		nodeGap: 18,
		labelSpace: 190,
	};

	it("draws nothing for an empty flow", () => {
		expect(layoutFundsFlow({ nodes: [], links: [] }, options)).toEqual({
			nodes: [],
			links: [],
		});
	});

	it("keeps every block inside the chart", () => {
		const bills = Array.from({ length: 12 }, (_, index) =>
			bill(`bill${index}`, index % 2 ? "needs" : "wants", 50 + index),
		);
		const layout = layoutFundsFlow(flowFor(2000, bills), options);

		for (const { y, height } of layout.nodes) {
			expect(y + height).toBeLessThanOrEqual(options.height + 0.001);
		}
	});

	it("keeps a tiny amount visible", () => {
		const flow = flowFor(100_000, [bill("coffee", "wants", 1)]);
		const coffee = layoutFundsFlow(flow, options).nodes.find(
			({ node }) => node.id === "item:wants:coffee",
		);

		expect(coffee?.height).toBeGreaterThanOrEqual(2);
	});

	it("draws one ribbon for each link", () => {
		const flow = flowFor(1000, [bill("rent", "needs", 500)]);

		expect(layoutFundsFlow(flow, options).links).toHaveLength(
			flow.links.length,
		);
	});
});
