import { readonly, ref } from "vue";
import {
	getSession,
	type SessionUser,
	type SignUpInput,
	saveOnboarding as saveOnboardingRequest,
	signIn as signInRequest,
	signOut as signOutRequest,
	signUp as signUpRequest,
} from "./auth";
import type { Track } from "./tracks";

// Kept at module level so every component shares the same signed in user.
const currentUser = ref<SessionUser | null>(getSession());

async function remember(request: Promise<SessionUser>): Promise<SessionUser> {
	const session = await request;
	currentUser.value = session;
	return session;
}

function signIn(email: string, password: string): Promise<SessionUser> {
	return remember(signInRequest(email, password));
}

function signUp(input: SignUpInput): Promise<SessionUser> {
	return remember(signUpRequest(input));
}

function saveOnboarding(track: Track): Promise<SessionUser> {
	return remember(saveOnboardingRequest(track));
}

function signOut(): void {
	signOutRequest();
	currentUser.value = null;
}

export function useAuth() {
	return {
		user: readonly(currentUser),
		signIn,
		signUp,
		saveOnboarding,
		signOut,
	};
}
