import { defineConfig } from "apibara/config";

export default defineConfig({
  runtimeConfig: {
    connectionString: process.env["POSTGRES_CONNECTION_STRING"] ?? "memory://",
    starknetVault: {
      startingBlock: 808416,
      streamUrl: "https://sepolia.starknet.a5a.ch",
    },
  },
  // indexer: {
  //   events: [
  //     {
  //       name: "CycleStarted",
  //       contractAddress: "0x03578348b88501c60eff778f6f72b70d7291d490ba155f4285a8c0a8c7dd0897",
  //       eventType: "caddy_finance_contracts::bitcoin_vault::BitcoinVault::CycleStarted",
  //     },
  //     {
  //       name: "Deposited",
  //       contractAddress: "0x03578348b88501c60eff778f6f72b70d7291d490ba155f4285a8c0a8c7dd0897",
  //       eventType: "caddy_finance_contracts::bitcoin_vault::BitcoinVault::Deposited",
  //     },
  //     {
  //       name: "WithdrawalRequested",
  //       contractAddress: "0x03578348b88501c60eff778f6f72b70d7291d490ba155f4285a8c0a8c7dd0897",
  //       eventType: "caddy_finance_contracts::bitcoin_vault::BitcoinVault::WithdrawalRequested",
  //     },
  //   ],
  // },
});
