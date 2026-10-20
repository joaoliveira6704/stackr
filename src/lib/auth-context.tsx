import { createContext, type ReactNode, useContext, useState } from "react";
import {
	getSession,
	type SessionUser,
	signIn as signInRequest,
	signOut as signOutRequest,
	signUp as signUpRequest,
} from "./auth";

export interface SignUpInput {
	name: string;
	email: string;
	password: string;
}

interface AuthContextValue {
	user: SessionUser | null;
	signIn: (email: string, password: string) => Promise<SessionUser>;
	signUp: (input: SignUpInput) => Promise<SessionUser>;
	signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<SessionUser | null>(() => getSession());

	async function signIn(email: string, password: string) {
		const session = await signInRequest(email, password);
		setUser(session);
		return session;
	}

	async function signUp(input: SignUpInput) {
		const session = await signUpRequest(input);
		setUser(session);
		return session;
	}

	function signOut() {
		signOutRequest();
		setUser(null);
	}

	return (
		<AuthContext.Provider value={{ user, signIn, signUp, signOut }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth(): AuthContextValue {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within <AuthProvider>.");
	}
	return context;
}
