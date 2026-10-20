import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useAuth } from "../../lib/auth-context";

export const Route = createFileRoute("/_authenticated/dashboard")({
	component: Dashboard,
});

function Dashboard() {
	const { user, signOut } = useAuth();
	const router = useRouter();

	function handleSignOut() {
		signOut();
		void router.navigate({ href: "/" });
	}

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-3xl font-bold">Dashboard</h1>
			</div>

			<div className="rounded border border-neutral-200 p-4">
				<h2 className="font-semibold">Current Session</h2>
				<dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
					<dt className="text-neutral-500">Name</dt>
					<dd>{user?.name ?? "—"}</dd>
					<dt className="text-neutral-500">Email</dt>
					<dd>{user?.email ?? "—"}</dd>
					<dt className="text-neutral-500">ID</dt>
					<dd>{user?.id ?? "—"}</dd>
				</dl>
			</div>

			<div className="flex items-center gap-4">
				<button
					type="button"
					onClick={handleSignOut}
					className="rounded border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-100"
				>
					Logout
				</button>
				<Link to="/" className="text-sm underline text-neutral-500">
					Back
				</Link>
			</div>
		</div>
	);
}
