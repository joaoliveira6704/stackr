import {
	ArrowRight,
	BookOpen,
	CircleCheck,
	Clock,
	Coins,
	Flame,
	Globe,
	House,
	LayoutDashboard,
	LogOut,
	type LucideIcon,
	Mail,
	Moon,
	ShieldCheck,
	SlidersHorizontal,
	Sparkles,
	Sprout,
	Sun,
	Target,
	TrendingUp,
	TriangleAlert,
	Trophy,
	User,
} from "lucide-vue-next";
import type { Track } from "../lib/tracks";

// Our own names for the Lucide icons the app uses. Components ask for an
// icon by what it means here, so swapping the picture is a one line change.
export const ICONS = {
	alert: TriangleAlert,
	arrowRight: ArrowRight,
	book: BookOpen,
	clock: Clock,
	dashboard: LayoutDashboard,
	flame: Flame,
	globe: Globe,
	home: House,
	logout: LogOut,
	mail: Mail,
	moon: Moon,
	quiz: CircleCheck,
	shield: ShieldCheck,
	sliders: SlidersHorizontal,
	sparkle: Sparkles,
	sprout: Sprout,
	stacks: Coins,
	sun: Sun,
	target: Target,
	trendingUp: TrendingUp,
	trophy: Trophy,
	user: User,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

export const TRACK_ICONS: Record<Track, IconName> = {
	foundation: "sprout",
	strategist: "trendingUp",
	arena: "shield",
};
