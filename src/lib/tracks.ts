export const TRACKS = ["foundation", "strategist", "arena"] as const;
export type Track = (typeof TRACKS)[number];

export function isTrack(value: unknown): value is Track {
	return TRACKS.includes(value as Track);
}
