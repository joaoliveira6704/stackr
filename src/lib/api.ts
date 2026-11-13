import { AppError } from "./errors";

// The dev server forwards /api to json-server, see vite.config.ts.
const API_BASE = "/api";

export const JSON_HEADERS = { "Content-Type": "application/json" };

export async function requestApi(
	path: string,
	init?: RequestInit,
): Promise<Response> {
	try {
		return await fetch(`${API_BASE}${path}`, init);
	} catch {
		throw new AppError("apiUnreachable");
	}
}

/** Reads JSON from the API, or null when the record does not exist. */
export async function getJsonOrNull<T>(path: string): Promise<T | null> {
	const res = await requestApi(path);
	if (res.status === 404) return null;
	if (!res.ok) throw new AppError("apiFailed");
	return (await res.json()) as T;
}

export async function getJson<T>(path: string): Promise<T> {
	const result = await getJsonOrNull<T>(path);
	if (result === null) throw new AppError("contentNotFound");
	return result;
}

export async function sendJson<T>(
	path: string,
	method: "POST" | "PUT" | "PATCH",
	body: unknown,
): Promise<T> {
	const res = await requestApi(path, {
		method,
		headers: JSON_HEADERS,
		body: JSON.stringify(body),
	});
	if (!res.ok) throw new AppError("apiFailed");
	return (await res.json()) as T;
}
