import { readonly, ref } from "vue";
import {
	getSession,
	type SessionUser,
	type SignUpInput,
	signIn as signInRequest,
	signOut as signOutRequest,
	signUp as signUpRequest,
} from "./auth";

// Kept at module level so every component shares the same signed in user.
const currentUser = ref<SessionUser | null>(getSession());

async function signIn(email: string, password: string): Promise<SessionUser> {
	const session = await signInRequest(email, password);
	currentUser.value = session;
	return session;
}

async function signUp(input: SignUpInput): Promise<SessionUser> {
	const session = await signUpRequest(input);
	currentUser.value = session;
	return session;
}

function signOut(): void {
	signOutRequest();
	currentUser.value = null;
}

export function useAuth() {
	return { user: readonly(currentUser), signIn, signUp, signOut };
}
