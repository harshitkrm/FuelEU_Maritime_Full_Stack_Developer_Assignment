/**
 * Article 20 — append ledger lines and query cumulative net banked amount (bank − apply).
 */
export interface BankEntryRepositoryPort {
  append(params: {
    shipId: string;
    year: number;
    amountGco2e: number;
    kind: "bank" | "apply";
  }): Promise<void>;

  /** Net cumulative surplus registered (sum of bank amounts − sum of apply amounts) for the ship. */
  cumulativeNetBankedGco2e(shipId: string): Promise<number>;
}
