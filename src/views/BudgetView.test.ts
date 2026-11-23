import {
	enableAutoUnmount,
	flushPromises,
	type VueWrapper,
} from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";
import { RouterView } from "vue-router";
import { dateKey } from "../lib/budget";
import { AUTO_SAVE_DELAY_MS } from "../lib/use-saved-plan";
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
		{
			id: "home",
			name: "Home",
			description: "",
			group: "needs",
			planned: 600,
			recurrence: "monthly",
			dueDate: today,
		},
		{
			id: "fun",
			name: "Fun",
			description: "",
			group: "wants",
			planned: 200,
			recurrence: "monthly",
			dueDate: today,
		},
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

// An open page keeps its auto save timer, which must not fire into the next test.
enableAutoUnmount(afterEach);

beforeEach(() => {
	storeSessionFor(demoUser);
});

afterEach(() => {
	localStorage.clear();
	vi.useRealTimers();
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

function card(wrapper: VueWrapper, name: string) {
	const found = wrapper
		.findAll("article")
		.find((article) => article.get("h3").text() === name);
	if (!found) throw new Error(`No card called "${name}"`);
	return found;
}

async function typePaid(wrapper: VueWrapper, name: string, amount: string) {
	await card(wrapper, name)
		.get('button[aria-label^="Edit the amount paid"]')
		.trigger("click");
	await flushPromises();
	const input = card(wrapper, name).get('input[type="number"]');
	await input.setValue(amount);
	await input.trigger("keydown", { key: "Enter" });
	await flushPromises();
}

// Only the timers are faked, so promises and flushPromises keep working.
function holdAutoSave() {
	vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
}

async function waitForAutoSave() {
	await vi.advanceTimersByTimeAsync(AUTO_SAVE_DELAY_MS);
	await flushPromises();
}

function categoryTitles(wrapper: VueWrapper) {
	return wrapper.findAll("article h3").map((title) => title.text());
}

function categoryDialog(wrapper: VueWrapper) {
	return wrapper.find('[role="dialog"]');
}

async function fillCategoryDialog(
	wrapper: VueWrapper,
	fields: {
		name?: string;
		description?: string;
		planned?: string;
		recurrence?: string;
		dueDate?: string;
	},
) {
	const dialog = categoryDialog(wrapper);
	const [name, description] = dialog.findAll('input[type="text"]');
	if (fields.name !== undefined) await name.setValue(fields.name);
	if (fields.description !== undefined) {
		await description.setValue(fields.description);
	}
	if (fields.planned !== undefined) {
		await dialog.get('input[type="number"]').setValue(fields.planned);
	}
	if (fields.recurrence !== undefined) {
		await dialog.findAll("select")[1].setValue(fields.recurrence);
	}
	await dialog
		.get('input[type="date"]')
		.setValue(fields.dueDate ?? "2030-01-15");
	await dialog.get("form").trigger("submit");
	await flushPromises();
}

function spendingStatus(wrapper: VueWrapper, name: string) {
	return card(wrapper, name).get("span.font-semibold").text();
}

describe("BudgetView", () => {
	it("starts a new account without any expense cards", async () => {
		fakeAppApi();
		const { wrapper } = await mountBudget();

		expect(categoryTitles(wrapper)).toEqual([]);
		expect(wrapper.text()).toContain("You have no expenses yet.");
		expect(wrapper.text()).toContain(
			"Type in your salary to compare your plan",
		);
	});

	it("opens a dialog to add an expense, with a description", async () => {
		fakeAppApi();
		const { wrapper } = await mountBudget();

		await click(wrapper, "New record");
		expect(categoryDialog(wrapper).text()).toContain("New record");

		await fillCategoryDialog(wrapper, {
			name: "Gym",
			description: "Monthly fee at the club",
			planned: "35",
		});

		expect(categoryDialog(wrapper).exists()).toBe(false);
		expect(categoryTitles(wrapper)).toEqual(["Gym"]);
		expect(wrapper.text()).toContain("Monthly fee at the club");
		expect(wrapper.text()).toContain("Needs");
		expect(wrapper.text()).toContain("€35.00 · Monthly");
		expect(wrapper.text()).toContain("Due Jan 15, 2030");
	});

	it("keeps the dialog open and explains a missing name", async () => {
		fakeAppApi();
		const { wrapper } = await mountBudget();

		await click(wrapper, "New record");
		await fillCategoryDialog(wrapper, { name: "  ", planned: "35" });

		expect(categoryDialog(wrapper).text()).toContain(
			"Give the expense a name.",
		);
		expect(categoryTitles(wrapper)).toEqual([]);
	});

	it("adds nothing when the dialog is cancelled", async () => {
		fakeAppApi();
		const { wrapper } = await mountBudget();

		await click(wrapper, "New record");
		await categoryDialog(wrapper).get('input[type="text"]').setValue("Gym");
		await click(wrapper, "Cancel");

		expect(categoryDialog(wrapper).exists()).toBe(false);
		expect(categoryTitles(wrapper)).toEqual([]);
	});

	it("closes the dialog on Escape without adding anything", async () => {
		fakeAppApi();
		const { wrapper } = await mountBudget();

		await click(wrapper, "New record");
		await categoryDialog(wrapper).trigger("keydown", { key: "Escape" });

		expect(categoryDialog(wrapper).exists()).toBe(false);
		expect(categoryTitles(wrapper)).toEqual([]);
	});

	it("edits a card through the same dialog, filled with its fields", async () => {
		fakeAppApi({ budget: savedBudget });
		const { wrapper } = await mountBudget();

		await pressLabelled(wrapper, "Edit Home");
		const dialog = categoryDialog(wrapper);
		expect(dialog.text()).toContain("Edit expense");
		expect(
			(dialog.get('input[type="text"]').element as HTMLInputElement).value,
		).toBe("Home");

		await fillCategoryDialog(wrapper, { name: "Rent", description: "Flat" });

		expect(categoryTitles(wrapper)).toEqual(["Rent", "Fun"]);
		expect(wrapper.text()).toContain("Flat");
	});

	it("leaves a card as it was when editing is cancelled", async () => {
		fakeAppApi({ budget: savedBudget });
		const { wrapper } = await mountBudget();

		await pressLabelled(wrapper, "Edit Home");
		await categoryDialog(wrapper).get('input[type="text"]').setValue("Rent");
		await click(wrapper, "Cancel");

		expect(categoryTitles(wrapper)).toEqual(["Home", "Fun"]);
	});

	it("has no separate form to log spending", async () => {
		fakeAppApi({ budget: savedBudget });
		const { wrapper } = await mountBudget();

		expect(wrapper.text()).not.toContain("Log spending");
		expect(wrapper.findAll("form")).toHaveLength(0);
	});

	it("shows what is already paid inside the card", async () => {
		fakeAppApi({ budget: savedBudget });
		const { wrapper } = await mountBudget();

		const slider = card(wrapper, "Home").get('input[type="range"]');
		expect((slider.element as HTMLInputElement).value).toBe("50");
		expect(card(wrapper, "Home").text()).toContain("€50.00");
		expect(spendingStatus(wrapper, "Home")).toBe("€550.00 to pay");
	});

	it("updates the amount when the slider is dragged", async () => {
		fakeAppApi({ budget: savedBudget });
		const { wrapper } = await mountBudget();

		await card(wrapper, "Fun").get('input[type="range"]').setValue("120");

		expect(spendingStatus(wrapper, "Fun")).toBe("€80.00 to pay");
	});

	it("keeps the amount when typing is cancelled with Escape", async () => {
		fakeAppApi({ budget: savedBudget });
		const { wrapper } = await mountBudget();

		await card(wrapper, "Home")
			.get('button[aria-label^="Edit the amount paid"]')
			.trigger("click");
		await flushPromises();
		const input = card(wrapper, "Home").get('input[type="number"]');
		await input.setValue("400");
		await input.trigger("keydown", { key: "Escape" });
		await flushPromises();

		expect(spendingStatus(wrapper, "Home")).toBe("€550.00 to pay");
	});

	it("asks for a date on a recurring expense and adds nothing", async () => {
		fakeAppApi();
		const { wrapper } = await mountBudget();

		await click(wrapper, "New record");
		await fillCategoryDialog(wrapper, {
			name: "Gym",
			planned: "35",
			dueDate: "",
		});

		expect(categoryDialog(wrapper).text()).toContain(
			"Pick the due date for this expense.",
		);
		expect(categoryTitles(wrapper)).toEqual([]);
	});

	it("lets a one time expense go without a date", async () => {
		fakeAppApi();
		const { wrapper } = await mountBudget();

		await click(wrapper, "New record");
		await fillCategoryDialog(wrapper, {
			name: "Repair",
			planned: "35",
			recurrence: "once",
			dueDate: "",
		});

		expect(categoryTitles(wrapper)).toEqual(["Repair"]);
		expect(wrapper.text()).toContain("€35.00 · One time");
	});

	it("offers a small tile to add the first record", async () => {
		fakeAppApi();
		const { wrapper } = await mountBudget();

		const add = buttonWithText(wrapper, "New record");
		expect(add.classes()).toContain("glass");
		expect(add.classes()).not.toContain("btn-primary");
	});

	it("moves the add button next to the title once there is a card", async () => {
		fakeAppApi({ budget: savedBudget });
		const { wrapper } = await mountBudget();

		const add = buttonWithText(wrapper, "New record");
		expect(add.classes()).toContain("btn-primary");
		expect(add.element.parentElement?.querySelector("h2")?.textContent).toBe(
			"Spending this month",
		);
		expect(
			wrapper.findAll("button").filter((b) => b.text().includes("New record")),
		).toHaveLength(1);
	});

	it("does not offer savings as a type of expense", async () => {
		fakeAppApi();
		const { wrapper } = await mountBudget();

		await click(wrapper, "New record");

		const types = categoryDialog(wrapper).findAll("select")[0];
		expect(types.text()).toContain("Needs");
		expect(types.text()).not.toContain("Savings");
	});

	it("moves the progress as a bill is paid little by little", async () => {
		fakeAppApi({ budget: savedBudget });
		const { wrapper } = await mountBudget();

		await typePaid(wrapper, "Home", "150");
		expect(spendingStatus(wrapper, "Home")).toBe("€450.00 to pay");

		await typePaid(wrapper, "Home", "400.5");
		expect(spendingStatus(wrapper, "Home")).toBe("€199.50 to pay");
		expect(wrapper.text()).toContain("Out of €800.00 planned€400.50");
	});

	it("says paid off once the whole bill is paid", async () => {
		fakeAppApi({ budget: savedBudget });
		const { wrapper } = await mountBudget();

		await typePaid(wrapper, "Home", "600");

		expect(spendingStatus(wrapper, "Home")).toBe("Paid off");
	});

	it("says by how much a bill was paid above its plan", async () => {
		fakeAppApi({ budget: savedBudget });
		const { wrapper } = await mountBudget();

		await typePaid(wrapper, "Home", "650");

		expect(spendingStatus(wrapper, "Home")).toBe("Over by €50.00");
	});

	it("counts a cleared field as nothing paid", async () => {
		fakeAppApi({ budget: savedBudget });
		const { wrapper } = await mountBudget();

		await typePaid(wrapper, "Home", "");

		expect(spendingStatus(wrapper, "Home")).toBe("€600.00 to pay");
		expect(wrapper.text()).not.toContain("Total paid");
	});

	it("explains a negative amount and keeps what was paid", async () => {
		fakeAppApi({ budget: savedBudget });
		const { wrapper } = await mountBudget();

		await typePaid(wrapper, "Home", "-10");

		expect(card(wrapper, "Home").get('[role="alert"]').text()).toBe(
			"The amount paid cannot be negative.",
		);
		expect(spendingStatus(wrapper, "Home")).toBe("€550.00 to pay");
	});

	it("saves the amount paid on the user", async () => {
		const { saved } = fakeAppApi({ budget: savedBudget });
		const { wrapper } = await mountBudget();
		holdAutoSave();

		await typePaid(wrapper, "Home", "300");
		await waitForAutoSave();

		expect(saved).toEqual([
			{
				budget: {
					...savedBudget,
					expenses: [{ ...savedBudget.expenses[0], amount: 300 }],
				},
			},
		]);
	});

	it("turns the monthly plan into a yearly estimate", async () => {
		const save = {
			id: "save",
			name: "Save",
			description: "",
			group: "savings",
			planned: 250,
		};
		fakeAppApi({
			budget: { ...savedBudget, categories: [...savedBudget.categories, save] },
		});
		const { wrapper } = await mountBudget();

		expect(wrapper.text()).toContain("Yearly income€18,000.00");
		expect(wrapper.text()).toContain("Yearly spending€9,600.00");
		expect(wrapper.text()).toContain("Estimated savings€3,000.00");
	});

	it("counts no savings when nothing is planned as savings", async () => {
		fakeAppApi({ budget: savedBudget });
		const { wrapper } = await mountBudget();

		expect(wrapper.text()).toContain("Estimated savings€0.00");
		expect(wrapper.text()).toContain(
			"SavingsAim for at least 20% · €0.000%Below the aim",
		);
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
					{ id: "save", name: "Save", group: "savings", planned: 200 },
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

	it("says liquidada and excedida in Portuguese", async () => {
		fakeAppApi({
			budget: {
				...savedBudget,
				expenses: [
					{
						id: "e1",
						categoryId: "home",
						amount: 600,
						description: "",
						date: today,
					},
					{
						id: "e2",
						categoryId: "fun",
						amount: 500,
						description: "",
						date: today,
					},
				],
			},
		});
		const { wrapper } = await mountBudget("pt-PT");

		expect(spendingStatus(wrapper, "Home")).toBe("Liquidada");
		// The Portuguese format puts a no break space before the euro sign.
		expect(spendingStatus(wrapper, "Fun")).toMatch(/^Excedida em 300,00\s€$/);
	});

	it("keeps a category when the user cancels removing it", async () => {
		fakeAppApi({ budget: savedBudget });
		const { wrapper } = await mountBudget();

		await pressLabelled(wrapper, "Remove Home");
		expect(wrapper.get('[role="alertdialog"]').text()).toContain(
			"The expense leaves your budget, with the payment logged in it.",
		);

		await answerConfirmDialog(wrapper, "cancel");

		expect(categoryTitles(wrapper)).toEqual(["Home", "Fun"]);
		expect(wrapper.text()).toContain("Total paid");
	});

	it("removes a category and its expenses only once confirmed", async () => {
		fakeAppApi({ budget: savedBudget });
		const { wrapper } = await mountBudget();

		await pressLabelled(wrapper, "Remove Home");
		expect(categoryTitles(wrapper)).toEqual(["Home", "Fun"]);

		await answerConfirmDialog(wrapper, "confirm");

		expect(categoryTitles(wrapper)).toEqual(["Fun"]);
		expect(wrapper.text()).not.toContain("Total paid");
	});

	it("saves a change by itself and says so", async () => {
		const { saved } = fakeAppApi({ budget: savedBudget });
		const { wrapper } = await mountBudget();
		holdAutoSave();

		await wrapper.get('input[type="number"]').setValue("1800");
		expect(wrapper.text()).toContain("Saving...");
		await waitForAutoSave();

		expect(saved).toEqual([{ budget: { ...savedBudget, salary: 1800 } }]);
		expect(wrapper.text()).toContain("Budget saved.");
	});

	it("saves a new record without a save button", async () => {
		const { saved } = fakeAppApi();
		const { wrapper } = await mountBudget();
		holdAutoSave();

		await click(wrapper, "New record");
		await fillCategoryDialog(wrapper, { name: "Gym", planned: "35" });
		await waitForAutoSave();

		expect(wrapper.text()).not.toContain("Save budget");
		expect(saved).toHaveLength(1);
		expect(saved[0]).toMatchObject({
			budget: { categories: [{ name: "Gym", planned: 35 }] },
		});
	});

	it("sends one save for a burst of quick changes", async () => {
		const { saved } = fakeAppApi({ budget: savedBudget });
		const { wrapper } = await mountBudget();
		holdAutoSave();
		const slider = card(wrapper, "Home").get('input[type="range"]');

		await slider.setValue("100");
		await slider.setValue("200");
		await slider.setValue("300");
		await waitForAutoSave();

		expect(saved).toHaveLength(1);
	});

	it("saves nothing right after loading", async () => {
		const { saved } = fakeAppApi({ budget: savedBudget });
		holdAutoSave();
		await mountBudget();
		await waitForAutoSave();

		expect(saved).toEqual([]);
	});

	it("does not store an invalid salary", async () => {
		const { saved } = fakeAppApi({ budget: savedBudget });
		const { wrapper } = await mountBudget();
		holdAutoSave();

		await wrapper.get('input[type="number"]').setValue("");
		await waitForAutoSave();

		expect(saved).toEqual([]);
		expect(wrapper.text()).toContain("You have unsaved changes");
	});

	it("explains a failed save and saves again on retry", async () => {
		const { fetchMock, saved } = fakeAppApi({ budget: savedBudget });
		const { wrapper } = await mountBudget();
		holdAutoSave();
		fetchMock.mockImplementationOnce(async () => jsonResponse({}, 500));

		await wrapper.get('input[type="number"]').setValue("1800");
		await waitForAutoSave();
		expect(wrapper.text()).toContain("Could not save your budget");

		await click(wrapper, "Try again");

		expect(saved).toEqual([{ budget: { ...savedBudget, salary: 1800 } }]);
		expect(wrapper.text()).toContain("Budget saved.");
	});

	it("saves a pending change when leaving, without asking", async () => {
		const { saved } = fakeAppApi({ budget: savedBudget });
		const { wrapper, router } = await mountBudget("en", true);
		holdAutoSave();

		await wrapper.get('input[type="number"]').setValue("1800");
		await router.push("/dashboard");
		await flushPromises();

		expect(saved).toEqual([{ budget: { ...savedBudget, salary: 1800 } }]);
		expect(router.currentRoute.value.path).toBe("/dashboard");
	});

	it("explains a failed load and loads again on retry", async () => {
		const { fetchMock } = fakeAppApi({ budget: savedBudget });
		fetchMock.mockImplementationOnce(async () => jsonResponse({}, 500));
		const { wrapper } = await mountBudget();

		expect(wrapper.text()).toContain("Could not load your budget.");

		await click(wrapper, "Try again");

		expect(categoryTitles(wrapper)).toEqual(["Home", "Fun"]);
	});

	it("asks before leaving with a value it cannot save and stays when cancelled", async () => {
		fakeAppApi({ budget: savedBudget });
		const { wrapper, router } = await mountBudget("en", true);

		await wrapper.get('input[type="number"]').setValue("");
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
		expect(wrapper.text()).toContain("Gastos deste mês");
		expect(wrapper.text()).toContain("Já pago");
		expect(wrapper.text()).toContain("Faltam");
	});
});
