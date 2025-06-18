import { defineConfig } from "apibara/config";

export default defineConfig({
  runtimeConfig: {
    connectionString: process.env["MONGODB_CONNECTION_STRING"] ?? "mongodb://localhost:27017/",
    starknetVault: {
      startingBlock: process.env["STARTING_BLOCK"] ?? 847235,
      streamUrl: "https://sepolia.starknet.a5a.ch",
      dbName: process.env["MONGODB_DB_NAME"] ?? "test_starknetVault_v1",
    },
  },
});
