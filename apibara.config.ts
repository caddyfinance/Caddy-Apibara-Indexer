import { defineConfig } from "apibara/config";

export default defineConfig({
  runtimeConfig: {
    connectionString: process.env["MONGODB_CONNECTION_STRING"] ?? "mongodb://localhost:27017/",
    starknetVault: {
      startingBlock: 808416,
      streamUrl: "https://sepolia.starknet.a5a.ch",
    },
  },
});
