import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({ component: Home });

interface User {
	id: string | number;
	name: string;
}

type Status = "loading" | "ready" | "error";

function Home() {
	const [users, setUsers] = useState<User[]>([]);
	const [status, setStatus] = useState<Status>("loading");

	useEffect(() => {
		let cancelled = false;

		fetch("/api/users")
			.then((res) => {
				if (!res.ok) throw new Error("Unexpected API response");
				return res.json();
			})
			.then((data: User[]) => {
				if (cancelled) return;
				setUsers(data);
				setStatus("ready");
			})
			.catch(() => {
				if (cancelled) return;
				setStatus("error");
			});

		return () => {
			cancelled = true;
		};
	}, []);

	return (
		<div className="flex flex-col gap-6">
			<h1 className="text-3xl font-bold">Stackr Web App</h1>
			<section>
				<h2 className="font-semibold">Users</h2>
				{status === "loading" && (
					<p className="text-sm text-neutral-500">Loading...</p>
				)}
				{status === "error" && (
					<p className="text-sm text-red-600">
						Could not load users. Is json-server running? (bun run api)
					</p>
				)}
				{status === "ready" &&
					users.map((user) => <p key={user.id}>Name: {user.name}</p>)}
			</section>
		</div>
	);
}
