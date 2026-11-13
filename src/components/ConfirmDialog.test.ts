import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { createAppI18n, type Locale } from "../i18n";
import { type ConfirmOptions, useConfirm } from "../lib/use-confirm";
import ConfirmDialog from "./ConfirmDialog.vue";

const LOGOUT: ConfirmOptions = {
	title: "Log out?",
	message: "You will need to log in again.",
	confirmLabel: "Log out",
	destructive: true,
};

let wrapper: ReturnType<typeof mount> | null = null;

async function ask(options: ConfirmOptions, locale: Locale = "en") {
	wrapper = mount(ConfirmDialog, {
		attachTo: document.body,
		global: { plugins: [createAppI18n(locale)] },
	});
	const result = useConfirm().confirm(options);
	await flushPromises();
	return { dialog: wrapper, result };
}

afterEach(() => {
	wrapper?.unmount();
	wrapper = null;
});

describe("ConfirmDialog", () => {
	it("shows nothing when no question is asked", () => {
		wrapper = mount(ConfirmDialog, {
			global: { plugins: [createAppI18n("en")] },
		});

		expect(wrapper.find('[role="alertdialog"]').exists()).toBe(false);
	});

	it("shows the question as a labelled alert dialog", async () => {
		const { dialog } = await ask(LOGOUT);

		const box = dialog.get('[role="alertdialog"]');
		expect(box.attributes("aria-modal")).toBe("true");
		expect(box.text()).toContain("Log out?");
		expect(box.text()).toContain("You will need to log in again.");
		const titleId = box.attributes("aria-labelledby");
		expect(dialog.get(`#${titleId}`).text()).toBe("Log out?");
	});

	it("puts focus on Cancel so Enter never confirms by accident", async () => {
		const { dialog } = await ask(LOGOUT);

		const cancel = dialog.findAll('[role="alertdialog"] button')[0];
		expect(document.activeElement).toBe(cancel.element);
	});

	it("uses the danger button for destructive actions", async () => {
		const { dialog } = await ask(LOGOUT);

		expect(dialog.find(".btn-danger").text()).toBe("Log out");
	});

	it("uses the primary button for actions that are not destructive", async () => {
		const { dialog } = await ask({ ...LOGOUT, destructive: false });

		expect(dialog.find(".btn-danger").exists()).toBe(false);
		expect(dialog.find(".btn-primary").text()).toBe("Log out");
	});

	it("resolves to true when the confirm button is pressed", async () => {
		const { dialog, result } = await ask(LOGOUT);

		await dialog.get(".btn-danger").trigger("click");

		await expect(result).resolves.toBe(true);
	});

	it("resolves to false when Escape is pressed", async () => {
		const { dialog, result } = await ask(LOGOUT);

		await dialog
			.get('[role="alertdialog"]')
			.trigger("keydown", { key: "Escape" });

		await expect(result).resolves.toBe(false);
	});

	it("still cancels on Escape when focus has slipped outside the dialog", async () => {
		const outside = document.createElement("button");
		document.body.appendChild(outside);
		const { result } = await ask(LOGOUT);

		outside.dispatchEvent(
			new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
		);

		await expect(result).resolves.toBe(false);
		outside.remove();
	});

	it("pulls focus back to Cancel when it moves outside the dialog", async () => {
		const outside = document.createElement("button");
		document.body.appendChild(outside);
		const { dialog } = await ask(LOGOUT);

		outside.focus();

		const cancel = dialog.findAll('[role="alertdialog"] button')[0];
		expect(document.activeElement).toBe(cancel.element);
		outside.remove();
	});

	it("resolves to false when the dimmed background is clicked", async () => {
		const { dialog, result } = await ask(LOGOUT);

		await dialog.get(".scrim").trigger("click");

		await expect(result).resolves.toBe(false);
	});

	it("keeps Tab inside the dialog", async () => {
		const { dialog } = await ask(LOGOUT);
		const [cancel, confirm] = dialog.findAll('[role="alertdialog"] button');

		await dialog.get('[role="alertdialog"]').trigger("keydown", { key: "Tab" });
		expect(document.activeElement).toBe(confirm.element);

		await dialog.get('[role="alertdialog"]').trigger("keydown", { key: "Tab" });
		expect(document.activeElement).toBe(cancel.element);
	});

	it("labels Cancel in Portuguese", async () => {
		const { dialog } = await ask(LOGOUT, "pt-PT");

		expect(dialog.findAll('[role="alertdialog"] button')[0].text()).toBe(
			"Cancelar",
		);
	});
});
