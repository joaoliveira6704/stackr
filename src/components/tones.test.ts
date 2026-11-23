import { describe, expect, it } from "vitest";
import { paymentColours } from "./tones";

const atShare = (share: number) => paymentColours({ share, state: "left" }).bar;

describe("paymentColours", () => {
	it("starts red when nothing is paid", () => {
		expect(atShare(0)).toBe(
			"color-mix(in oklab, var(--color-tangerine) 0%, var(--color-cherry))",
		);
	});

	it("is fully orange at 10%", () => {
		expect(atShare(0.1)).toBe(
			"color-mix(in oklab, var(--color-sun) 0%, var(--color-tangerine))",
		);
	});

	it("moves gradually from orange to yellow", () => {
		expect(atShare(0.525)).toBe(
			"color-mix(in oklab, var(--color-sun) 50%, var(--color-tangerine))",
		);
	});

	it("is not green just below 95%", () => {
		expect(atShare(0.9499)).toContain("var(--color-sun) 100%");
	});

	it("turns green from 95%", () => {
		expect(atShare(0.95)).toBe("var(--color-brand)");
	});

	it("is green when the bill is fully paid", () => {
		expect(paymentColours({ share: 1, state: "paidOff" }).bar).toBe(
			"var(--color-brand)",
		);
	});

	it("is red when more than the plan was paid", () => {
		expect(paymentColours({ share: 1.2, state: "over" }).bar).toBe(
			"var(--color-cherry)",
		);
	});

	it("stays neutral when nothing is planned", () => {
		expect(paymentColours({ share: 0, state: "unplanned" }).bar).toBe(
			"var(--color-ink-muted)",
		);
	});

	it("uses the readable strong shade for the text", () => {
		expect(paymentColours({ share: 1, state: "paidOff" }).text).toBe(
			"var(--color-brand-strong)",
		);
	});
});
