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
	lessons: { id: string; trackId: string | null }[];
	quizzes: { lessonId: string }[];
	oneOffs: unknown[];
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
		oneOffs: data.oneOffs ?? [],
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
		if (collection === "oneOffs") {
			return jsonResponse(db.oneOffs);
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

/**
 * A Yahoo chart answer with one price at the start of every month, growing
 * by the given percent each calendar year from a price of 100.
 */
export function chartBody(
	symbol: string,
	growthByYear: Record<number, number>,
	name = `${symbol} Fund`,
) {
	const timestamps: number[] = [];
	const prices: number[] = [];
	let price = 100;
	for (const [year, percent] of Object.entries(growthByYear)) {
		const monthly = (1 + percent / 100) ** (1 / 12);
		for (let month = 0; month < 12; month++) {
			price *= monthly;
			timestamps.push(Date.UTC(Number(year), month, 1) / 1000);
			prices.push(price);
		}
	}
	return {
		chart: {
			result: [
				{
					meta: { symbol, currency: "EUR", longName: name },
					timestamp: timestamps,
					indicators: { adjclose: [{ adjclose: prices }] },
				},
			],
		},
	};
}

/** A Yahoo chart answer with only the latest price of a ticker. */
export function quoteBody(
	symbol: string,
	price: number,
	currency = "EUR",
	seconds = 1_790_000_000,
) {
	return {
		chart: {
			result: [
				{
					meta: {
						symbol,
						currency,
						regularMarketPrice: price,
						regularMarketTime: seconds,
					},
				},
			],
		},
	};
}

export function searchBody(
	quotes: { symbol: string; longname: string; quoteType: string }[],
) {
	return { quotes: quotes.map((quote) => ({ exchDisp: "XETRA", ...quote })) };
}

interface AppApiOptions {
	portfolio?: unknown;
	budget?: unknown;
	charts?: Record<string, unknown>;
	search?: unknown;
	marketDown?: boolean;
	saveFails?: boolean;
}

/**
 * Stands in for json-server and the Yahoo proxy on the screens inside the
 * app: the user record with its saved portfolio and budget, PATCH to save
 * them, ticker search and price history. Every PATCH body is kept in `saved`
 * for the test to read.
 */
export function fakeAppApi(options: AppApiOptions = {}) {
	const saved: unknown[] = [];
	const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
		if (url.startsWith("/market")) {
			if (options.marketDown) throw new TypeError("Failed to fetch");
			if (url.includes("/finance/search")) {
				return jsonResponse(options.search ?? { quotes: [] });
			}
			const symbol = decodeURIComponent(
				url.split("/chart/")[1]?.split("?")[0] ?? "",
			);
			const chart = options.charts?.[symbol];
			return chart ? jsonResponse(chart) : jsonResponse({}, 404);
		}
		if (init?.method === "PATCH") {
			if (options.saveFails) return jsonResponse({}, 500);
			saved.push(JSON.parse(String(init.body)));
			return jsonResponse({});
		}
		return jsonResponse({
			...demoUser,
			portfolio: options.portfolio,
			budget: options.budget,
		});
	});
	vi.stubGlobal("fetch", fetchMock);
	return { fetchMock, saved };
}

export function unreachableApi() {
	vi.stubGlobal(
		"fetch",
		vi.fn(async () => {
			throw new TypeError("Failed to fetch");
		}),
	);
}
