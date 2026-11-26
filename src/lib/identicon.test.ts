import { describe, expect, it } from "vitest";
import { IDENTICON_SIZE, type IdenticonCell, identicon } from "./identicon";

function rows(cells: IdenticonCell[]): IdenticonCell[][] {
	return Array.from({ length: IDENTICON_SIZE }, (_, row) =>
		cells.slice(row * IDENTICON_SIZE, (row + 1) * IDENTICON_SIZE),
	);
}

const SEEDS = ["1", "2", "vSeDWkrk8q4", "zT4gZflxwYI", "", "ção ✓"];

describe("identicon", () => {
	it("has a 5 by 5 grid of cells", () => {
		expect(identicon("1")).toHaveLength(25);
	});

	it("always draws the same pattern for the same account", () => {
		expect(identicon("zT4gZflxwYI", 2)).toEqual(identicon("zT4gZflxwYI", 2));
	});

	it("draws different patterns for different accounts", () => {
		const patterns = SEEDS.map((seed) => JSON.stringify(identicon(seed)));

		expect(new Set(patterns).size).toBe(SEEDS.length);
	});

	it.each(SEEDS)("mirrors the left half onto the right for %j", (seed) => {
		for (const row of rows(identicon(seed, 3))) {
			expect(row).toEqual([...row].reverse());
		}
	});

	it.each(SEEDS)("never draws an empty square for %j", (seed) => {
		expect(identicon(seed).some((cell) => cell !== null)).toBe(true);
	});

	it("only uses the colours it was given", () => {
		for (const seed of SEEDS) {
			for (const cell of identicon(seed, 2)) {
				if (cell !== null) expect([0, 1]).toContain(cell);
			}
		}
	});

	it("mixes both colours of a two colour style", () => {
		const used = new Set(
			SEEDS.flatMap((seed) => identicon(seed, 2)).filter(
				(cell) => cell !== null,
			),
		);

		expect(used).toEqual(new Set([0, 1]));
	});

	it("refuses to draw without any colour", () => {
		expect(() => identicon("1", 0)).toThrow();
		expect(() => identicon("1", 1.5)).toThrow();
	});
});
