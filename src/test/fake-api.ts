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

interface FakeData {
	users: User[];
	tracks: unknown[];
	lessons: { id: string; trackId: string }[];
	quizzes: { lessonId: string }[];
}

function findById<T extends { id: string }>(items: T[], id?: string) {
	return items.find((item) => item.id === id);
}

// A small in memory stand in for json-server, enough for the routes the app
// uses. Changes made through PATCH are kept, so tests can read them back.
export function fakeApi(data: Partial<FakeData> = {}) {
	const db: FakeData = {
		users: (data.users ?? [demoUser, newcomer]).map((user) => ({ ...user })),
		tracks: data.tracks ?? [],
		lessons: data.lessons ?? [],
		quizzes: data.quizzes ?? [],
	};
	const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
		const { pathname, searchParams } = new URL(url, "http://localhost");
		const [collection, id] = pathname.replace(/^\/api\//, "").split("/");
		const method = init?.method ?? "GET";
		const body = init?.body ? JSON.parse(String(init.body)) : undefined;

		if (collection === "users" && method === "POST") {
			return jsonResponse({ id: "2", ...body }, 201);
		}
		if (collection === "users" && method === "PATCH") {
			const user = findById(db.users, id);
			if (!user) return jsonResponse({}, 404);
			Object.assign(user, body);
			return jsonResponse(user);
		}
		if (collection === "users" && id) {
			const user = findById(db.users, id);
			return user ? jsonResponse(user) : jsonResponse({}, 404);
		}
		if (collection === "users") {
			const email = searchParams.get("email");
			return jsonResponse(db.users.filter((user) => user.email === email));
		}
		if (collection === "tracks") {
			const track = findById(db.tracks as { id: string }[], id);
			return track ? jsonResponse(track) : jsonResponse({}, 404);
		}
		if (collection === "lessons" && id) {
			const lesson = findById(db.lessons, id);
			return lesson ? jsonResponse(lesson) : jsonResponse({}, 404);
		}
		if (collection === "lessons") {
			const trackId = searchParams.get("trackId");
			return jsonResponse(
				db.lessons.filter((lesson) => lesson.trackId === trackId),
			);
		}
		if (collection === "quizzes") {
			const lessonId = searchParams.get("lessonId");
			return jsonResponse(
				db.quizzes.filter((quiz) => quiz.lessonId === lessonId),
			);
		}
		return jsonResponse({}, 404);
	});
	vi.stubGlobal("fetch", fetchMock);
	return { fetchMock, db };
}

// Kept for the auth tests: GET /users?email= filters the given users, POST
// /users echoes the new user back with an id and PATCH /users/:id merges the
// changes into the matching user.
export function fakeUsersApi(users: User[] = [demoUser, newcomer]) {
	return fakeApi({ users }).fetchMock;
}

export function unreachableApi() {
	vi.stubGlobal(
		"fetch",
		vi.fn(async () => {
			throw new TypeError("Failed to fetch");
		}),
	);
}
