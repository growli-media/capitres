import "server-only";
import postgres from "postgres";

type SqlClient = ReturnType<typeof postgres>;

declare global {
  // eslint-disable-next-line no-var
  var __capitresSql: SqlClient | undefined;
}

function createClient(): SqlClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and point " +
        "it at a Postgres instance (see README for local dev setup).",
    );
  }
  // Local pglite dev server doesn't speak SSL; real hosts (Vercel
  // Postgres / Neon) require it. Detect by host.
  const isLocal = /localhost|127\.0\.0\.1/.test(url);
  return postgres(url, {
    ssl: isLocal ? false : "require",
    max: 5,
    idle_timeout: 20,
  });
}

function getClient(): SqlClient {
  if (!globalThis.__capitresSql) {
    globalThis.__capitresSql = createClient();
  }
  return globalThis.__capitresSql;
}

function isConnectionError(err: unknown): boolean {
  const code = (err as { code?: string } | undefined)?.code;
  return code === "ECONNRESET" || code === "CONNECTION_CLOSED" || code === "CONNECTION_ENDED";
}

/**
 * Runs a query with one retry-on-fresh-connection if it fails with a
 * connection-level error — standard resilience against transient
 * connection blips (relevant to any Postgres host, not just local dev).
 */
async function runQuery(args: unknown[], retrying = false): Promise<unknown> {
  const client = getClient();
  const call = client as unknown as (...a: unknown[]) => Promise<unknown>;
  try {
    return await call(...args);
  } catch (err) {
    if (!retrying && isConnectionError(err)) {
      await globalThis.__capitresSql?.end({ timeout: 0 }).catch(() => {});
      globalThis.__capitresSql = undefined;
      return runQuery(args, true);
    }
    throw err;
  }
}

/**
 * Pooled Postgres client, reused across serverless invocations within the
 * same warm container. Wrapped in a Proxy so that *importing* this module
 * is side-effect free — the connection (and the "DATABASE_URL is not set"
 * error) only happens on the first actual query. That matters because
 * `catalog/index.ts` imports the Postgres provider unconditionally and
 * only uses it when DATABASE_URL is present; without laziness, importing
 * that module would crash the DB-less local-catalog fallback too.
 */
export const sql: SqlClient = new Proxy((() => {}) as unknown as SqlClient, {
  apply(_target, _thisArg, args) {
    return runQuery(args as unknown[]);
  },
  get(_target, prop, receiver) {
    const client = getClient();
    const value = Reflect.get(client as object, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
}) as SqlClient;

/**
 * `sql.json()` is typed against postgres.js's `JSONValue`, which requires
 * an index signature our domain interfaces (Product, Order, ...) don't
 * have — they're still plain serializable data, just not structurally
 * typed that way. This cast documents that gap in one place instead of
 * an `as unknown` at every call site.
 */
export function jsonb(value: unknown): postgres.Parameter {
  return sql.json(value as postgres.JSONValue);
}
