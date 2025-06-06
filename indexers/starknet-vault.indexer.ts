// Caddy-Apibara-Indexer/indexers/starknet-vault.indexer.ts

import { defineIndexer } from "apibara/indexer";
import { useLogger } from "apibara/plugins";
import { drizzleStorage } from "@apibara/plugin-drizzle";
import { drizzle } from "@apibara/plugin-drizzle";
import { getSelector, StarknetStream } from "@apibara/starknet";
import type { ApibaraRuntimeConfig } from "apibara/types";
import * as schema from "../lib/schema";

export default function (runtimeConfig: ApibaraRuntimeConfig) {
  console.log(runtimeConfig);
  const { startingBlock, streamUrl } = runtimeConfig["starknetVault"];
  const db = drizzle({
    schema,
  });

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
      drizzleStorage({ db, migrate: { migrationsFolder: "./drizzle" } }),
    ],
    async transform({ endCursor, finality, block }) {
      const logger = useLogger();

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
          const { user, amount, cycle_id: cycleId } = event.data;
          await db.insert(schema.depositsTable).values({
            user,
            amount,
            cycleId,
            timestamp: BigInt(Date.now()), // Assuming you want to use the current timestamp
          });
        } else if (event.keys.includes(getSelector("WithdrawalRequested"))) {
          const { user, cycle_id: cycleId } = event.data;
          await db.insert(schema.withdrawalRequestsTable).values({
            user,
            cycleId,
            timestamp: BigInt(Date.now()), // Assuming you want to use the current timestamp
          });
        } else if (event.keys.includes(getSelector("CycleStarted"))) {
          const { cycle_id: cycleId, start_time: startTime } = event.data;
          await db.insert(schema.cyclesTable).values({
            cycleId,
            startTime,
            status: "started",
          });
        }
      }
    },
  });
}