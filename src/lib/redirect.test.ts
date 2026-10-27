import { describe, expect, it } from "vitest";
import { safeRedirect } from "./redirect";

describe("safeRedirect", () => {
	it("keeps an internal path with its query", () => {
		expect(safeRedirect("/dashboard?tab=cards")).toBe("/dashboard?tab=cards");
	});

	it("falls back to home when there is no target", () => {
		expect(safeRedirect(undefined)).toBe("/");
	});

	it("falls back to home for a full external URL", () => {
		expect(safeRedirect("https://evil.example")).toBe("/");
	});

	it("falls back to home for a protocol relative URL", () => {
		expect(safeRedirect("//evil.example")).toBe("/");
	});

	it("falls back to home when the query param is repeated", () => {
		expect(safeRedirect(["/dashboard", "/other"])).toBe("/");
	});
});
