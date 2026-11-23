import type { QuizQuestion } from "../content/types";

export const PASS_MARK = 80;

/** Question id mapped to the chosen option id. */
export type QuizAnswers = Record<string, string>;

export interface QuizScore {
	correct: number;
	total: number;
	/** Rounded down, so 79.9% can never pass as 80%. */
	percent: number;
	passed: boolean;
	/** Sections tied to wrong or missing answers, to highlight on review. */
	sectionsToReview: string[];
}

export function isCorrect(question: QuizQuestion, answer?: string): boolean {
	return answer === question.correctOptionId;
}

export function scoreQuiz(
	questions: QuizQuestion[],
	answers: QuizAnswers,
): QuizScore {
	const missed = questions.filter((q) => !isCorrect(q, answers[q.id]));
	const total = questions.length;
	const correct = total - missed.length;
	const percent = total === 0 ? 0 : Math.floor((correct / total) * 100);
	return {
		correct,
		total,
		percent,
		passed: total > 0 && percent >= PASS_MARK,
		sectionsToReview: [...new Set(missed.map((q) => q.sectionId))],
	};
}
