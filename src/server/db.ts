import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

import { env } from "~/env";

const createPrismaClient = () => {
  // Use LibSQL adapter for Turso (when auth token is provided)
  if (env.DATABASE_AUTH_TOKEN) {
    const libsql = createClient({
      url: env.DATABASE_URL,
      authToken: env.DATABASE_AUTH_TOKEN,
    });

    const adapter = new PrismaLibSQL(libsql as any);

    return new PrismaClient({
      adapter,
      log:
        env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  }

  // Use regular Prisma client for local SQLite
  return new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
};

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;
