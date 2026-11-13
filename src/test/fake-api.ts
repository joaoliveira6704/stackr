import bcrypt from "bcryptjs";
import { vi } from "vitest";
import type { SessionUser, User } from "../lib/auth";

export const DEMO_PASSWORD = "123456";

// A low cost factor keeps the tests fast; the app itself uses 10 rounds.
export const demoUser: User = {
	id: "1",
	name: "João Oliveira",
	email: "joao@example.com",
	password: bcrypt.hashSync(DEMO_PASSWORD, 4),
	onboardingDone: true,
	track: "foundation",
};

export const newcomer: User = {
	id: "3",
	name: "Miguel Neto",
	email: "miguel@example.com",
	password: bcrypt.hashSync(DEMO_PASSWORD, 4),
	onboardingDone: false,
	track: null,
};

const SESSION_KEY = "stackr.session";

export function storeSessionFor(user: User): void {
	const session: SessionUser = {
		id: user.id,
		name: user.name,
		email: user.email,
		onboardingDone: user.onboardingDone === true,
		track: user.track ?? null,
	};
	localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

// Stands in for json-server: GET /users?email= filters the given users,
// POST /users echoes the new user back with an id and PATCH /users/:id
// merges the changes into the matching user.
export function fakeUsersApi(users: User[] = [demoUser, newcomer]) {
	const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
		if (init?.method === "POST") {
			const body = JSON.parse(String(init.body)) as Omit<User, "id">;
			return jsonResponse({ id: "2", ...body }, 201);
		}
		if (init?.method === "PATCH") {
			const id = url.split("/").pop();
			const user = users.find((candidate) => candidate.id === id);
			if (!user) return jsonResponse({}, 404);
			return jsonResponse({ ...user, ...JSON.parse(String(init.body)) });
		}
		const email = new URL(url, "http://localhost").searchParams.get("email");
		return jsonResponse(users.filter((user) => user.email === email));
	});
	vi.stubGlobal("fetch", fetchMock);
	return fetchMock;
}

export function unreachableApi() {
	vi.stubGlobal(
		"fetch",
		vi.fn(async () => {
			throw new TypeError("Failed to fetch");
		}),
	);
}
