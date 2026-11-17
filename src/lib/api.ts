import { AppError } from "./errors";

/** json-server, reached through the Vite proxy (see vite.config.ts). */
export const API_BASE = "/api";
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
