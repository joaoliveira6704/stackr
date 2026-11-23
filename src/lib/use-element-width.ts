import { onMounted, onUnmounted, type Ref, ref } from "vue";

/** The live width of an element, for charts that draw to fit their container. */
export function useElementWidth(
	element: Readonly<Ref<HTMLElement | null>>,
	fallback: number,
) {
	const width = ref(fallback);
	let observer: ResizeObserver | null = null;

	onMounted(() => {
		if (!element.value || typeof ResizeObserver === "undefined") return;
		observer = new ResizeObserver(([entry]) => {
			width.value = Math.max(entry.contentRect.width, 1);
		});
		observer.observe(element.value);
	});
	onUnmounted(() => observer?.disconnect());

	return width;
}
