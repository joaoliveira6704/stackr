import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";
import { useProgressStore } from "../stores/progress";
import { DEMO_PASSWORD, demoUser, fakeApi, newcomer } from "../test/fake-api";
import { useAuth } from "./use-auth";
import { SAVE_DELAY_MS, useProgressSync } from "./use-progress-sync";

// Mounted syncs share the signed in user, so each test unmounts its own
// before the next one signs in, otherwise an old sync keeps saving.
const mounted: VueWrapper[] = [];

function mountSync(onAccountMissing?: () => void) {
	let sync!: ReturnType<typeof useProgressSync>;
	const wrapper = mount(
		defineComponent({
			setup() {
				sync = useProgressSync(onAccountMissing);
				return () => h("div");
			},
		}),
	);
	mounted.push(wrapper);
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
	for (const wrapper of mounted.splice(0)) wrapper.unmount();
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

	it("signs out and reports it when the user's record no longer exists", async () => {
		const { db } = fakeApi();
		await useAuth().signIn(demoUser.email, DEMO_PASSWORD);
		db.users = db.users.filter((user) => user.id !== demoUser.id);
		const onAccountMissing = vi.fn();

		const sync = mountSync(onAccountMissing);
		await flushPromises();

		expect(useAuth().user.value).toBeNull();
		expect(onAccountMissing).toHaveBeenCalledOnce();
		expect(sync.syncError.value).toBe("accountNotFound");
	});

	it("does not try to save progress for a record that no longer exists", async () => {
		const { db, fetchMock } = fakeApi();
		await useAuth().signIn(newcomer.email, DEMO_PASSWORD);
		db.users = db.users.filter((user) => user.id !== newcomer.id);
		useProgressStore().addXp(50);

		mountSync();
		await flushPromises();

		const patches = fetchMock.mock.calls.filter(
			([, init]) => init?.method === "PATCH",
		);
		expect(patches).toHaveLength(0);
	});
});
