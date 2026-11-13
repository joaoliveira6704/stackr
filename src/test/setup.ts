import { afterEach } from "vitest";
import { useConfirm } from "../lib/use-confirm";

// jsdom has no layout, so the router's scroll to top on navigation would only
// print "Not implemented" warnings.
window.scrollTo = () => {};

// A question left open by one test must not leak into the next one.
afterEach(() => {
	useConfirm().answer(false);
});
