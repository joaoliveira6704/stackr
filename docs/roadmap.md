# Stackr roadmap

This document turns the Game Design Document (Group 3, phase A) into the work we still need to build. It follows the order we think makes sense, so each phase only depends on the ones before it. The rules in `AGENTS.md` still apply to every step: English everywhere, the quiet Revolut look, money and reward logic kept in one place, and vitest tests in the same change as the feature.

## Where we are today

The app runs on Vue 3, Vue Router, Vite and Tailwind, with json-server reading `db/db.json` as a mock API. Sign up, login with bcrypt hashed passwords, a session kept in the browser, a route guard for private pages and a bare dashboard already work and have tests. The `users` collection already has an `onBoardingDone` flag on the demo account, but nothing reads it yet. Everything about learning, rewards and tracks is still to be built.

## The product in one paragraph

Stackr is a small gamified finance school for young people. A short onboarding quiz sends each user to one of three tracks: Foundation for people starting from zero, Strategist for people who want to invest for the long term, and Arena for risk lovers who need to learn to control risk. Each track has four modules, each module has three short lessons, a five question quiz after each lesson and a practical case at the end. A quiz score of 80% or more unlocks the next lesson. Below that, the user goes back to the lesson, sees the parts linked to their wrong answers highlighted, and tries again. Every activity earns XP, which drives five levels, and Stacks, a virtual currency the user spends on extra content.

## Phase 0: shared foundations

Before any screen, we need the pieces every feature will lean on.

| Work | Notes |
| --- | --- |
| Add Pinia | The GDD hands off the state as a Pinia store. Install it, register it in `src/main.ts`, and keep `useAuth` as it is for now. |
| Progress store | One store, `src/stores/progress.ts`, holding the state from section 7.2 of the GDD: `track`, `onboardingDone`, `xp`, `level`, `completedLessons`, `quizResults`, `lessonsToReview`, `quizAttempts`, `streak`, `lastActivity`, `badges`, `weeklyXp`, `stacks` and `unlockedContent`. |
| Reward rules module | Pure functions in `src/lib/rewards.ts` for XP amounts, level thresholds, Stacks amounts, the streak bonus and the 80% pass check. The store calls these, it never hard codes numbers. This is where most tests will live. |
| Saving progress | A new `progress` collection in `db/db.json`, one record per user id, read after login and written after each change through `src/lib/progress-api.ts`. Without this, the weekly ranking cannot work and progress is lost on another device. |
| Content model | TypeScript types for `Track`, `Module`, `Lesson`, `LessonSection`, `Quiz`, `Question` and `CaseStudy`, with each question pointing to the lesson section it tests so the review screen can highlight it. |
| Shared UI pieces | A progress bar, a stat card (title, grey label, value on the right), a primary dark button and an outlined button, so every new screen looks the same. |

## Phase 1: onboarding and track assignment

Six questions, three about knowledge and three about attitude to risk, decide the track. The scoring lives in a pure function such as `assignTrack(answers)` so it can be tested on its own. After the last answer, the user sees which track they got and a short explanation of why, earns 50 XP, and lands on their track homepage. The router should send any signed in user with `onboardingDone` false to `/onboarding` before anything else. A "retake onboarding" option in the profile lets people change track if the result does not fit them.

| Behaviour | Store action | Reward |
| --- | --- | --- |
| Finish the onboarding quiz | `setTrack(score)`, `completeOnboarding()` | +50 XP |
| Retake it later | `setTrack(score)` | No extra XP |

## Phase 2: lessons, quizzes and the 80% rule

This is the core loop and the biggest phase.

The `LessonViewer` page shows one short lesson split into sections, with plain text and everyday examples, and a button to start the quiz at the end. The `LessonQuiz` page shows five questions one at a time, corrects each answer straight away with a short explanation, and computes the final percentage through `submitQuiz(lessonId, answers)`. At 80% or more the lesson counts as done and the next one unlocks. Below 80%, `requireReview(lessonId)` sends the user back to the lesson with an encouraging message and the sections tied to their wrong answers highlighted. Passing after a review calls `clearReview(lessonId)` and gives the review bonus. Every attempt goes through `registerAttempt(lessonId)`.

A module map page shows the four modules and their lessons as locked, available, to review or done. Foundation and Arena follow a fixed order, while Strategist users can pick the module order themselves. The practical case at the end of each module works like a longer quiz built around one real situation, such as a sudden expense that forces the user to touch the emergency fund.

Content is a big job on its own. Three tracks times four modules times three lessons gives 36 lessons, 36 quizzes of five questions, 12 practical cases and three final challenges. We suggest keeping it as typed files in `src/content`, one folder per track, so it is versioned with the code and easy to test, and starting with the first module of each track so the whole loop can be demoed early.

| Track | First module topic |
| --- | --- |
| Foundation | Building a budget with the 50/30/20 rule, then the emergency fund |
| Strategist | Inflation and compound interest, then ETFs, diversification and taxes |
| Arena | Volatility versus permanent loss of capital, then spotting scams |

## Phase 3: XP, levels, Stacks, streak and badges

All amounts come from the GDD and belong in `src/lib/rewards.ts`.

| Event | XP | Stacks |
| --- | --- | --- |
| Lesson finished | +30 | +10 |
| Correct quiz answer | +10 each | none |
| Quiz passed with 80% or more | none | +5 |
| Passed on the first attempt | +20 bonus | +10 bonus |
| Passed after reviewing the lesson | +15 | none |
| Each day of streak | +5 | +5 |
| Onboarding finished | +50 | none |

| Level | Name | XP needed |
| --- | --- | --- |
| 1 | Beginner | 0 |
| 2 | Apprentice | 200 |
| 3 | Saver | 500 |
| 4 | Investor | 900 |
| 5 | Stackr Master | 1400 |

The streak counts days in a row with at least one lesson, quiz or review. `logActivity()` stores the date and `updateStreak()` grows the counter, keeps it on the same day and resets it after a missed day. The streak also gives an XP bonus on finished activities, capped at 25%. Day boundaries should use the user's local date, and the date should come from an injectable clock so tests never depend on the real time.

| Badge | How to earn it |
| --- | --- |
| Budget on Track | Finish the budgeting module |
| Solid Fund | Score 100% on the emergency fund quiz |
| Prudent Investor | Finish the Strategist track |
| Scam Detector | Get 10 scam challenges right |
| Unstoppable | Reach a 7 day streak |

When a badge unlocks, a small quiet notice appears, and the dashboard header always shows level, XP to the next level, Stacks and the streak.

## Phase 4: one homepage per track

The dashboard becomes the track homepage, and the first thing on it is always the next step: the next lesson, a lesson waiting for review, or in Arena the flash challenge of the day.

| Track | What the homepage highlights |
| --- | --- |
| Foundation | The next lesson in large, a glossary of basic terms and the module progress bar |
| Strategist | A compound interest simulator where the user moves the values and sees why the result changes, the module map and personal stats |
| Arena | The daily timed flash challenge, the weekly ranking and scam alerts |

The compound interest calculation is money logic, so it lives with the other money helpers, is rounded and formatted in one place, and is tested for zero, negative inputs, rounding and very large values.

## Phase 5: the Stacks shop

A `StackShop` page lists extra content with its price: 30 Stacks for a bonus quiz and 50 Stacks for an extra lesson. Lessons on the main path never cost anything. Buying goes through `unlockContent(contentId, cost)`, which uses `spendStacks(amount)` and refuses the purchase with a clear message if the balance is too low. After a purchase the balance updates, the item shows as unlocked on the module map, and a short tip about spending with intention appears. Bonus quizzes and extra lessons need their own content on top of the main path.

## Phase 6: weekly ranking

Each track has an anonymous weekly ranking ordered by XP earned that week. `addXp` also feeds `weeklyXp`, and `resetWeek()` clears it at the start of each week. Names are never shown, only a generated nickname or a position, and the user's own row is marked. Because it compares users, this needs the shared `progress` collection from phase 0. With json-server there is no scheduled job, so the reset should happen when the data is read, by comparing the stored week number with the current one.

## Phase 7: final challenge, certificates and moving between tracks

At level 5 the user takes a final challenge that mixes everything from the track. Passing it gives a track certificate that can be shared, for example as an image or a public link. Finishing Foundation offers a move to Strategist, and finishing Strategist or Arena unlocks the extra modules of the other one.

## Phase 8: profile and polish

A profile page shows the badges, level, track, stats and the retake onboarding option. We finish with empty states, loading and error states with clear messages, keyboard and screen reader checks, and a light pass to make sure every new screen matches the login, sign up and dashboard pages.

## Measuring the goals

The GDD sets targets such as 75% of Foundation users finishing all four modules with an average of 70% or more, a 30% average rise between the Strategist diagnostic and final quizzes, over 80% right answers in Arena scam challenges, and 60% of users returning three or more times a week. Most of these can already be computed from `quizResults`, `quizAttempts`, `completedLessons` and `lastActivity`. The Strategist target also needs a diagnostic quiz at the start of the track, which is not in the plan above yet.

## Open questions to settle before building

A few points in the GDD are unclear or clash with each other, and it is worth deciding them as a group first.

The lesson completion reward of 30 XP is given when the lesson is read, but the lesson only counts as completed after the quiz is passed. We need to choose which moment gives the reward, and whether reading the same lesson again after a failed quiz pays out again.

The streak gives both +5 XP per day and a bonus of up to 25% on activities. We need the exact formula, for example 5% per streak day capped at 25%.

The Strategist diagnostic quiz, the Arena flash challenges and the scam alerts are mentioned but not described, so their format, length and timer need defining.

The level 5 name appears as both "Stackr Master" and "Mestre Stackr". Since the interface is in English, we suggest "Stackr Master".

Sharing badges and certificates with friends needs a decision on how, since the app has no social features yet.
