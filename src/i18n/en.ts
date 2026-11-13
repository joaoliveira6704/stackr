import type { MessageSchema } from "./pt";

export const en: MessageSchema = {
	nav: {
		dashboard: "Dashboard",
		login: "Log in",
		signup: "Sign up",
		logout: "Log out",
		language: "Language",
		home: "Stackr home page",
		darkMode: "Switch to dark mode",
		lightMode: "Switch to light mode",
		profile: "Profile",
		preferences: "Preferences",
		mainNavigation: "Main navigation",
		otherLanguage: "Português",
		switchLanguage: "Switch the language to Portuguese",
	},
	footer: {
		tagline: "Financial literacy for everyone.",
		disclaimer: "Stackr is a learning tool and does not give financial advice.",
	},
	notFound: {
		eyebrow: "Error 404",
		title: "This page got lost along the way.",
		detail:
			"The address may be wrong or the page no longer exists. Head back home and keep learning.",
		goHome: "Back to home",
		imageAlt: "Illustration of a 404 with mountains and a plant",
	},
	common: {
		email: "Email",
		password: "Password",
		back: "Back",
		next: "Next",
		comingSoon: "Coming soon",
	},
	errors: {
		invalidCredentials: "Invalid email or password.",
		apiUnreachable:
			"Could not reach the API. Make sure json-server is running (bun run api).",
		apiFailed: "The API request failed. Please try again.",
		emailTaken: "An account with this email already exists.",
		accountNotCreated: "Could not create the account.",
		onboardingNotSaved: "Could not save your track. Please try again.",
		notSignedIn: "Your session has ended. Please log in again.",
		passwordsDoNotMatch: "Passwords do not match.",
		unknown: "Something went wrong.",
	},
	levels: {
		beginner: "Beginner",
		apprentice: "Apprentice",
		saver: "Saver",
		investor: "Investor",
		stackrMaster: "Stackr Master",
	},
	progress: {
		label: "Your progress",
		level: "Level {level}",
		remaining: "{xp} XP to {next}",
		maxLevel: "You reached the top level.",
	},
	stats: {
		xp: "Total XP",
		xpDetail: "Literacy points",
		stacks: "Stacks",
		stacksDetail: "Currency for extra content",
		streak: "Day streak",
		streakDetail: "Study every day to earn a bonus",
		lessons: "Lessons done",
		lessonsDetail: "With 80% or more on the quiz",
	},
	tracks: {
		foundation: {
			name: "Foundation",
			tagline: "For people starting from zero.",
			description:
				"You will learn to build a budget with the 50/30/20 rule and set up an emergency fund before thinking about investing.",
			reason:
				"Some basic ideas still need to settle, so we start with the essentials, using short lessons and plenty of examples.",
		},
		strategist: {
			name: "Strategist",
			tagline: "For people who want to invest for the long term.",
			description:
				"You will understand compound interest, ETFs, diversification and how inflation and taxes affect your real return.",
			reason:
				"You already know the basics and prefer careful decisions, so we go straight to a long term investing plan.",
		},
		arena: {
			name: "Arena",
			tagline: "For risk lovers who want to control it.",
			description:
				"You will learn to tell volatility from permanent loss, spot scams and never invest more than you can afford to lose.",
			reason:
				"You enjoy taking risks, so your focus will be managing them well, with quick challenges and instant feedback.",
		},
	},
	home: {
		eyebrow: "Financial literacy, one step at a time",
		title: "Learn to handle your money without the stress.",
		subtitle:
			"Two minute lessons, a quiz right after and real life cases. You earn XP, level up and collect Stacks while you learn.",
		start: "Get started",
		login: "I already have an account",
		goToDashboard: "Go to dashboard",
		heroImageAlt:
			"Illustration of two people climbing a bar chart surrounded by coins",
		facts: {
			tracks: { value: "3", label: "tracks shaped around you" },
			lesson: { value: "2 min", label: "per lesson, at most" },
			pass: { value: "80%", label: "to move up a level" },
		},
		ruleImageAlt:
			"Illustration of a person looking at a shopping cart and rising prices",
		ctaImageAlt: "Illustration of a green wallet full of notes",
		preview: {
			nextLesson: "Next lesson",
			nextLessonTitle: "Your emergency fund",
			nextLessonDetail: "2 min, five question quiz",
		},
		tracksTitle: "Three tracks, the right starting point",
		tracksSubtitle:
			"A six question onboarding picks the track that makes sense for you.",
		howTitle: "How it works",
		howSubtitle:
			"Five to ten minute sessions, with the next step always in view.",
		steps: {
			lesson: {
				title: "Short lesson",
				detail: "Plain words and everyday examples, like your first paycheck.",
			},
			quiz: {
				title: "Five question quiz",
				detail: "Instant feedback with a short explanation for every answer.",
			},
			reward: {
				title: "Reward",
				detail: "XP, Stacks and badges for every step you take.",
			},
		},
		rule: {
			eyebrow: "The 80% rule",
			title: "You only move on once you have it down.",
			detail:
				"Score 80% or more and the next lesson unlocks. Below that you go back to the lesson, with the parts you missed highlighted, and try again.",
		},
		ctaTitle: "Ready to start?",
		ctaSubtitle: "Finding your track takes less than a minute.",
	},
	login: {
		title: "Log in",
		subtitle: "Good to see you again. Pick up where you left off.",
		submit: "Log in",
		pending: "Logging in...",
		noAccount: "Don't have an account?",
		demo: "Demo account: joao{'@'}example.com / 123456",
		panelTitle: "Your streak is waiting for you.",
		panelImageAlt: "Illustration of a green wallet full of notes",
		panelDetail:
			"One lesson a day is enough to keep your streak going and earn bonus XP.",
	},
	signup: {
		title: "Sign up",
		subtitle: "It takes less than a minute.",
		name: "Name",
		confirmPassword: "Confirm password",
		submit: "Sign up",
		pending: "Creating account...",
		haveAccount: "Already have an account?",
		panelTitle: "Start with 50 XP.",
		panelImageAlt:
			"Illustration of two people climbing a bar chart surrounded by coins",
		panelDetail:
			"After signing up you answer six quick questions and find the right track for you.",
	},
	dashboard: {
		greeting: "Hi, {name}",
		subtitle: "Here is how you are doing.",
		currentLevel: "Current level",
		statsTitle: "Your statistics",
	},
	profile: {
		title: "Profile",
		subtitle: "Your account, your track and your progress.",
		account: "Account",
		name: "Name",
		track: "Your track",
		noTrack: "Not chosen yet",
		changeTrack: "Retake the quiz",
		nextStep: "Next step",
		nextStepTitle: "Your first lesson is on its way",
		nextStepDetail: "We are getting the lessons for your track ready.",
	},
	onboarding: {
		intro: {
			eyebrow: "Welcome to Stackr",
			title: "Let's find your starting point.",
			subtitle:
				"Three questions about what you already know and three about how you handle risk. There are no wrong answers.",
			start: "Start",
			questions: "6 questions",
			duration: "Less than a minute",
			reward: "+50 XP at the end",
		},
		progress: "Question {current} of {total}",
		knowledge: "Knowledge",
		risk: "Risk",
		seeResult: "See result",
		saving: "Saving...",
		result: {
			eyebrow: "Your track",
			why: "Why this track",
			whatYouLearn: "What you will learn",
			reward: "Reward",
			rewardDetail: "For finishing the onboarding",
			xp: "+{amount} XP",
			continue: "Go to my dashboard",
			retake: "Retake the quiz",
		},
		questions: {
			budgetRule: {
				prompt: "What does the 50/30/20 rule split?",
				options: {
					needsWantsSavings: "Needs, wants and savings",
					taxesRentFood: "Taxes, rent and food",
					stocksBondsCash: "Stocks, bonds and cash",
					notSure: "I'm not sure",
				},
			},
			inflation: {
				prompt:
					"Your savings earn 1% a year and inflation is at 3%. What happens to your buying power?",
				options: {
					grows: "It grows",
					staysTheSame: "It stays the same",
					shrinks: "It shrinks",
					notSure: "I'm not sure",
				},
			},
			etf: {
				prompt: "What is an ETF?",
				options: {
					singleShare: "A share in a single company",
					basketFund:
						"A fund holding many assets, traded on the stock market like a share",
					savingsAccount: "A savings account with a fixed rate",
					notSure: "I'm not sure",
				},
			},
			marketDrop: {
				prompt: "Your investment drops 20% in a month. What do you do?",
				options: {
					sellEverything: "Sell everything so I don't lose more",
					wait: "Wait and leave it alone",
					buyMore: "Buy more while it's cheap",
				},
			},
			betChoice: {
				prompt: "Which of these would you pick?",
				options: {
					sureAmount: "Get 100 € for sure",
					coinFlip: "A 50% chance of getting 250 €",
					longShot: "A 10% chance of getting 2000 €",
				},
			},
			hotTip: {
				prompt:
					"A friend swears a new crypto coin will be worth ten times more this month. What do you do?",
				options: {
					ignore: "Ignore it, it sounds too good to be true",
					research: "Research first and maybe put in a little",
					buyNow: "Buy right away before it goes up",
				},
			},
		},
	},
};
