// Caddy-Apibara-Indexer/indexers/starknet-vault.indexer.ts

import { defineIndexer } from "@apibara/indexer";
import { useLogger } from "apibara/plugins";
import { mongoStorage, useMongoStorage } from "@apibara/plugin-mongo";
import { StarknetStream, getSelector } from "@apibara/starknet";
import { MongoClient } from "mongodb";
import type { ApibaraRuntimeConfig } from "apibara/types";
import { VaultDatabase } from "../lib/mongo-service";
import { EventHandlers } from "../lib/event-handler";

// const CONTRACT_ADDRESS = "0x03470e8102b445fa3563eb724b52d17fcc6543b3639388edab74cb50be48e292";
const CONTRACT_ADDRESS = "0x023e196de270a0eceb13758a1c53c0b2865547fb66e71c4baa161d116662fa43";

export default function (runtimeConfig: ApibaraRuntimeConfig) {
  const { streamUrl, startingBlock, dbName} = runtimeConfig["starknetVault"];
  const { connectionString } = runtimeConfig;
  const mongodb = new MongoClient(connectionString);
  const db = new VaultDatabase(mongodb.db(dbName));

  return defineIndexer(StarknetStream)({
    startingBlock: BigInt(startingBlock),
    streamUrl,
    finality: "accepted",
    filter: {
      events: [
        {
          id: 1,
          address: CONTRACT_ADDRESS,
          transactionStatus: "succeeded",
          keys: [getSelector("Deposited")]
        },
        {
          id: 2,
          address: CONTRACT_ADDRESS,
          transactionStatus: "succeeded",
          keys: [getSelector("WithdrawalRequested")]
        },
        {
          id: 3,
          address: CONTRACT_ADDRESS,
          transactionStatus: "succeeded",
          keys: [getSelector("CycleStarted")]
        },
        {
          id: 4,
          address: CONTRACT_ADDRESS,
          transactionStatus: "succeeded",
          keys: [getSelector("CycleEnded")]
        },
        {
          id: 5,
          address: CONTRACT_ADDRESS,
          transactionStatus: "succeeded",
          keys: [getSelector("YieldWithdrawn")]
        },
      ],
    },
    plugins: [
      mongoStorage({
        client: mongodb,
        dbName: dbName,
        collections: ["cycles", "users", "deposits", "withdrawalRequests", "yieldWithdrawals"],
      }),
    ],
    async transform({ endCursor, finality, block }) {
      const logger = useLogger();
      const handlers = new EventHandlers(db);

      logger.info(
        "Transforming block | orderKey: ",
        endCursor?.orderKey,
        " | finality: ",
        finality,
      );

      for (const event of block.events) {
        const { data, transactionHash, address, transactionStatus } = event;
        const blockNumber = block.header?.blockNumber;

        if (event.keys.includes(getSelector("Deposited"))) {
          const [user, amount, unknown, cycle_id] = data;
          await handlers.handleDeposit(
            user,
            amount,
            cycle_id,
            transactionHash,
            blockNumber,
            address,
            transactionStatus
          );

        } else if (event.keys.includes(getSelector("WithdrawalRequested"))) {
          const [user, cycle_id] = data;
          await handlers.handleWithdrawal(
            user,
            cycle_id,
            transactionHash,
            blockNumber,
            address,
            transactionStatus
          );

        } else if (event.keys.includes(getSelector("YieldWithdrawn"))) {
          const [user, amount, cycle_id] = data;
          await handlers.handleYieldWithdrawal(
            user,
            amount,
            cycle_id,
            transactionHash,
            blockNumber,
            address,
            transactionStatus
          );

        } else if (event.keys.includes(getSelector("CycleStarted"))) {
          const [cycle_id, start_time] = data;
          await handlers.handleCycleStart(
            cycle_id,
            start_time,
            transactionHash,
            blockNumber
          );

        } else if (event.keys.includes(getSelector("CycleEnded"))) {
          const [cycle_id, total_yield, treasury_fee] = data;
          await handlers.handleCycleEnd(
            cycle_id,
            total_yield,
            treasury_fee,
            transactionHash,
            blockNumber
          );
        }
      }
    },
  });
}