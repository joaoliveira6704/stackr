import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/styles/components.css", "utf-8");

function utility(name: string): string {
	const start = css.indexOf(`@utility ${name} {`);
	if (start === -1) throw new Error(`No utility ${name}`);
	return css.slice(start, css.indexOf("\n}", start));
}

describe("btn-icon", () => {
	// Size classes such as btn-sm set the padding variables too, and Tailwind
	// decides the order of utilities, so btn-icon must not rely on them.
	it("keeps an icon button free of padding whatever size class comes with it", () => {
		expect(utility("btn-icon")).toContain("--btn-icon-padding: 0");
		expect(utility("btn-icon")).not.toContain("--btn-px");
		expect(utility("btn")).toMatch(/padding: var\(--btn-icon-padding,/);
	});
});
