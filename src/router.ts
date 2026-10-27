import {
	createRouter,
	createWebHistory,
	type RouteLocationNormalized,
	type RouterHistory,
} from "vue-router";
import { getSession } from "./lib/auth";
import DashboardView from "./views/DashboardView.vue";
import HomeView from "./views/HomeView.vue";
import LoginView from "./views/LoginView.vue";
import SignupView from "./views/SignupView.vue";

declare module "vue-router" {
	interface RouteMeta {
		requiresAuth?: boolean;
	}
}

const routes = [
	{ path: "/", component: HomeView },
	{ path: "/login", component: LoginView },
	{ path: "/signup", component: SignupView },
	{
		path: "/dashboard",
		component: DashboardView,
		meta: { requiresAuth: true },
	},
];

export function requireSession(to: RouteLocationNormalized) {
	if (to.meta.requiresAuth && !getSession()) {
		return { path: "/login", query: { redirect: to.fullPath } };
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
