// Caddy-Apibara-Indexer/indexers/starknet-vault.indexer.ts

import { defineIndexer } from "@apibara/indexer";
import { useLogger } from "apibara/plugins";
import { mongoStorage, useMongoStorage } from "@apibara/plugin-mongo";
import { StarknetStream, getSelector } from "@apibara/starknet";
import { MongoClient } from "mongodb";
import type { ApibaraRuntimeConfig } from "apibara/types";
import { VaultDatabase } from "../lib/mongo-service";
import { EventHandlers } from "../lib/event-handler";

const CONTRACT_ADDRESS = "0x03470e8102b445fa3563eb724b52d17fcc6543b3639388edab74cb50be48e292";

export default function (runtimeConfig: ApibaraRuntimeConfig) {
  const { streamUrl, startingBlock, dbName} = runtimeConfig["starknetVault"];
  const { connectionString } = runtimeConfig;
  const mongodb = new MongoClient(connectionString);

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
      ],
    },
    plugins: [
      mongoStorage({
        client: mongodb,
        dbName: dbName,
        collections: ["cycles", "users", "deposits", "withdrawalRequests"],
      }),
    ],
    async transform({ endCursor, finality, block }) {
      const logger = useLogger();
      const mongo = useMongoStorage();
      
      // Initialize typed database and handlers
      const db = new VaultDatabase(mongodb.db(dbName));
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
          const [user, amount, cycleId] = data;
          await handlers.handleDeposit(
            user,
            amount,
            cycleId,
            transactionHash,
            blockNumber,
            address,
            transactionStatus
          );

        } else if (event.keys.includes(getSelector("WithdrawalRequested"))) {
          const [user, cycleId] = data;
          await handlers.handleWithdrawal(
            user,
            cycleId,
            transactionHash,
            blockNumber,
            address,
            transactionStatus
          );

        } else if (event.keys.includes(getSelector("CycleStarted"))) {
          const [cycleId, startTime] = data;
          await handlers.handleCycleStart(
            cycleId,
            startTime,
            transactionHash,
            blockNumber
          );

        } else if (event.keys.includes(getSelector("CycleEnded"))) {
          const [cycleId, endTime] = data;
          await handlers.handleCycleEnd(
            cycleId,
            endTime,
            transactionHash,
            blockNumber
          );
        }
      }
    },
  });
}