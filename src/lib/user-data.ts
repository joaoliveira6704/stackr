import { JSON_HEADERS, requestApi } from "./api";
import { getSession } from "./auth";
import { AppError, type ErrorCode } from "./errors";

// Plans such as the portfolio and the budget are saved as fields on the
// signed in user's record in db.json.

function sessionUserPath(): string {
	const session = getSession();
	if (!session) {
		throw new AppError("notSignedIn");
	}
	return `/users/${encodeURIComponent(session.id)}`;
}

/** The raw saved value, undefined when the user never saved one. */
export async function loadUserField(
	field: string,
	failure: ErrorCode,
): Promise<unknown> {
	const response = await requestApi(sessionUserPath());
	if (!response.ok) {
		throw new AppError(failure);
	}
	const user = (await response.json()) as Record<string, unknown>;
	return user[field];
}

export async function saveUserField(
	field: string,
	value: unknown,
	failure: ErrorCode,
): Promise<void> {
	const response = await requestApi(sessionUserPath(), {
		method: "PATCH",
		headers: JSON_HEADERS,
		body: JSON.stringify({ [field]: value }),
	});
	if (!response.ok) {
		throw new AppError(failure);
	}
}

export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

export function numberOr(value: unknown, fallback: number): number {
	return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
