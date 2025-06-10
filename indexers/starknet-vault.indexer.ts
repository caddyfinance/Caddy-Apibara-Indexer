// Caddy-Apibara-Indexer/indexers/starknet-vault.indexer.ts

import { defineIndexer } from "@apibara/indexer";
import { useLogger } from "apibara/plugins";
import { mongoStorage, useMongoStorage } from "@apibara/plugin-mongo";
import { StarknetStream, getSelector } from "@apibara/starknet";
import { MongoClient } from "mongodb";
import type { ApibaraRuntimeConfig } from "apibara/types";

export default function (runtimeConfig: ApibaraRuntimeConfig) {
  const { startingBlock, streamUrl } = runtimeConfig["starknetVault"];
  const mongodb = new MongoClient(process.env["MONGODB_CONNECTION_STRING"] ?? "mongodb://localhost:27017/");

  return defineIndexer(StarknetStream)({
    streamUrl,
    finality: "accepted",
    startingBlock: BigInt(startingBlock),
    filter: {
      events: [
        {
          id: 1,
          address: "0x03578348b88501c60eff778f6f72b70d7291d490ba155f4285a8c0a8c7dd0897",
          transactionStatus: "succeeded",
          keys: [getSelector("Deposited")]
        },
        {
          id: 2,
          address: "0x03578348b88501c60eff778f6f72b70d7291d490ba155f4285a8c0a8c7dd0897",
          transactionStatus: "succeeded",
          keys: [getSelector("WithdrawalRequested")]
        },
        {
          id: 3,
          address: "0x03578348b88501c60eff778f6f72b70d7291d490ba155f4285a8c0a8c7dd0897",
          transactionStatus: "succeeded",
          keys: [getSelector("CycleStarted")]
        },
      ],
    },
    plugins: [
      mongoStorage({
        client: mongodb,
        dbName: "starknetVault",
        collections: ["deposits", "withdrawalRequests", "cycles"],
      }),
    ],
    async transform({ endCursor, finality, block }) {
      const logger = useLogger();
      const mongo = useMongoStorage();

      logger.info(
        "Transforming block | orderKey: ",
        endCursor?.orderKey,
        " | finality: ",
        finality,
      );

      const { events } = block;
      for (const event of events) {
        if (event.keys.includes(getSelector("Deposited"))) {
          console.log(event.data);
          const [user, amount, cycleId] = event.data;
          await mongo.collection("deposits").insertOne({
            user,
            amount,
            cycleId,
            timestamp: new Date(),
          });
        } else if (event.keys.includes(getSelector("WithdrawalRequested"))) {
          const [user, cycleId] = event.data;
          await mongo.collection("withdrawalRequests").insertOne({
            user,
            cycleId,
            timestamp: new Date(),
          });
        } else if (event.keys.includes(getSelector("CycleStarted"))) {
          const [cycleId, startTime] = event.data;
          await mongo.collection("cycles").insertOne({
            cycleId,
            startTime,
            status: "started",
          });
        }
      }
    },
  });
}