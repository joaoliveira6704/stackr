// Profile pictures are identicons, like the default ones on GitHub: a 5 by 5
// grid of squares, mirrored left to right, drawn from the user's id. The same
// id always gives the same pattern, so it works as a picture that is theirs.

export const IDENTICON_SIZE = 5;

/** A cell is empty, or holds the index of the colour it is painted with. */
export type IdenticonCell = number | null;

// FNV-1a turns the id into a 32 bit number that changes a lot with every
// character, so similar ids still get very different patterns.
function hashText(text: string): number {
	let hash = 0x811c9dc5;
	for (const character of text) {
		hash ^= character.codePointAt(0) ?? 0;
		hash = Math.imul(hash, 0x01000193) >>> 0;
	}
	return hash;
}

// Mulberry32, a tiny seeded random generator, gives each cell its own draw
// from that one number.
function seededRandom(seed: number): () => number {
	let state = seed;
	return () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let value = Math.imul(state ^ (state >>> 15), state | 1);
		value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
		return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
	};
}

/**
 * The cells of the identicon for `seed`, row by row. Each filled cell holds a
 * colour index below `colourCount`, and the right half mirrors the left.
 */
export function identicon(seed: string, colourCount = 1): IdenticonCell[] {
	if (!Number.isInteger(colourCount) || colourCount < 1) {
		throw new Error("An identicon needs at least one colour.");
	}
	const random = seededRandom(hashText(seed));
	const cells = Array.from(
		{ length: IDENTICON_SIZE ** 2 },
		(): IdenticonCell => null,
	);
	const middle = Math.floor(IDENTICON_SIZE / 2);
	for (let row = 0; row < IDENTICON_SIZE; row++) {
		for (let column = 0; column <= middle; column++) {
			const filled = random() < 0.5;
			const colour = Math.floor(random() * colourCount);
			if (!filled) continue;
			cells[row * IDENTICON_SIZE + column] = colour;
			cells[row * IDENTICON_SIZE + (IDENTICON_SIZE - 1 - column)] = colour;
		}
	}
	// A blank square would look like a broken picture, so the centre is filled.
	if (!cells.some((cell) => cell !== null)) {
		cells[middle * IDENTICON_SIZE + middle] = 0;
	}
	return cells;
}
