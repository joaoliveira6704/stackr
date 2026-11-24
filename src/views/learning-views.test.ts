import { flushPromises } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../lib/use-auth";
import { useProgressStore } from "../stores/progress";
import { MODULE_REWARD } from "../lib/rewards";
import {
	extraLesson,
	extraOneOff,
	FUND_PRICE,
	fixtureContent,
	lessonOne,
	lessonThree,
	lessonTwo,
	otherTrackLesson,
} from "../test/content-fixtures";
import { DEMO_PASSWORD, demoUser, fakeApi } from "../test/fake-api";
import { answerConfirmDialog, mountAt } from "../test/mount";
import LearnView from "./LearnView.vue";
import LessonView from "./LessonView.vue";
import QuizView from "./QuizView.vue";

afterEach(() => {
	useAuth().signOut();
	localStorage.clear();
	vi.unstubAllGlobals();
});

async function signIn() {
	fakeApi(fixtureContent);
	await useAuth().signIn(demoUser.email, DEMO_PASSWORD);
}

type Wrapper = Awaited<ReturnType<typeof mountAt>>["wrapper"];

function buttonWithText(wrapper: Wrapper, label: string) {
	const button = wrapper
		.findAll("button")
		.find((item) => item.text().includes(label));
	if (!button) throw new Error(`No button "${label}"`);
	return button;
}

async function answerQuiz(wrapper: Wrapper, picks: number[]) {
	for (const pick of picks) {
		await wrapper.findAll('input[type="radio"]')[pick].setValue();
		await buttonWithText(wrapper, "Check").trigger("click");
		const next = wrapper
			.findAll("button")
			.find((item) => /Next|See result/.test(item.text()));
		await next?.trigger("click");
	}
	await flushPromises();
}

async function mountLearn(stacks = 0, locale: "en" | "pt-PT" = "en") {
	await signIn();
	const mounted = await mountAt("/learn", LearnView, locale);
	useProgressStore().addStacks(stacks);
	await flushPromises();
	return mounted.wrapper;
}

function moduleCard(wrapper: Wrapper, moduleId: string) {
	return wrapper.get(`[data-module="${moduleId}"]`);
}

function toggleOf(wrapper: Wrapper, moduleId: string) {
	return moduleCard(wrapper, moduleId).get("button[aria-expanded]");
}

async function openModule(wrapper: Wrapper, moduleId: string) {
	await toggleOf(wrapper, moduleId).trigger("click");
	await flushPromises();
}

describe("LearnView module grid", () => {
	it("lays the modules out in a grid of three columns on wide screens", async () => {
		const wrapper = await mountLearn();
		const grid = moduleCard(wrapper, "budget").element.parentElement;

		expect(grid?.className).toContain("lg:grid-cols-3");
		expect(grid?.children).toHaveLength(2);
	});

	it("shows only the number, name and lessons done on a closed card", async () => {
		const wrapper = await mountLearn();
		const card = moduleCard(wrapper, "budget");

		expect(card.text()).toContain("Module 1");
		expect(card.text()).toContain("Budget");
		expect(card.text()).toContain("0/2 lessons");
		expect(card.text()).not.toContain("Budget summary");
		expect(card.find("a").exists()).toBe(false);
	});

	it("shows the price on a closed locked card", async () => {
		const wrapper = await mountLearn();

		expect(moduleCard(wrapper, "fund").text()).toContain(
			`${FUND_PRICE} Stacks`,
		);
		expect(moduleCard(wrapper, "budget").text()).not.toContain("Stacks");
	});

	it("counts the lessons done on the closed card", async () => {
		const wrapper = await mountLearn();
		useProgressStore().completeLesson(lessonOne.id);
		await flushPromises();

		expect(moduleCard(wrapper, "budget").text()).toContain("1/2 lessons");
	});

	it("opens a card across the full row with its summary and lessons", async () => {
		const wrapper = await mountLearn();

		await openModule(wrapper, "budget");
		const card = moduleCard(wrapper, "budget");

		expect(card.attributes("data-expanded")).toBeDefined();
		expect(card.classes()).toContain("data-expanded:col-span-full");
		expect(toggleOf(wrapper, "budget").attributes("aria-expanded")).toBe(
			"true",
		);
		expect(card.text()).toContain("Budget summary");
		expect(card.find(`a[href="/learn/${lessonOne.id}"]`).exists()).toBe(true);
		expect(card.find(`a[href="/learn/${lessonTwo.id}"]`).exists()).toBe(false);
		expect(card.text()).toContain("Locked");
	});

	it("closes an open card when its name is pressed again", async () => {
		const wrapper = await mountLearn();

		await openModule(wrapper, "budget");
		await openModule(wrapper, "budget");

		expect(
			moduleCard(wrapper, "budget").attributes("data-expanded"),
		).toBeUndefined();
		expect(wrapper.find(`a[href="/learn/${lessonOne.id}"]`).exists()).toBe(
			false,
		);
	});

	it("keeps only one card open at a time", async () => {
		const wrapper = await mountLearn();

		await openModule(wrapper, "budget");
		await openModule(wrapper, "fund");

		expect(
			moduleCard(wrapper, "budget").attributes("data-expanded"),
		).toBeUndefined();
		expect(
			moduleCard(wrapper, "fund").attributes("data-expanded"),
		).toBeDefined();
	});

	it("opens the next lesson once the previous one is done", async () => {
		const wrapper = await mountLearn();
		useProgressStore().completeLesson(lessonOne.id);
		await openModule(wrapper, "budget");

		expect(wrapper.text()).toContain("Done");
		expect(wrapper.find(`a[href="/learn/${lessonTwo.id}"]`).exists()).toBe(
			true,
		);
	});

	it("marks a finished module as done on its closed card", async () => {
		const wrapper = await mountLearn();
		useProgressStore().completeLesson(lessonOne.id);
		useProgressStore().completeLesson(lessonTwo.id);
		await flushPromises();

		expect(moduleCard(wrapper, "budget").text()).toContain("Module done");
		expect(moduleCard(wrapper, "budget").text()).toContain("2/2 lessons");
	});

	it("shows the module bonus inside an open module", async () => {
		const wrapper = await mountLearn();

		await openModule(wrapper, "budget");

		expect(moduleCard(wrapper, "budget").text()).toContain(
			`Finish the module to earn +${MODULE_REWARD.xp} XP and +${MODULE_REWARD.stacks} Stacks.`,
		);
	});

	it("never lists lessons from another track", async () => {
		const wrapper = await mountLearn();

		expect(wrapper.text()).not.toContain("Arena only lesson");
	});

	it("shows the cards in Portuguese", async () => {
		const wrapper = await mountLearn(0, "pt-PT");
		const card = moduleCard(wrapper, "budget");

		expect(wrapper.text()).toContain("Aprender");
		expect(card.text()).toContain("Budget (pt)");
		expect(card.text()).toContain("0/2 aulas");
		expect(card.text()).toContain("Módulo 1");
	});

	it("explains the error and offers a retry when the API is down", async () => {
		await signIn();
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				throw new TypeError("offline");
			}),
		);
		const { wrapper } = await mountAt("/learn", LearnView);
		await flushPromises();

		expect(wrapper.text()).toContain("Could not reach the API");
		expect(wrapper.text()).toContain("Try again");
	});
});

describe("LearnView unlocking", () => {
	function unlockButton(wrapper: Wrapper) {
		const button = moduleCard(wrapper, "fund")
			.findAll("button")
			.find((item) => item.text().includes("Unlock for"));
		if (!button) throw new Error("No unlock button");
		return button;
	}

	async function mountWithFundOpen(stacks: number) {
		const wrapper = await mountLearn(stacks);
		await openModule(wrapper, "fund");
		return wrapper;
	}

	it("shows the unlock button and keeps the lessons closed in an open locked module", async () => {
		const wrapper = await mountWithFundOpen(100);

		expect(unlockButton(wrapper).text()).toContain(
			`Unlock for ${FUND_PRICE} Stacks`,
		);
		expect(wrapper.find(`a[href="/learn/${lessonThree.id}"]`).exists()).toBe(
			false,
		);
	});

	it("disables the unlock button and says how many Stacks are missing", async () => {
		const wrapper = await mountWithFundOpen(10);

		expect(unlockButton(wrapper).attributes("disabled")).toBeDefined();
		expect(moduleCard(wrapper, "fund").text()).toContain(
			`You need ${FUND_PRICE - 10} more Stacks.`,
		);
	});

	it("asks before spending and changes nothing until the user confirms", async () => {
		const wrapper = await mountWithFundOpen(100);

		await unlockButton(wrapper).trigger("click");
		await flushPromises();

		const dialog = wrapper.get('[role="alertdialog"]');
		expect(dialog.text()).toContain("Unlock this module?");
		expect(dialog.text()).toContain(`spend ${FUND_PRICE} Stacks on "Fund"`);
		expect(useProgressStore().stacks).toBe(100);
		expect(useProgressStore().unlockedContent).toEqual([]);
	});

	it("spends nothing and keeps the module locked when the user cancels", async () => {
		const wrapper = await mountWithFundOpen(100);

		await unlockButton(wrapper).trigger("click");
		await flushPromises();
		await answerConfirmDialog(wrapper, "cancel");

		expect(useProgressStore().stacks).toBe(100);
		expect(useProgressStore().unlockedContent).toEqual([]);
		expect(wrapper.find(`a[href="/learn/${lessonThree.id}"]`).exists()).toBe(
			false,
		);
	});

	it("spends the Stacks and opens the first lesson once the user confirms", async () => {
		const wrapper = await mountWithFundOpen(100);

		await unlockButton(wrapper).trigger("click");
		await flushPromises();
		await answerConfirmDialog(wrapper, "confirm");

		expect(useProgressStore().stacks).toBe(100 - FUND_PRICE);
		expect(useProgressStore().unlockedContent).toEqual(["fund"]);
		expect(wrapper.find(`a[href="/learn/${lessonThree.id}"]`).exists()).toBe(
			true,
		);
		expect(moduleCard(wrapper, "fund").text()).not.toContain(
			`${FUND_PRICE} Stacks`,
		);
	});

	it("lists the one-off lessons with their price and what they pay back", async () => {
		const wrapper = await mountLearn(0);

		expect(wrapper.text()).toContain("Extra lessons");
		expect(wrapper.text()).toContain("Lesson extra-1");
		expect(wrapper.text()).toContain(`Unlock for ${extraOneOff.price} Stacks`);
		expect(wrapper.text()).toContain("+45 Stacks");
	});

	it("shows the one-off lessons in a row that scrolls sideways", async () => {
		const wrapper = await mountLearn(0);
		const row = wrapper.get('[role="region"][aria-label="Extra lessons"]');

		expect(row.classes()).toContain("scroller");
		expect(row.text()).toContain("Lesson extra-1");
	});

	it("opens a one-off lesson after the user confirms the purchase", async () => {
		const wrapper = await mountLearn(100);
		const card = wrapper
			.findAll("article")
			.find((item) => item.text().includes("Lesson extra-1"));

		await card?.get("button").trigger("click");
		await flushPromises();
		expect(wrapper.get('[role="alertdialog"]').text()).toContain(
			"Unlock this lesson?",
		);
		await answerConfirmDialog(wrapper, "confirm");

		expect(useProgressStore().stacks).toBe(100 - extraOneOff.price);
		expect(wrapper.find(`a[href="/learn/${extraLesson.id}"]`).exists()).toBe(
			true,
		);
	});

	it("shows the unlock button and extra lessons in Portuguese", async () => {
		const wrapper = await mountLearn(100, "pt-PT");
		await openModule(wrapper, "fund");

		expect(wrapper.text()).toContain(`Desbloquear por ${FUND_PRICE} Stacks`);
		expect(wrapper.text()).toContain("Aulas extra");
		expect(wrapper.text()).toContain("+45 Stacks");
	});
});

describe("LessonView", () => {
	it("treats a lesson from another track as not found and hides its content", async () => {
		await signIn();
		const { wrapper } = await mountAt(
			`/learn/${otherTrackLesson.id}`,
			LessonView,
			"en",
			{ lessonId: otherTrackLesson.id },
		);
		await flushPromises();

		expect(wrapper.text()).toContain("We could not find this content.");
		expect(wrapper.text()).not.toContain("Arena only lesson");
		expect(wrapper.text()).not.toContain("First idea");
	});

	it("keeps a one-off lesson closed until it is bought", async () => {
		await signIn();
		const { wrapper } = await mountAt(
			`/learn/${extraLesson.id}`,
			LessonView,
			"en",
			{ lessonId: extraLesson.id },
		);
		await flushPromises();

		expect(wrapper.text()).toContain("This lesson is still locked.");
	});

	it("opens a one-off lesson that was bought", async () => {
		await signIn();
		const { wrapper } = await mountAt(
			`/learn/${extraLesson.id}`,
			LessonView,
			"en",
			{ lessonId: extraLesson.id },
		);
		useProgressStore().unlockedContent.push(extraOneOff.id);
		await flushPromises();

		expect(wrapper.text()).toContain("First idea");
	});

	it("shows every section of an open lesson", async () => {
		await signIn();
		const { wrapper } = await mountAt(
			`/learn/${lessonOne.id}`,
			LessonView,
			"en",
			{ lessonId: lessonOne.id },
		);
		await flushPromises();

		expect(wrapper.text()).toContain("First idea");
		expect(wrapper.text()).toContain("Second idea");
		expect(wrapper.text()).toContain("An everyday example");
	});

	it("keeps a locked lesson closed", async () => {
		await signIn();
		const { wrapper } = await mountAt(
			`/learn/${lessonTwo.id}`,
			LessonView,
			"en",
			{ lessonId: lessonTwo.id },
		);
		await flushPromises();

		expect(wrapper.text()).toContain("This lesson is still locked.");
		expect(wrapper.text()).not.toContain("First idea");
	});

	it("marks the lesson as read and opens the quiz from the button at the end", async () => {
		await signIn();
		const { wrapper, router } = await mountAt(
			`/learn/${lessonOne.id}`,
			LessonView,
			"en",
			{ lessonId: lessonOne.id },
		);
		await flushPromises();

		await buttonWithText(wrapper, "Take the quiz").trigger("click");
		await flushPromises();

		expect(useProgressStore().canTakeQuiz(lessonOne.id)).toBe(true);
		expect(router.currentRoute.value.path).toBe(`/learn/${lessonOne.id}/quiz`);
	});

	it("highlights the sections tied to missed questions during a review", async () => {
		await signIn();
		const { wrapper } = await mountAt(
			`/learn/${lessonOne.id}`,
			LessonView,
			"en",
			{ lessonId: lessonOne.id },
		);
		const progress = useProgressStore();
		progress.requireReview(lessonOne.id);
		progress.sectionsToReview = { [lessonOne.id]: ["second"] };
		await flushPromises();

		expect(wrapper.text()).toContain("Let's review this lesson");
		const highlighted = wrapper
			.findAll("article section")
			.filter((section) => section.text().includes("Review"));
		expect(highlighted).toHaveLength(1);
		expect(highlighted[0].text()).toContain("Second idea");
	});
});

describe("QuizView", () => {
	it("sends the user to the lesson first when it has not been read", async () => {
		await signIn();
		const { wrapper } = await mountAt(
			`/learn/${lessonOne.id}/quiz`,
			QuizView,
			"en",
			{ lessonId: lessonOne.id },
		);
		await flushPromises();

		expect(wrapper.text()).toContain("Lesson first");
		expect(wrapper.find('input[type="radio"]').exists()).toBe(false);
		expect(wrapper.find(`a[href="/learn/${lessonOne.id}"]`).exists()).toBe(
			true,
		);
	});

	it("tells the user straight away whether an answer was right, with the explanation", async () => {
		await signIn();
		const { wrapper } = await mountAt(
			`/learn/${lessonOne.id}/quiz`,
			QuizView,
			"en",
			{ lessonId: lessonOne.id },
		);
		useProgressStore().markLessonRead(lessonOne.id);
		await flushPromises();

		await wrapper.findAll('input[type="radio"]')[1].setValue();
		await buttonWithText(wrapper, "Check").trigger("click");

		expect(wrapper.text()).toContain("Not quite.");
		expect(wrapper.text()).toContain("Because of first");
		const results = wrapper
			.findAll("label.choice")
			.map((label) => label.attributes("data-result"));
		expect(results).toEqual(["correct", "wrong", undefined]);
	});

	it("passes the lesson and shows the reward at 80% or more", async () => {
		await signIn();
		const { wrapper } = await mountAt(
			`/learn/${lessonOne.id}/quiz`,
			QuizView,
			"en",
			{ lessonId: lessonOne.id },
		);
		useProgressStore().markLessonRead(lessonOne.id);
		await flushPromises();

		await answerQuiz(wrapper, [0, 0, 0, 0, 1]);

		expect(wrapper.text()).toContain("Lesson complete!");
		expect(wrapper.text()).toContain("80%");
		expect(wrapper.text()).toContain("+90 XP");
		expect(wrapper.text()).toContain("+25 Stacks");
		expect(wrapper.find(`a[href="/learn/${lessonTwo.id}"]`).exists()).toBe(
			true,
		);
		expect(useProgressStore().completedLessons).toContain(lessonOne.id);
	});

	it("hides the quiz and the title of a lesson from another track", async () => {
		await signIn();
		const { wrapper } = await mountAt(
			`/learn/${otherTrackLesson.id}/quiz`,
			QuizView,
			"en",
			{ lessonId: otherTrackLesson.id },
		);
		useProgressStore().markLessonRead(otherTrackLesson.id);
		await flushPromises();

		expect(wrapper.text()).toContain("We could not find this content.");
		expect(wrapper.text()).not.toContain("Arena only lesson");
		expect(wrapper.find('input[type="radio"]').exists()).toBe(false);
	});

	it("pays the module bonus when the last lesson of a module is passed", async () => {
		await signIn();
		const { wrapper } = await mountAt(
			`/learn/${lessonTwo.id}/quiz`,
			QuizView,
			"en",
			{ lessonId: lessonTwo.id },
		);
		const progress = useProgressStore();
		progress.completeLesson(lessonOne.id);
		progress.markLessonRead(lessonTwo.id);
		await flushPromises();

		await answerQuiz(wrapper, [0, 0, 0, 0, 0]);

		expect(wrapper.text()).toContain("Module complete!");
		expect(wrapper.text()).toContain(`+${MODULE_REWARD.stacks} Stacks`);
		expect(progress.completedModules).toEqual(["budget"]);
	});

	it("pays back more than the price when a one-off lesson is passed", async () => {
		await signIn();
		const { wrapper } = await mountAt(
			`/learn/${extraLesson.id}/quiz`,
			QuizView,
			"en",
			{ lessonId: extraLesson.id },
		);
		const progress = useProgressStore();
		progress.unlockedContent.push(extraOneOff.id);
		progress.markLessonRead(extraLesson.id);
		await flushPromises();

		await answerQuiz(wrapper, [0, 0, 0, 0, 0]);

		expect(wrapper.text()).toContain("You earned back the Stacks you spent");
		expect(wrapper.text()).toContain("+45 Stacks");
		expect(wrapper.text()).not.toContain("Module complete!");
	});

	it("sends the user back to the lesson below 80%", async () => {
		await signIn();
		const { wrapper } = await mountAt(
			`/learn/${lessonOne.id}/quiz`,
			QuizView,
			"en",
			{ lessonId: lessonOne.id },
		);
		useProgressStore().markLessonRead(lessonOne.id);
		await flushPromises();

		await answerQuiz(wrapper, [0, 1, 0, 1, 1]);

		expect(wrapper.text()).toContain("Almost there");
		expect(wrapper.text()).toContain("40%");
		const reviewLink = wrapper
			.findAll(`a[href="/learn/${lessonOne.id}"]`)
			.find((link) => link.text().includes("Review the lesson"));
		expect(reviewLink).toBeDefined();
		expect(useProgressStore().canTakeQuiz(lessonOne.id)).toBe(false);
	});
});
