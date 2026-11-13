import type { MessageSchema } from "../i18n/pt";

export type ErrorCode = keyof MessageSchema["errors"];

// Errors carry a code instead of a sentence so the screen can show the
// message in the user's language.
export class AppError extends Error {
	readonly code: ErrorCode;

	constructor(code: ErrorCode) {
		super(code);
		this.name = "AppError";
		this.code = code;
	}
}

export function errorCode(cause: unknown): ErrorCode {
	return cause instanceof AppError ? cause.code : "unknown";
}
