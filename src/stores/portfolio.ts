import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { AppError } from "../lib/errors";
import {
	type AssetKind,
	averageAnnualReturn,
	fetchPriceHistory,
	historyYears,
	type PriceHistory,
	yearlyReturns,
} from "../lib/market";
import {
	DEFAULT_INITIAL,
	DEFAULT_MONTHLY,
	DEFAULT_RETURN_PERCENT,
	emptyPortfolio,
	type Holding,
	loadPortfolio,
	MAX_HOLDINGS,
	type Portfolio,
	savePortfolio,
} from "../lib/portfolio";
import { useSavedSnapshot } from "../lib/saved-snapshot";

export interface TickerChoice {
	symbol: string;
	name: string;
	kind: AssetKind | null;
}

function newHolding(fields: Partial<Holding> & Pick<Holding, "name">): Holding {
	return {
		id: crypto.randomUUID(),
		symbol: null,
		kind: null,
		initial: DEFAULT_INITIAL,
		monthly: DEFAULT_MONTHLY,
		annualReturnPercent: DEFAULT_RETURN_PERCENT,
		returnSource: "manual",
		yearlyReturns: [],
		historyYears: 0,
		...fields,
	};
}

function historyFields(history: PriceHistory): Partial<Holding> {
	const average = averageAnnualReturn(history.points);
	if (average === null) return {};
	return {
		annualReturnPercent: average,
		returnSource: "history",
		yearlyReturns: yearlyReturns(history.points),
		historyYears: historyYears(history.points),
	};
}

export const usePortfolioStore = defineStore("portfolio", () => {
	const portfolio = ref<Portfolio>(emptyPortfolio());
	const { hasUnsavedChanges, markSaved } = useSavedSnapshot(portfolio);
	const isFull = computed(
		() => portfolio.value.holdings.length >= MAX_HOLDINGS,
	);

	async function load(): Promise<void> {
		portfolio.value = await loadPortfolio();
		markSaved();
	}

	async function save(): Promise<void> {
		await savePortfolio(portfolio.value);
		markSaved();
	}

	function ensureRoom(): void {
		if (isFull.value) throw new AppError("tooManyHoldings");
	}

	function addManual(name: string): Holding {
		ensureRoom();
		const holding = newHolding({ name });
		portfolio.value.holdings.push(holding);
		return holding;
	}

	/**
	 * Adds a ticker with its past growth as the expected return. When the
	 * market data cannot be reached the ticker is still added, with a return
	 * the user can type in, so the simulator never gets stuck.
	 */
	async function addTicker(choice: TickerChoice): Promise<Holding> {
		ensureRoom();
		if (
			portfolio.value.holdings.some((entry) => entry.symbol === choice.symbol)
		) {
			throw new AppError("holdingExists");
		}
		let fields: Partial<Holding> = {};
		try {
			fields = historyFields(await fetchPriceHistory(choice.symbol));
		} catch (cause) {
			if (!(cause instanceof AppError)) throw cause;
		}
		// Checked again because another ticker may have been added while the
		// history was loading.
		ensureRoom();
		const holding = newHolding({
			symbol: choice.symbol,
			name: choice.name,
			kind: choice.kind,
			...fields,
		});
		portfolio.value.holdings.push(holding);
		return holding;
	}

	function removeHolding(id: string): void {
		portfolio.value.holdings = portfolio.value.holdings.filter(
			(holding) => holding.id !== id,
		);
	}

	return {
		portfolio,
		hasUnsavedChanges,
		isFull,
		load,
		save,
		addManual,
		addTicker,
		removeHolding,
	};
});
