import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";
import { useProgressStore } from "../stores/progress";
import { DEMO_PASSWORD, demoUser, fakeApi, newcomer } from "../test/fake-api";
import { useAuth } from "./use-auth";
import { SAVE_DELAY_MS, useProgressSync } from "./use-progress-sync";

function mountSync() {
	let sync!: ReturnType<typeof useProgressSync>;
	mount(
		defineComponent({
			setup() {
				sync = useProgressSync();
				return () => h("div");
			},
		}),
	);
	return sync;
}

function savedProgressOf(db: ReturnType<typeof fakeApi>["db"], userId: string) {
	return (
		db.users.find((user) => user.id === userId) as { progress?: { xp: number } }
	)?.progress;
}

beforeEach(() => {
	setActivePinia(createPinia());
});

afterEach(() => {
	useAuth().signOut();
	vi.useRealTimers();
	vi.unstubAllGlobals();
	localStorage.clear();
});

describe("useProgressSync", () => {
	it("loads the saved progress when the user signs in", async () => {
		const { db } = fakeApi();
		Object.assign(db.users[0], {
			progress: { xp: 340, completedLessons: ["budget-1"] },
		});
		await useAuth().signIn(demoUser.email, DEMO_PASSWORD);

		mountSync();
		await flushPromises();

		const progress = useProgressStore();
		expect(progress.xp).toBe(340);
		expect(progress.completedLessons).toEqual(["budget-1"]);
	});

	it("saves a first time user's progress right away", async () => {
		const { db } = fakeApi();
		await useAuth().signIn(newcomer.email, DEMO_PASSWORD);
		useProgressStore().addXp(50);

		mountSync();
		await flushPromises();

		expect(savedProgressOf(db, newcomer.id)?.xp).toBe(50);
	});

	it("saves shortly after a change, sending a burst of changes together", async () => {
		vi.useFakeTimers();
		const { db, fetchMock } = fakeApi();
		await useAuth().signIn(demoUser.email, DEMO_PASSWORD);
		mountSync();
		await flushPromises();
		const patchesBefore = fetchMock.mock.calls.filter(
			([, init]) => init?.method === "PATCH",
		).length;

		const progress = useProgressStore();
		progress.addXp(30);
		progress.addStacks(10);
		await flushPromises();
		vi.advanceTimersByTime(SAVE_DELAY_MS);
		await flushPromises();

		const patches = fetchMock.mock.calls.filter(
			([, init]) => init?.method === "PATCH",
		).length;
		expect(patches - patchesBefore).toBe(1);
		expect(savedProgressOf(db, demoUser.id)?.xp).toBe(30);
	});

	it("clears the progress when the user signs out", async () => {
		fakeApi();
		await useAuth().signIn(demoUser.email, DEMO_PASSWORD);
		mountSync();
		await flushPromises();
		useProgressStore().addXp(80);

		useAuth().signOut();
		await flushPromises();

		expect(useProgressStore().xp).toBe(0);
	});

	it("reports a clear error when saving fails", async () => {
		vi.useFakeTimers();
		const { fetchMock } = fakeApi();
		await useAuth().signIn(demoUser.email, DEMO_PASSWORD);
		const sync = mountSync();
		await flushPromises();

		fetchMock.mockImplementation(
			async () => new Response("{}", { status: 500 }),
		);
		useProgressStore().addXp(10);
		await flushPromises();
		vi.advanceTimersByTime(SAVE_DELAY_MS);
		await flushPromises();

		expect(sync.syncError.value).toBe("progressNotSaved");
	});
});
