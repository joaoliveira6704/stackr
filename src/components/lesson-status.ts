import type { LessonStatus } from "../lib/learning";
import type { IconName } from "./icons";
import type { Tone } from "./tones";

export const LESSON_STATUS_LOOK: Record<
	LessonStatus,
	{ icon: IconName; tone: Tone }
> = {
	locked: { icon: "lock", tone: "neutral" },
	available: { icon: "book", tone: "grape" },
	review: { icon: "alert", tone: "tangerine" },
	done: { icon: "check", tone: "brand" },
};
