import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { useAuth } from "../lib/auth-context";

export const Route = createFileRoute("/signup")({
	component: Signup,
});

function Signup() {
	const { signUp } = useAuth();
	const router = useRouter();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);
		if (password !== confirmPassword) {
			setError("Passwords do not match.");
			return;
		}
		setPending(true);
		try {
			await signUp({ name, email, password });
			await router.navigate({ href: "/dashboard" });
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
			<h1 className="text-2xl font-bold">Sign Up</h1>
			<form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
				<label className="flex flex-col gap-1 text-sm">
					Name
					<input
						type="text"
						required
						autoComplete="name"
						value={name}
						onChange={(event) => setName(event.target.value)}
						className="rounded border border-neutral-300 px-3 py-2"
					/>
				</label>
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
						autoComplete="new-password"
						value={password}
						onChange={(event) => setPassword(event.target.value)}
						className="rounded border border-neutral-300 px-3 py-2"
					/>
				</label>
				<label className="flex flex-col gap-1 text-sm">
					Confirm password
					<input
						type="password"
						required
						autoComplete="new-password"
						value={confirmPassword}
						onChange={(event) => setConfirmPassword(event.target.value)}
						className="rounded border border-neutral-300 px-3 py-2"
					/>
				</label>
				{error && <p className="text-sm text-red-600">{error}</p>}
				<button
					type="submit"
					disabled={pending}
					className="rounded bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-700 disabled:opacity-50"
				>
					{pending ? "Creating account..." : "Sign Up"}
				</button>
			</form>
			<p className="mt-4 text-sm text-neutral-500">
				Already have an account?{" "}
				<Link to="/login" className="underline">
					Login
				</Link>
			</p>
		</div>
	);
}
