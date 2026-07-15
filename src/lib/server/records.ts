import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { sql, jsonb } from "@/lib/db/client";

/**
 * Low-stakes append-only records: newsletter signups, contact messages,
 * back-in-stock notify requests. Postgres-backed in production; the
 * file-based fallback below is local-demo only (see orders/store.ts for
 * why file writes don't survive on Vercel).
 */

export type RecordKind = "newsletter" | "contact" | "restock-notify";

export async function appendRecord(
  kind: RecordKind,
  record: Record<string, unknown>,
): Promise<void> {
  if (process.env.DATABASE_URL) {
    await sql`insert into records (kind, payload) values (${kind}, ${jsonb(record)})`;
    return;
  }

  const DATA_DIR = path.join(process.cwd(), ".data");
  const file = path.join(DATA_DIR, `${kind}.json`);
  let list: unknown[] = [];
  try {
    list = JSON.parse(await fs.readFile(file, "utf8")) as unknown[];
  } catch {
    // first write
  }
  list.push({ ...record, createdAt: new Date().toISOString() });
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(file, JSON.stringify(list, null, 2), "utf8");
}

export interface StoredRecord {
  id: number;
  kind: RecordKind;
  payload: Record<string, unknown>;
  createdAt: string;
}

/** Admin dashboard: latest records of a given kind. */
export async function listRecords(
  kind: RecordKind,
  limit = 200,
): Promise<StoredRecord[]> {
  const rows = await sql<
    { id: number; kind: RecordKind; payload: Record<string, unknown>; created_at: string }[]
  >`
    select id, kind, payload, created_at::text
    from records
    where kind = ${kind}
    order by created_at desc
    limit ${limit}
  `;
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    payload: r.payload,
    createdAt: r.created_at,
  }));
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}
