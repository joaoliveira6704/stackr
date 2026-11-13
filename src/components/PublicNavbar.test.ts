import { flushPromises } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { useAuth } from "../lib/use-auth";
import { DEMO_PASSWORD, demoUser, fakeUsersApi } from "../test/fake-api";
import { answerConfirmDialog, mountAt } from "../test/mount";
import PublicNavbar from "./PublicNavbar.vue";

afterEach(() => {
	useAuth().signOut();
	localStorage.clear();
});

async function mountSignedIn(locale: "pt-PT" | "en" = "en") {
	fakeUsersApi();
	await useAuth().signIn(demoUser.email, DEMO_PASSWORD);
	return mountAt("/", PublicNavbar, locale);
}

function logoutButton(
	wrapper: Awaited<ReturnType<typeof mountSignedIn>>["wrapper"],
) {
	const button = wrapper
		.findAll("header button")
		.find((b) => b.text() === "Log out");
	if (!button) throw new Error("No logout button");
	return button;
}

describe("PublicNavbar", () => {
	it("asks before logging out and signs out once confirmed", async () => {
		const { wrapper } = await mountSignedIn();

		await logoutButton(wrapper).trigger("click");
		await flushPromises();
		expect(useAuth().user.value).not.toBeNull();

		await answerConfirmDialog(wrapper, "confirm");

		expect(useAuth().user.value).toBeNull();
	});

	it("keeps the user signed in when they cancel", async () => {
		const { wrapper } = await mountSignedIn();

		await logoutButton(wrapper).trigger("click");
		await flushPromises();
		await answerConfirmDialog(wrapper, "cancel");

		expect(useAuth().user.value).not.toBeNull();
	});

	it("asks in Portuguese", async () => {
		const { wrapper } = await mountSignedIn("pt-PT");

		const button = wrapper
			.findAll("header button")
			.find((b) => b.text() === "Sair");
		await button?.trigger("click");
		await flushPromises();

		expect(wrapper.get('[role="alertdialog"]').text()).toContain(
			"Sair da conta?",
		);
	});
});
