import { TanStackDevtools } from "@tanstack/react-devtools";
import {
	createRootRoute,
	Link,
	Outlet,
	useRouter,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import { AuthProvider, useAuth } from "../lib/auth-context";
import "../styles.css";

export const Route = createRootRoute({
	component: RootComponent,
});

function RootComponent() {
	return (
		<AuthProvider>
			<AppShell />
		</AuthProvider>
	);
}

function AppShell() {
	const { user, signOut } = useAuth();
	const router = useRouter();

	function handleSignOut() {
		signOut();
		void router.navigate({ href: "/" });
	}

	return (
		<>
			<header className="flex items-center justify-between border-b border-neutral-200 px-8 py-4">
				<Link to="/" className="text-lg font-bold">
					Stackr
				</Link>
				<nav className="flex items-center gap-4 text-sm">
					{user ? (
						<>
							<Link to="/dashboard">Dashboard</Link>
							<span className="text-neutral-500">{user.name}</span>
							<button
								type="button"
								onClick={handleSignOut}
								className="rounded border border-neutral-300 px-3 py-1 hover:bg-neutral-100"
							>
								Logout
							</button>
						</>
					) : (
						<>
							<Link to="/login">Login</Link>
							<Link
								to="/signup"
								className="rounded bg-neutral-900 px-3 py-1 text-white hover:bg-neutral-700"
							>
								Sign Up
							</Link>
						</>
					)}
				</nav>
			</header>
			<main className="mx-auto w-full max-w-4xl px-8 py-8">
				<Outlet />
			</main>
			<TanStackDevtools
				config={{
					position: "bottom-right",
				}}
				plugins={[
					{
						name: "TanStack Router",
						render: <TanStackRouterDevtoolsPanel />,
					},
				]}
			/>
		</>
	);
}
