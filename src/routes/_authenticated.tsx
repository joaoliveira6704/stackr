import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getSession } from "../lib/auth";

// Layout for protected routes: any route inside _authenticated/ requires an
// active session, otherwise it redirects to /login with the destination saved.
export const Route = createFileRoute("/_authenticated")({
	beforeLoad: ({ location }) => {
		if (!getSession()) {
			throw redirect({
				to: "/login",
				search: {
					redirect: location.href,
				},
			});
		}
	},
	component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
	return <Outlet />;
}
