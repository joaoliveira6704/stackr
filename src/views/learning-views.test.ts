import { flushPromises } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../lib/use-auth";
import { useProgressStore } from "../stores/progress";
import { fixtureContent, lessonOne, lessonTwo } from "../test/content-fixtures";
import { DEMO_PASSWORD, demoUser, fakeApi } from "../test/fake-api";
import { mountAt } from "../test/mount";
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

describe("LearnView", () => {
	it("lists the modules with the first lesson open and the rest locked", async () => {
		await signIn();
		const { wrapper } = await mountAt("/learn", LearnView);
		await flushPromises();

		expect(wrapper.text()).toContain("Budget");
		expect(wrapper.text()).toContain("Lesson budget-1");
		expect(wrapper.find(`a[href="/learn/${lessonOne.id}"]`).exists()).toBe(
			true,
		);
		expect(wrapper.find(`a[href="/learn/${lessonTwo.id}"]`).exists()).toBe(
			false,
		);
		expect(wrapper.text()).toContain("Locked");
	});

	it("shows finished lessons as done and opens the next one", async () => {
		await signIn();
		const { wrapper } = await mountAt("/learn", LearnView);
		useProgressStore().completeLesson(lessonOne.id);
		await flushPromises();

		expect(wrapper.text()).toContain("Done");
		expect(wrapper.text()).toContain("1 of 2 lessons done");
		expect(wrapper.find(`a[href="/learn/${lessonTwo.id}"]`).exists()).toBe(
			true,
		);
	});

	it("shows the content in Portuguese", async () => {
		await signIn();
		const { wrapper } = await mountAt("/learn", LearnView, "pt-PT");
		await flushPromises();

		expect(wrapper.text()).toContain("Budget (pt)");
		expect(wrapper.text()).toContain("Aprender");
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

describe("LessonView", () => {
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
