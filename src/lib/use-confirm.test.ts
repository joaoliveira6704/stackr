import { describe, expect, it } from "vitest";
import { useConfirm } from "./use-confirm";

const QUESTION = {
	title: "Delete?",
	message: "This cannot be undone.",
	confirmLabel: "Delete",
};

describe("useConfirm", () => {
	it("resolves to true when the user confirms", async () => {
		const { confirm, answer } = useConfirm();

		const result = confirm(QUESTION);
		answer(true);

		await expect(result).resolves.toBe(true);
	});

	it("resolves to false when the user cancels", async () => {
		const { confirm, answer } = useConfirm();

		const result = confirm(QUESTION);
		answer(false);

		await expect(result).resolves.toBe(false);
	});

	it("shows the question until it is answered", () => {
		const { confirm, answer, request } = useConfirm();

		void confirm(QUESTION);
		expect(request.value?.title).toBe("Delete?");

		answer(false);
		expect(request.value).toBeNull();
	});

	it("cancels a question still open when a new one is asked", async () => {
		const { confirm, answer, request } = useConfirm();

		const first = confirm(QUESTION);
		void confirm({ ...QUESTION, title: "Leave?" });

		await expect(first).resolves.toBe(false);
		expect(request.value?.title).toBe("Leave?");
		answer(false);
	});
});
