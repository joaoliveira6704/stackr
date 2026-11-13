import { flushPromises } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../lib/use-auth";
import { useProgressStore } from "../stores/progress";
import {
	DEMO_PASSWORD,
	demoUser,
	fakeUsersApi,
	jsonResponse,
	newcomer,
} from "../test/fake-api";
import { mountAt } from "../test/mount";
import OnboardingView from "./OnboardingView.vue";

type Wrapper = Awaited<ReturnType<typeof mountAt>>["wrapper"];

// The first option of every question is the careful one, and for the
// knowledge questions the right answers are listed by position.
const CAREFUL_EXPERT_PICKS = [0, 2, 1, 0, 0, 0];
const BEGINNER_PICKS = [3, 3, 3, 1, 0, 0];
const RISK_LOVER_PICKS = [3, 3, 3, 2, 2, 2];

async function answerAll(wrapper: Wrapper, picks: number[]) {
	await wrapper.get("button.btn-primary").trigger("click");
	for (const pick of picks) {
		await wrapper.findAll('input[type="radio"]')[pick].setValue();
		await wrapper.get("button.btn-primary").trigger("click");
	}
	await flushPromises();
}

async function mountForNewcomer() {
	fakeUsersApi();
	await useAuth().signIn(newcomer.email, DEMO_PASSWORD);
	return mountAt("/onboarding", OnboardingView);
}

afterEach(() => {
	useAuth().signOut();
	localStorage.clear();
	vi.unstubAllGlobals();
});

describe("OnboardingView", () => {
	it("opens with a welcome screen before the first question", async () => {
		const { wrapper } = await mountForNewcomer();

		expect(wrapper.text()).toContain("Let's find your starting point.");
		expect(wrapper.find('input[type="radio"]').exists()).toBe(false);
	});

	it("keeps Next disabled until an answer is chosen", async () => {
		const { wrapper } = await mountForNewcomer();
		await wrapper.get("button.btn-primary").trigger("click");

		expect(
			wrapper.get("button.btn-primary").attributes("disabled"),
		).toBeDefined();

		await wrapper.findAll('input[type="radio"]')[0].setValue();

		expect(
			wrapper.get("button.btn-primary").attributes("disabled"),
		).toBeUndefined();
	});

	it("shows how far along the user is", async () => {
		const { wrapper } = await mountForNewcomer();
		await wrapper.get("button.btn-primary").trigger("click");

		expect(wrapper.text()).toContain("Question 1 of 6");
	});

	it("keeps an answer when the user goes back to change it", async () => {
		const { wrapper } = await mountForNewcomer();
		await wrapper.get("button.btn-primary").trigger("click");
		await wrapper.findAll('input[type="radio"]')[2].setValue();
		await wrapper.get("button.btn-primary").trigger("click");

		await wrapper.get("button.btn-secondary").trigger("click");

		const radios = wrapper.findAll<HTMLInputElement>('input[type="radio"]');
		expect(radios[2].element.checked).toBe(true);
	});

	it("assigns Strategist to a careful user who knows the basics", async () => {
		const { wrapper } = await mountForNewcomer();

		await answerAll(wrapper, CAREFUL_EXPERT_PICKS);

		expect(wrapper.text()).toContain("Strategist");
		expect(useAuth().user.value?.track).toBe("strategist");
	});

	it("assigns Foundation to a careful beginner", async () => {
		const { wrapper } = await mountForNewcomer();

		await answerAll(wrapper, BEGINNER_PICKS);

		expect(useAuth().user.value?.track).toBe("foundation");
	});

	it("assigns Arena to a user who picks the bold answers", async () => {
		const { wrapper } = await mountForNewcomer();

		await answerAll(wrapper, RISK_LOVER_PICKS);

		expect(wrapper.text()).toContain("Arena");
		expect(useAuth().user.value?.track).toBe("arena");
	});

	it("gives 50 XP and marks onboarding as done the first time", async () => {
		const { wrapper } = await mountForNewcomer();

		await answerAll(wrapper, BEGINNER_PICKS);

		const progress = useProgressStore();
		expect(progress.xp).toBe(50);
		expect(progress.onboardingDone).toBe(true);
		expect(progress.track).toBe("foundation");
		expect(wrapper.text()).toContain("+50 XP");
	});

	it("gives no XP when a user who already onboarded retakes it", async () => {
		fakeUsersApi();
		await useAuth().signIn(demoUser.email, DEMO_PASSWORD);
		const { wrapper } = await mountAt("/onboarding", OnboardingView);

		await answerAll(wrapper, RISK_LOVER_PICKS);

		expect(useProgressStore().xp).toBe(0);
		expect(wrapper.text()).not.toContain("+50 XP");
		expect(useAuth().user.value?.track).toBe("arena");
	});

	it("shows a clear error and stays on the last question when saving fails", async () => {
		const { wrapper } = await mountForNewcomer();
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => jsonResponse({}, 500)),
		);

		await answerAll(wrapper, BEGINNER_PICKS);

		expect(wrapper.text()).toContain("Could not save your track.");
		expect(wrapper.text()).toContain("Question 6 of 6");
		expect(useProgressStore().xp).toBe(0);
	});

	it("goes to the dashboard from the result screen", async () => {
		const { wrapper, router } = await mountForNewcomer();
		await answerAll(wrapper, BEGINNER_PICKS);

		await wrapper.get("button.btn-primary").trigger("click");
		await flushPromises();

		expect(router.currentRoute.value.path).toBe("/dashboard");
	});
});
