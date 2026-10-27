// Only internal paths are allowed, so a crafted ?redirect= link cannot send
// the user to another site after login. "//host" is protocol relative.
export function safeRedirect(target: unknown): string {
	if (
		typeof target === "string" &&
		target.startsWith("/") &&
		!target.startsWith("//")
	) {
		return target;
	}
	return "/";
}
