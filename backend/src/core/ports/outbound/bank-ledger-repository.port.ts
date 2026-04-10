export interface BankLedgerRepositoryPort {
  findByShipId(shipId: string): Promise<{
    shipId: string;
    cumulativeBankedSurplusGco2e: number;
  } | null>;
  save(ledger: {
    shipId: string;
    cumulativeBankedSurplusGco2e: number;
  }): Promise<void>;
}
