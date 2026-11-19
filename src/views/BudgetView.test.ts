import { flushPromises, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";
import { RouterView } from "vue-router";
import { dateKey } from "../lib/budget";
import {
	demoUser,
	fakeAppApi,
	jsonResponse,
	storeSessionFor,
} from "../test/fake-api";
import { answerConfirmDialog, mountAt } from "../test/mount";
import BudgetView from "./BudgetView.vue";

const today = dateKey(new Date());

const savedBudget = {
	salary: 1500,
	categories: [
		{ id: "home", name: "Home", group: "needs", planned: 600 },
		{ id: "fun", name: "Fun", group: "wants", planned: 200 },
	],
	expenses: [
		{
			id: "e1",
			categoryId: "home",
			amount: 50,
			description: "Rent",
			date: today,
		},
	],
};

beforeEach(() => {
	storeSessionFor(demoUser);
});

afterEach(() => {
	localStorage.clear();
	vi.unstubAllGlobals();
});

// Leave guards only run for a page rendered by RouterView, as it is in App.vue.
const RoutedPage = defineComponent({ render: () => h(RouterView) });

async function mountBudget(locale: "en" | "pt-PT" = "en", routed = false) {
	const mounted = await mountAt(
		"/budget",
		routed ? RoutedPage : BudgetView,
		locale,
	);
	await flushPromises();
	return mounted;
}

function buttonWithText(wrapper: VueWrapper, text: string) {
	const button = wrapper
		.findAll("button")
		.find((candidate) => candidate.text().includes(text));
	if (!button) throw new Error(`No button with the text "${text}"`);
	return button;
}

async function click(wrapper: VueWrapper, text: string) {
	await buttonWithText(wrapper, text).trigger("click");
	await flushPromises();
}

async function pressLabelled(wrapper: VueWrapper, label: string) {
	await wrapper.get(`button[aria-label="${label}"]`).trigger("click");
	await flushPromises();
}

async function logExpense(
	wrapper: VueWrapper,
	amount: string,
	description = "",
) {
	const form = wrapper.get("form");
	await form.get('input[type="number"]').setValue(amount);
	await form.get('input[type="text"]').setValue(description);
	await form.trigger("submit");
	await flushPromises();
}

function categoryTitles(wrapper: VueWrapper) {
	return wrapper.findAll("article h3").map((title) => title.text());
}

describe("BudgetView", () => {
	it("invites a new user to add categories before logging expenses", async () => {
		fakeAppApi();
		const { wrapper } = await mountBudget();

		expect(wrapper.text()).toContain("You have no categories yet.");
		expect(wrapper.text()).toContain("Add a category first to log expenses.");
		expect(wrapper.text()).toContain(
			"Type in your salary to compare your plan",
		);
	});

	it("fills the budget with the suggested categories", async () => {
		fakeAppApi();
		const { wrapper } = await mountBudget();

		await click(wrapper, "Use suggested categories");

		expect(categoryTitles(wrapper)).toEqual([
			"Home",
			"Groceries",
			"Transport",
			"Fun",
			"Savings",
		]);
	});

	it("adds an empty category with a numbered name", async () => {
		fakeAppApi();
		const { wrapper } = await mountBudget();

		await click(wrapper, "Add category");

		expect(categoryTitles(wrapper)).toEqual(["Category 1"]);
	});

	it("turns the monthly plan into a yearly estimate", async () => {
		fakeAppApi({ budget: savedBudget });
		const { wrapper } = await mountBudget();

		expect(wrapper.text()).toContain("Yearly income€18,000.00");
		expect(wrapper.text()).toContain("Yearly spending€9,600.00");
		expect(wrapper.text()).toContain("Estimated savings€8,400.00");
	});

	it("shows a yearly shortfall when the plan costs more than the salary", async () => {
		fakeAppApi({ budget: { ...savedBudget, salary: 700 } });
		const { wrapper } = await mountBudget();

		expect(wrapper.text()).toContain("Estimated shortfall€1,200.00");
		expect(wrapper.text()).not.toContain("Estimated savings");
	});

	it("compares the plan with the 50/30/20 rule", async () => {
		fakeAppApi({
			budget: {
				...savedBudget,
				salary: 1000,
				categories: [
					{ id: "home", name: "Home", group: "needs", planned: 700 },
					{ id: "fun", name: "Fun", group: "wants", planned: 100 },
				],
			},
		});
		const { wrapper } = await mountBudget();

		expect(wrapper.text()).toContain(
			"NeedsAim for 50% or less · €700.0070%Above the aim",
		);
		expect(wrapper.text()).toContain(
			"WantsAim for 30% or less · €100.0010%On track",
		);
		expect(wrapper.text()).toContain(
			"SavingsAim for at least 20% · €200.0020%On track",
		);
	});

	it("explains an invalid salary instead of showing totals", async () => {
		fakeAppApi({ budget: savedBudget });
		const { wrapper } = await mountBudget();

		await wrapper.get('input[type="number"]').setValue("");

		expect(wrapper.text()).toContain(
			"Your salary must be a number of zero or more.",
		);
		expect(wrapper.text()).not.toContain("Yearly income");
	});

	it("logs an expense and counts it against its category", async () => {
		fakeAppApi({ budget: savedBudget });
		const { wrapper } = await mountBudget();

		await logExpense(wrapper, "25.5", "Groceries run");

		expect(wrapper.text()).toContain("Groceries run");
		expect(wrapper.text()).toContain("€75.50 of €600.00 this month");
		expect(wrapper.text()).toContain("Out of €800.00 planned€75.50");
	});

	it("explains an expense without an amount and logs nothing", async () => {
		fakeAppApi({ budget: savedBudget });
		const { wrapper } = await mountBudget();

		await logExpense(wrapper, "0");

		expect(wrapper.text()).toContain(
			"Type an amount above zero for the expense.",
		);
		expect(wrapper.text()).toContain("Out of €800.00 planned€50.00");
	});

	it("says when a category goes over its plan", async () => {
		fakeAppApi({ budget: savedBudget });
		const { wrapper } = await mountBudget();

		await logExpense(wrapper, "600", "Repairs");

		expect(wrapper.text()).toContain("€50.00 over the plan");
	});

	it("keeps an expense when the user cancels deleting it", async () => {
		fakeAppApi({ budget: savedBudget });
		const { wrapper } = await mountBudget();

		await pressLabelled(wrapper, "Delete Rent of €50.00");
		expect(wrapper.text()).toContain("Delete this expense?");
		expect(wrapper.text()).toContain(
			"Rent of €50.00 stops counting in your budget.",
		);

		await answerConfirmDialog(wrapper, "cancel");

		expect(wrapper.text()).toContain("Out of €800.00 planned€50.00");
	});

	it("deletes an expense only once confirmed", async () => {
		fakeAppApi({ budget: savedBudget });
		const { wrapper } = await mountBudget();

		await pressLabelled(wrapper, "Delete Rent of €50.00");
		expect(wrapper.text()).toContain("Out of €800.00 planned€50.00");

		await answerConfirmDialog(wrapper, "confirm");

		expect(wrapper.text()).toContain(
			"You have not logged any expenses this month.",
		);
	});

	it("keeps a category when the user cancels removing it", async () => {
		fakeAppApi({ budget: savedBudget });
		const { wrapper } = await mountBudget();

		await pressLabelled(wrapper, "Remove Home");
		expect(wrapper.get('[role="alertdialog"]').text()).toContain(
			"The category leaves your budget, with the expense logged in it.",
		);

		await answerConfirmDialog(wrapper, "cancel");

		expect(categoryTitles(wrapper)).toEqual(["Home", "Fun"]);
		expect(wrapper.text()).toContain("Rent");
	});

	it("removes a category and its expenses only once confirmed", async () => {
		fakeAppApi({ budget: savedBudget });
		const { wrapper } = await mountBudget();

		await pressLabelled(wrapper, "Remove Home");
		expect(categoryTitles(wrapper)).toEqual(["Home", "Fun"]);

		await answerConfirmDialog(wrapper, "confirm");

		expect(categoryTitles(wrapper)).toEqual(["Fun"]);
		expect(wrapper.text()).toContain(
			"You have not logged any expenses this month.",
		);
	});

	it("saves the budget on the user", async () => {
		const { saved } = fakeAppApi({ budget: savedBudget });
		const { wrapper } = await mountBudget();

		await wrapper.get('input[type="number"]').setValue("1800");
		await click(wrapper, "Save budget");

		expect(saved).toEqual([{ budget: { ...savedBudget, salary: 1800 } }]);
		expect(wrapper.text()).toContain("Budget saved.");
	});

	it("explains a failed load and loads again on retry", async () => {
		const { fetchMock } = fakeAppApi({ budget: savedBudget });
		fetchMock.mockImplementationOnce(async () => jsonResponse({}, 500));
		const { wrapper } = await mountBudget();

		expect(wrapper.text()).toContain("Could not load your budget.");

		await click(wrapper, "Try again");

		expect(categoryTitles(wrapper)).toEqual(["Home", "Fun"]);
	});

	it("asks before leaving with unsaved changes and stays when cancelled", async () => {
		fakeAppApi({ budget: savedBudget });
		const { wrapper, router } = await mountBudget("en", true);

		await wrapper.get('input[type="number"]').setValue("1800");
		void router.push("/dashboard");
		await flushPromises();
		expect(wrapper.text()).toContain("Leave without saving?");

		await answerConfirmDialog(wrapper, "cancel");

		expect(router.currentRoute.value.path).toBe("/budget");
	});

	it("shows the badges of the budgeting lessons", async () => {
		fakeAppApi();
		const { wrapper } = await mountBudget();

		expect(wrapper.text()).toContain("What you are applying here");
		expect(wrapper.text()).toContain("Budget on Track");
	});

	it("speaks Portuguese by default", async () => {
		fakeAppApi({ budget: savedBudget });
		const { wrapper } = await mountBudget("pt-PT");

		expect(wrapper.text()).toContain("Organiza o teu mês.");
		expect(wrapper.text()).toContain("Regra 50/30/20");
		expect(wrapper.text()).toContain("Poupança estimada");
		expect(wrapper.text()).toContain("Despesas deste mês");
	});
});
