import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { dateKey } from "../lib/budget";
import { AppError } from "../lib/errors";
import {
	applyDeposit,
	checkedInvestedAmount,
	checkedPosition,
	checkedShares,
	checkedStartDate,
	checkedStartingAmount,
	checkSavingsTerms,
	defaultSavingsTerms,
	emptyPortfolio,
	type Holding,
	holdingFromTicker,
	loadPortfolio,
	MAX_HOLDINGS,
	MAX_SAVINGS,
	type NewSavings,
	newHolding,
	newSavingsEntry,
	type Portfolio,
	quoteOrNull,
	type RecordChanges,
	type SavingsEntry,
	savePortfolio,
	type TickerChoice,
} from "../lib/portfolio";
import { useSavedSnapshot } from "../lib/saved-snapshot";

export const usePortfolioStore = defineStore("portfolio", () => {
	const portfolio = ref<Portfolio>(emptyPortfolio());
	const { hasUnsavedChanges, markSaved } = useSavedSnapshot(portfolio);
	const isFull = computed(
		() => portfolio.value.holdings.length >= MAX_HOLDINGS,
	);
	const isSavingsFull = computed(
		() => portfolio.value.savings.length >= MAX_SAVINGS,
	);

	async function load(): Promise<void> {
		portfolio.value = await loadPortfolio();
		markSaved();
	}

	async function save(): Promise<void> {
		// The user can keep editing during the request, and those edits are not saved yet.
		const sent = JSON.stringify(portfolio.value);
		await savePortfolio(JSON.parse(sent));
		markSaved(sent);
	}

	function ensureRoom(): void {
		if (isFull.value) throw new AppError("tooManyHoldings");
	}

	function checkedName(name: string): string {
		const trimmed = name.trim();
		if (!trimmed) throw new AppError("registerNameMissing");
		return trimmed;
	}

	function addManual(
		name: string,
		initial = 0,
		startDate = dateKey(new Date()),
	): Holding {
		ensureRoom();
		const holding = newHolding({
			name: checkedName(name),
			initial: checkedStartingAmount(initial),
			startDate: checkedStartDate(startDate, dateKey(new Date())),
			monthly: 0,
		});
		portfolio.value.holdings.push(holding);
		return holding;
	}

	async function addTicker(
		choice: TickerChoice,
		invested: number,
		shares: number,
		startDate = dateKey(new Date()),
	): Promise<Holding> {
		ensureRoom();
		const startingAmount = checkedInvestedAmount(invested);
		const startingShares = checkedShares(shares);
		const checkedDate = checkedStartDate(startDate, dateKey(new Date()));
		if (
			portfolio.value.holdings.some((entry) => entry.symbol === choice.symbol)
		) {
			throw new AppError("holdingExists");
		}
		const [holding, quote] = await Promise.all([
			holdingFromTicker(choice),
			quoteOrNull(choice.symbol),
		]);
		// Checked again because another ticker may have been added while the
		// history was loading.
		ensureRoom();
		holding.initial = startingAmount;
		holding.shares = startingShares;
		holding.startDate = checkedDate;
		holding.quote = quote;
		holding.monthly = 0;
		portfolio.value.holdings.push(holding);
		return holding;
	}

	/**
	 * Fetches the latest prices. A ticker that fails keeps its last known price,
	 * and nothing is applied once the screen that asked for it has gone.
	 */
	async function refreshQuotes(shouldApply: () => boolean): Promise<void> {
		const tickers = portfolio.value.holdings.filter(({ symbol }) => symbol);
		const quotes = await Promise.all(
			tickers.map(({ symbol }) => quoteOrNull(symbol as string)),
		);
		if (!shouldApply()) return;
		tickers.forEach(({ id }, index) => {
			const holding = portfolio.value.holdings.find((item) => item.id === id);
			const quote = quotes[index];
			if (holding && quote) holding.quote = quote;
		});
	}

	function removeHolding(id: string): void {
		portfolio.value.holdings = portfolio.value.holdings.filter(
			(holding) => holding.id !== id,
		);
	}

	function addSavings(
		name: string,
		fields: Partial<NewSavings> = {},
	): SavingsEntry {
		if (isSavingsFull.value) throw new AppError("tooManySavings");
		checkSavingsTerms(
			{ ...defaultSavingsTerms(), ...fields },
			dateKey(new Date()),
		);
		const entry = newSavingsEntry(checkedName(name), {
			...fields,
			initial: checkedStartingAmount(fields.initial ?? 0),
		});
		portfolio.value.savings.push(entry);
		return entry;
	}

	function updateRecord(id: string, changes: RecordChanges): void {
		const { holdings, savings } = portfolio.value;
		const entry = [...holdings, ...savings].find((item) => item.id === id);
		if (!entry) throw new AppError("registerEntryMissing");
		if (changes.terms) checkSavingsTerms(changes.terms, dateKey(new Date()));
		const position =
			changes.position &&
			checkedPosition(changes.position, dateKey(new Date()));
		entry.nametag = changes.nametag.trim();
		entry.icon = changes.icon;
		if (position && "symbol" in entry) Object.assign(entry, position);
		if (changes.terms && "interest" in entry) {
			// The simulator starts again from the rate that was just corrected.
			if (changes.terms.contractRatePercent !== entry.contractRatePercent) {
				entry.annualReturnPercent = changes.terms.contractRatePercent;
			}
			Object.assign(entry, changes.terms);
		}
	}

	function addDeposit(
		id: string,
		amount: number,
		date: string,
		shares?: number,
	): void {
		const { holdings, savings } = portfolio.value;
		const entry = [...holdings, ...savings].find((item) => item.id === id);
		if (!entry) throw new AppError("registerEntryMissing");
		applyDeposit(entry, amount, date, shares);
	}

	function removeSavings(id: string): void {
		portfolio.value.savings = portfolio.value.savings.filter(
			(entry) => entry.id !== id,
		);
	}

	return {
		portfolio,
		hasUnsavedChanges,
		isFull,
		isSavingsFull,
		load,
		save,
		addManual,
		addTicker,
		refreshQuotes,
		removeHolding,
		addSavings,
		addDeposit,
		updateRecord,
		removeSavings,
	};
});
