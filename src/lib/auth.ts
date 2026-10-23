/**
 * Mock auth against json-server (db/db.json), run via `bun run api`.
 *
 * NOTE (school demo): plaintext passwords and a localStorage session.
 * Never use this in production.
 */
import bcrypt from 'bcryptjs';

export interface User {
	id: string;
	name: string;
	email: string;
	password: string;
}

export interface SessionUser {
	id: string;
	name: string;
	email: string;
}

const API_BASE = "/api";
const SESSION_KEY = "stackr.session";

async function fetchUsersByEmail(email: string): Promise<User[]> {
	let res: Response;
	try {
		res = await fetch(`${API_BASE}/users?email=${encodeURIComponent(email)}`);
	} catch {
		throw new Error(
			"Could not reach the API. Make sure json-server is running (bun run api).",
		);
	}
	if (!res.ok) {
		throw new Error("API request failed.");
	}
	return (await res.json()) as User[];
}

function createSession(user: User): SessionUser {
	const session: SessionUser = {
		id: String(user.id),
		name: user.name,
		email: user.email,
	};
	localStorage.setItem(SESSION_KEY, JSON.stringify(session));
	return session;
}

export async function signIn(
	email: string,
	password: string,
): Promise<SessionUser> {
  const users = await fetchUsersByEmail(email);
  const user = users.find(candidate => candidate.email === email)
	if (!user) {
		throw new Error("Invalid email or password.");
  }
  const match = await bcrypt.compare(password, user.password)
  if (!match) {
    throw new Error("Invalid email or password.");
	}
	return createSession(user);
}

export async function signUp(input: {
	name: string;
	email: string;
	password: string;
}): Promise<SessionUser> {
	const existing = await fetchUsersByEmail(input.email);
	if (existing.length > 0) {
		throw new Error("Error creating account");
	}
	const saltRounds = 10;
		const hashedPassword: string = await bcrypt.hash(input.password, saltRounds);

	let res: Response;
	try {
		res = await fetch(`${API_BASE}/users`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				name: input.name,
				email: input.email,
				password: hashedPassword,
			}),
		});
	} catch {
		throw new Error(
			"Could not reach the API. Make sure json-server is running (bun run api).",
		);
	}
	if (!res.ok) {
		throw new Error("Could not create the account.");
	}
	const user = (await res.json()) as User;
	return createSession(user);
}

export function signOut(): void {
	localStorage.removeItem(SESSION_KEY);
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
			localStorage.removeItem(SESSION_KEY);
			return null;
		}
		return { id: parsed.id, name: parsed.name, email: parsed.email };
	} catch {
		localStorage.removeItem(SESSION_KEY);
		return null;
	}
}
