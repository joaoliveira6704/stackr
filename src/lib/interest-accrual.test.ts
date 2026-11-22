import { describe, expect, it } from "vitest";
import { accrueSavings } from "./interest-accrual";
import { newSavingsEntry, type SavingsEntry } from "./portfolio";

function saving(fields: Partial<SavingsEntry> = {}): SavingsEntry {
	return {
		...newSavingsEntry("Saving"),
		initial: 1000,
		interest: "simple",
		rateBasis: "tanl",
		contractRatePercent: 10,
		startDate: "2025-01-01",
		...fields,
	};
}

describe("accrueSavings", () => {
	it("earns a full year of simple interest", () => {
		expect(accrueSavings(saving(), "2026-01-01")).toMatchObject({
			deposited: 1000,
			interest: 100,
			value: 1100,
		});
	});

	it("earns part of a year by the day", () => {
		expect(accrueSavings(saving(), "2025-01-02").interest).toBe(0.27);
	});

	it("takes 28% of tax from a TANB", () => {
		const entry = saving({ rateBasis: "tanb" });

		expect(accrueSavings(entry, "2026-01-01").value).toBe(1072);
	});

	it("reads a TAE with its compounding", () => {
		const entry = saving({
			rateBasis: "tae",
			interest: "compoundYearly",
			contractRatePercent: 10,
		});

		expect(accrueSavings(entry, "2026-01-01").value).toBe(1072);
	});

	it("pays interest on credited interest with compound interest", () => {
		const entry = saving({ interest: "compoundYearly" });

		expect(accrueSavings(entry, "2027-01-01").value).toBe(1210);
	});

	it("never pays interest on interest with simple interest", () => {
		expect(accrueSavings(saving(), "2027-01-01").value).toBe(1200);
	});

	it("earns more the more often interest is credited", () => {
		const valueWith = (interest: SavingsEntry["interest"]) =>
			accrueSavings(saving({ interest }), "2030-01-01").value;

		expect(valueWith("compoundMonthly")).toBeGreaterThan(
			valueWith("compoundQuarterly"),
		);
		expect(valueWith("compoundQuarterly")).toBeGreaterThan(
			valueWith("compoundYearly"),
		);
	});

	it("keeps interest pending until its credit date", () => {
		const entry = saving({ interest: "compoundQuarterly" });
		const result = accrueSavings(entry, "2025-03-01");

		expect(result.credited).toBe(0);
		expect(result.pending).toBeGreaterThan(0);
	});

	it("earns on a deposit only from its own day", () => {
		const entry = saving({
			initial: 1500,
			deposits: [{ id: "d", amount: 500, date: "2025-07-02" }],
		});

		// 100 on the first 1000, plus 183 of 365 days on the 500.
		expect(accrueSavings(entry, "2026-01-01")).toMatchObject({
			deposited: 1500,
			interest: 125.07,
			value: 1625.07,
		});
	});

	it("counts a deposit made before the start date as part of the start", () => {
		const entry = saving({
			deposits: [{ id: "d", amount: 200, date: "2024-06-01" }],
		});

		expect(accrueSavings(entry, "2026-01-01").value).toBe(1100);
	});

	it("raises a stepped rate every year", () => {
		const entry = saving({ ratePath: "stepped", rateStepPercent: 5 });

		expect(accrueSavings(entry, "2027-01-01").value).toBe(1250);
	});

	it("moves a mixed rate on after its fixed years", () => {
		const entry = saving({
			ratePath: "mixed",
			rateFixedYears: 1,
			rateLaterPercent: 2,
		});

		expect(accrueSavings(entry, "2027-01-01").value).toBe(1120);
	});

	it.each([
		"",
		"2026-06-01",
	])("earns nothing with the start date '%s'", (startDate) => {
		expect(accrueSavings(saving({ startDate }), "2026-01-01")).toMatchObject({
			interest: 0,
			value: 1000,
		});
	});

	it("earns nothing on the day it starts", () => {
		expect(accrueSavings(saving(), "2025-01-01").interest).toBe(0);
	});

	it("earns nothing at a zero rate", () => {
		const entry = saving({ contractRatePercent: 0 });

		expect(accrueSavings(entry, "2030-01-01").value).toBe(1000);
	});

	it("earns nothing on an empty balance", () => {
		expect(accrueSavings(saving({ initial: 0 }), "2030-01-01").value).toBe(0);
	});

	it("never goes below zero with a negative rate", () => {
		const entry = saving({ contractRatePercent: -90 });

		expect(accrueSavings(entry, "2030-01-01").value).toBe(0);
	});

	it("handles a start on the 31st through shorter months", () => {
		const entry = saving({
			interest: "compoundMonthly",
			startDate: "2025-01-31",
		});

		expect(accrueSavings(entry, "2025-03-31").elapsedMonths).toBe(2);
		expect(accrueSavings(entry, "2025-03-31").credited).toBeGreaterThan(0);
	});

	it("rounds the value to cents", () => {
		const entry = saving({ initial: 0.01, contractRatePercent: 1 });

		expect(accrueSavings(entry, "2026-01-01").value).toBe(0.01);
	});

	it("handles large balances", () => {
		const entry = saving({ initial: 10_000_000 });

		expect(accrueSavings(entry, "2026-01-01").value).toBe(11_000_000);
	});
});
