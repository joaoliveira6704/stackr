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
		darkModeSwitch: "Dark mode",
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
		cancel: "Cancel",
	},
	logoutConfirm: {
		title: "Log out?",
		message: "You will need to log in again to keep learning.",
		confirm: "Log out",
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
		explanation: {
			title: "Detailed explanation",
			showHint: "For when you want to know more",
			hideHint: "Press again to hide it",
			reveal: "Show explanation",
		},
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
				explanation:
					"The 50/30/20 rule is a simple way to split what you earn each month. About 50% goes to needs, like rent, bills and food. Up to 30% is for wants, like dinners out or subscriptions. At least 20% goes to savings or to paying off debt. It is not a law, just a starting point you can adjust to your life.",
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
				explanation:
					"Inflation measures how fast prices go up over time. If your savings earn 1% and prices rise 3%, your money grows more slowly than the cost of things. After a year you have more euros, but they buy less, so your buying power shrinks. That is why it pays to look for ways to make your money grow faster than inflation.",
				options: {
					grows: "It grows",
					staysTheSame: "It stays the same",
					shrinks: "It shrinks",
					notSure: "I'm not sure",
				},
			},
			etf: {
				prompt: "What is an ETF?",
				explanation:
					"ETF stands for Exchange Traded Fund. It bundles dozens or hundreds of assets, like shares or bonds, into one product that you buy and sell just like a normal share. With a single purchase your money is spread across many companies, so you do not depend on any one of them doing well. Many ETFs follow a whole index and have low fees.",
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
				explanation:
					"Drops of 20% happen in markets more often than you might think, and in the past they have recovered, although nothing guarantees it. Selling in a panic turns a loss on paper into a real one. Waiting shows patience, and buying more can lower your average price, but only with money you will not need any time soon. There is no right answer, only the one that fits you.",
				options: {
					sellEverything: "Sell everything so I don't lose more",
					wait: "Wait and leave it alone",
					buyMore: "Buy more while it's cheap",
				},
			},
			betChoice: {
				prompt: "Which of these would you pick?",
				explanation:
					"This question weighs certainty against risk. On average, the sure 100 € is worth 100 €, the coin flip is worth 125 € and the long shot is worth 200 €. Even so, many people prefer the sure amount, because losing hurts more than winning feels good. Seeing how you react to this choice helps you know how much risk you can take without losing sleep.",
				options: {
					sureAmount: "Get 100 € for sure",
					coinFlip: "A 50% chance of getting 250 €",
					longShot: "A 10% chance of getting 2000 €",
				},
			},
			hotTip: {
				prompt:
					"A friend swears a new crypto coin will be worth ten times more this month. What do you do?",
				explanation:
					"Promises of huge gains in a short time are one of the most common signs of scams and bubbles. New crypto coins can shoot up, but they can also lose almost all their value overnight. Before you invest, ask who gains from the tip, research the project and never put in more than you are ready to lose.",
				options: {
					ignore: "Ignore it, it sounds too good to be true",
					research: "Research first and maybe put in a little",
					buyNow: "Buy right away before it goes up",
				},
			},
		},
	},
};
