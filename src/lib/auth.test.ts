import bcrypt from "bcryptjs";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	DEMO_PASSWORD,
	demoUser,
	fakeUsersApi,
	jsonResponse,
	unreachableApi,
} from "../test/fake-api";
import { getSession, signIn, signOut, signUp } from "./auth";

const SESSION_KEY = "stackr.session";

afterEach(() => {
	localStorage.clear();
	vi.unstubAllGlobals();
});

describe("signIn", () => {
	it("returns the user without the password and stores the session", async () => {
		fakeUsersApi();

		const session = await signIn(demoUser.email, DEMO_PASSWORD);

		expect(session).toEqual({
			id: "1",
			name: demoUser.name,
			email: demoUser.email,
		});
		expect(getSession()).toEqual(session);
	});

	it("rejects an email that does not exist", async () => {
		fakeUsersApi();

		await expect(signIn("nobody@example.com", DEMO_PASSWORD)).rejects.toThrow(
			"Invalid email or password.",
		);
		expect(getSession()).toBeNull();
	});

	it("rejects a wrong password with the same message as a wrong email", async () => {
		fakeUsersApi();

		await expect(signIn(demoUser.email, "wrong")).rejects.toThrow(
			"Invalid email or password.",
		);
	});

	it("tells the user to start json-server when the API is down", async () => {
		unreachableApi();

		await expect(signIn(demoUser.email, DEMO_PASSWORD)).rejects.toThrow(
			"Could not reach the API",
		);
	});

	it("fails clearly when the API answers with an error", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => jsonResponse({}, 500)),
		);

		await expect(signIn(demoUser.email, DEMO_PASSWORD)).rejects.toThrow(
			"API request failed.",
		);
	});
});

describe("signUp", () => {
	const newUser = {
		name: "Maria Silva",
		email: "maria@example.com",
		password: "segredo",
	};

	it("creates the account and signs the new user in", async () => {
		fakeUsersApi();

		const session = await signUp(newUser);

		expect(session).toEqual({
			id: "2",
			name: newUser.name,
			email: newUser.email,
		});
		expect(getSession()).toEqual(session);
	});

	it("stores a bcrypt hash instead of the plain password", async () => {
		const fetchMock = fakeUsersApi();

		await signUp(newUser);

		const postInit = fetchMock.mock.calls[1][1] as RequestInit;
		const sent = JSON.parse(String(postInit.body));
		expect(sent.password).not.toBe(newUser.password);
		expect(await bcrypt.compare(newUser.password, sent.password)).toBe(true);
	});

	it("refuses an email that is already taken", async () => {
		const fetchMock = fakeUsersApi();

		await expect(signUp({ ...newUser, email: demoUser.email })).rejects.toThrow(
			"Error creating account",
		);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("fails clearly when the account cannot be saved", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async (_url: string, init?: RequestInit) =>
				init?.method === "POST" ? jsonResponse({}, 500) : jsonResponse([]),
			),
		);

		await expect(signUp(newUser)).rejects.toThrow(
			"Could not create the account.",
		);
		expect(getSession()).toBeNull();
	});
});

describe("getSession", () => {
	it("returns null when nobody is signed in", () => {
		expect(getSession()).toBeNull();
	});

	it("clears a session that is not valid JSON", () => {
		localStorage.setItem(SESSION_KEY, "{not json");

		expect(getSession()).toBeNull();
		expect(localStorage.getItem(SESSION_KEY)).toBeNull();
	});

	it("clears a session that is missing fields", () => {
		localStorage.setItem(SESSION_KEY, JSON.stringify({ id: "1" }));

		expect(getSession()).toBeNull();
		expect(localStorage.getItem(SESSION_KEY)).toBeNull();
	});
});

describe("signOut", () => {
	it("removes the stored session", async () => {
		fakeUsersApi();
		await signIn(demoUser.email, DEMO_PASSWORD);

		signOut();

		expect(getSession()).toBeNull();
	});
});
