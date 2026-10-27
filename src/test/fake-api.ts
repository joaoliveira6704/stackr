import bcrypt from "bcryptjs";
import { vi } from "vitest";
import type { User } from "../lib/auth";

export const DEMO_PASSWORD = "123456";

// A low cost factor keeps the tests fast; the app itself uses 10 rounds.
export const demoUser: User = {
	id: "1",
	name: "João Oliveira",
	email: "joao@example.com",
	password: bcrypt.hashSync(DEMO_PASSWORD, 4),
};

export function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

// Stands in for json-server: GET /users?email= filters the given users and
// POST /users echoes the new user back with an id.
export function fakeUsersApi(users: User[] = [demoUser]) {
	const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
		if (init?.method === "POST") {
			const body = JSON.parse(String(init.body)) as Omit<User, "id">;
			return jsonResponse({ id: "2", ...body }, 201);
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
