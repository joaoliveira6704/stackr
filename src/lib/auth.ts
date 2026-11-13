/**
 * Mock auth against json-server (db/db.json), run via `bun run api`.
 *
 * NOTE (school demo): passwords are hashed in the browser and the session
 * lives in localStorage. Never use this in production.
 */
import bcrypt from "bcryptjs";
import { JSON_HEADERS, requestApi } from "./api";
import { AppError } from "./errors";
import { isTrack, type Track } from "./tracks";

export interface User {
	id: string;
	name: string;
	email: string;
	password: string;
	onboardingDone?: boolean;
	track?: Track | null;
}

export interface SessionUser {
	id: string;
	name: string;
	email: string;
	onboardingDone: boolean;
	track: Track | null;
}

export interface SignUpInput {
	name: string;
	email: string;
	password: string;
}

const SESSION_KEY = "stackr.session";
const SALT_ROUNDS = 10;
async function fetchUsersByEmail(email: string): Promise<User[]> {
	const res = await requestApi(`/users?email=${encodeURIComponent(email)}`);
	if (!res.ok) {
		throw new AppError("apiFailed");
	}
	return (await res.json()) as User[];
}

function storeSession(session: SessionUser): SessionUser {
	localStorage.setItem(SESSION_KEY, JSON.stringify(session));
	return session;
}

function createSession(user: User): SessionUser {
	return storeSession({
		id: String(user.id),
		name: user.name,
		email: user.email,
		onboardingDone: user.onboardingDone === true,
		track: isTrack(user.track) ? user.track : null,
	});
}

export async function signIn(
	email: string,
	password: string,
): Promise<SessionUser> {
	const users = await fetchUsersByEmail(email);
	const user = users.find((candidate) => candidate.email === email);
	if (!user) {
		throw new AppError("invalidCredentials");
	}
	const passwordMatches = await bcrypt.compare(password, user.password);
	if (!passwordMatches) {
		throw new AppError("invalidCredentials");
	}
	return createSession(user);
}

export async function signUp(input: SignUpInput): Promise<SessionUser> {
	const existing = await fetchUsersByEmail(input.email);
	if (existing.length > 0) {
		throw new AppError("emailTaken");
	}
	const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

	const res = await requestApi("/users", {
		method: "POST",
		headers: JSON_HEADERS,
		body: JSON.stringify({
			name: input.name,
			email: input.email,
			password: hashedPassword,
			onboardingDone: false,
			track: null,
		}),
	});
	if (!res.ok) {
		throw new AppError("accountNotCreated");
	}
	const user = (await res.json()) as User;
	return createSession(user);
}

export async function saveOnboarding(track: Track): Promise<SessionUser> {
	const session = getSession();
	if (!session) {
		throw new AppError("notSignedIn");
	}
	const res = await requestApi(`/users/${encodeURIComponent(session.id)}`, {
		method: "PATCH",
		headers: JSON_HEADERS,
		body: JSON.stringify({ onboardingDone: true, track }),
	});
	if (!res.ok) {
		throw new AppError("onboardingNotSaved");
	}
	return storeSession({ ...session, onboardingDone: true, track });
}

export function signOut(): void {
	localStorage.removeItem(SESSION_KEY);
}

function clearBrokenSession(): null {
	localStorage.removeItem(SESSION_KEY);
	return null;
}

export function getSession(): SessionUser | null {
	const raw = localStorage.getItem(SESSION_KEY);
	if (!raw) {
		return null;
	}
	try {
		const parsed = JSON.parse(raw) as Partial<SessionUser>;
		if (
			typeof parsed.id !== "string" ||
			typeof parsed.name !== "string" ||
			typeof parsed.email !== "string"
		) {
			return clearBrokenSession();
		}
		// Sessions saved before onboarding existed lack these fields, so they
		// fall back to "not done yet" instead of being thrown away.
		return {
			id: parsed.id,
			name: parsed.name,
			email: parsed.email,
			onboardingDone: parsed.onboardingDone === true,
			track: isTrack(parsed.track) ? parsed.track : null,
		};
	} catch {
		return clearBrokenSession();
	}
}
