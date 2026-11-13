import {
	createRouter,
	createWebHistory,
	type RouteLocationNormalized,
	type RouteRecordRaw,
	type RouterHistory,
} from "vue-router";
import { getSession } from "./lib/auth";
import { ONBOARDING_PATH } from "./lib/onboarding";
import DashboardView from "./views/DashboardView.vue";
import HomeView from "./views/HomeView.vue";
import LearnView from "./views/LearnView.vue";
import LessonView from "./views/LessonView.vue";
import LoginView from "./views/LoginView.vue";
import NotFoundView from "./views/NotFoundView.vue";
import OnboardingView from "./views/OnboardingView.vue";
import ProfileView from "./views/ProfileView.vue";
import QuizView from "./views/QuizView.vue";
import SignupView from "./views/SignupView.vue";

declare module "vue-router" {
	interface RouteMeta {
		requiresAuth?: boolean;
		/** "app" pages get the sidebar, every other page the top navbar. */
		layout?: "app";
	}
}

const routes: RouteRecordRaw[] = [
	{ path: "/", component: HomeView },
	{ path: "/login", component: LoginView },
	{ path: "/signup", component: SignupView },
	{
		path: ONBOARDING_PATH,
		component: OnboardingView,
		meta: { requiresAuth: true },
	},
	{
		path: "/dashboard",
		component: DashboardView,
		meta: { requiresAuth: true, layout: "app" },
	},
	{
		path: "/profile",
		component: ProfileView,
		meta: { requiresAuth: true, layout: "app" },
	},
	{
		path: "/learn",
		component: LearnView,
		meta: { requiresAuth: true, layout: "app" },
	},
	{
		path: "/learn/:lessonId",
		component: LessonView,
		props: true,
		meta: { requiresAuth: true, layout: "app" },
	},
	{
		path: "/learn/:lessonId/quiz",
		component: QuizView,
		props: true,
		meta: { requiresAuth: true, layout: "app" },
	},
	{ path: "/:pathMatch(.*)*", component: NotFoundView },
];

export function requireSession(to: RouteLocationNormalized) {
	if (!to.meta.requiresAuth) return true;
	const session = getSession();
	if (!session) {
		return { path: "/login", query: { redirect: to.fullPath } };
	}
	if (!session.onboardingDone && to.path !== ONBOARDING_PATH) {
		return { path: ONBOARDING_PATH };
	}
	return true;
}

export function createAppRouter(history: RouterHistory = createWebHistory()) {
	const router = createRouter({
		history,
		routes,
		scrollBehavior: () => ({ top: 0 }),
	});
	router.beforeEach(requireSession);
	return router;
}
