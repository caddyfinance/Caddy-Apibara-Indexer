import { defineIndexer } from "apibara/indexer";
import { useLogger } from "apibara/plugins";
import { drizzleStorage } from "@apibara/plugin-drizzle";
import { drizzle } from "@apibara/plugin-drizzle";
import { StarknetStream } from "@apibara/starknet";
import type { ApibaraRuntimeConfig } from "apibara/types";
import * as schema from "../lib/schema";

export default function (runtimeConfig: ApibaraRuntimeConfig) {
  const { startingBlock, streamUrl } = runtimeConfig["starknetVault"];
  const db = drizzle({
    schema,
  });

  return defineIndexer(StarknetStream)({
    streamUrl,
    finality: "accepted",
    startingBlock: BigInt(startingBlock),
    filter: {
      events: [],
    },
    plugins: [
      drizzleStorage({ db, migrate: { migrationsFolder: "./drizzle" } }),
    ],
    async transform({ endCursor, finality }) {
      const logger = useLogger();

      logger.info(
        "Transforming block | orderKey: ",
        endCursor?.orderKey,
        " | finality: ",
        finality,
      );

      // Example snippet to insert data into db using drizzle with postgres
      // const { db: database } = useDrizzleStorage();

      // await database.insert(schema.cursorTable).values({
      //   endCursor: Number(endCursor?.orderKey),
      //   uniqueKey: `${endCursor?.uniqueKey}`,
      // });
    },
  });
}
