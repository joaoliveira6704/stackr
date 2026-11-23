import type { ProgressSnapshot } from "../stores/progress";
import { getJsonOrNull, sendJson } from "./api";

/**
 * Progress is saved on the user's own record in db.json. A separate
 * collection would need a ?userId= lookup, and json-server turns a text id
 * like "1" into a number there, so the record is never found again.
 */
interface UserWithProgress {
	progress?: ProgressSnapshot;
}

const userPath = (userId: string) => `/users/${encodeURIComponent(userId)}`;

export async function fetchProgress(
	userId: string,
): Promise<ProgressSnapshot | null> {
	const user = await getJsonOrNull<UserWithProgress>(userPath(userId));
	return user?.progress ?? null;
}

export async function saveProgress(
	userId: string,
	progress: ProgressSnapshot,
): Promise<void> {
	await sendJson(userPath(userId), "PATCH", { progress });
}
