import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { useAuth } from "../lib/auth-context";

export const Route = createFileRoute("/login")({
	validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
		redirect: typeof search.redirect === "string" ? search.redirect : undefined,
	}),
	component: Login,
});

function Login() {
	const { redirect } = Route.useSearch();
	const { signIn } = useAuth();
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);
		setPending(true);
		try {
			await signIn(email, password);
			// Only accept internal redirects (starting with "/")
			const target = redirect?.startsWith("/") ? redirect : "/";
			await router.navigate({ href: target });
		} catch (cause) {
			setError(
				cause instanceof Error ? cause.message : "Something went wrong.",
			);
		} finally {
			setPending(false);
		}
	}

	return (
		<div className="mx-auto max-w-sm">
			<h1 className="text-2xl font-bold">Login</h1>
			<form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
				<label className="flex flex-col gap-1 text-sm">
					Email
					<input
						type="email"
						required
						autoComplete="email"
						value={email}
						onChange={(event) => setEmail(event.target.value)}
						className="rounded border border-neutral-300 px-3 py-2"
					/>
				</label>
				<label className="flex flex-col gap-1 text-sm">
					Password
					<input
						type="password"
						required
						autoComplete="current-password"
						value={password}
						onChange={(event) => setPassword(event.target.value)}
						className="rounded border border-neutral-300 px-3 py-2"
					/>
				</label>
				{error && <p className="text-sm text-red-600">{error}</p>}
				<button
					type="submit"
					disabled={pending}
					className="rounded bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-700 disabled:opacity-50"
				>
					{pending ? "Logging in..." : "Login"}
				</button>
			</form>
			<p className="mt-4 text-sm text-neutral-500">
				Don't have an account?{" "}
				<Link to="/signup" className="underline">
					Sign Up
				</Link>
			</p>
			<p className="mt-2 text-xs text-neutral-400">
				Demo: joao@example.com / 123456
			</p>
		</div>
	);
}
