import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Minimal append-only JSON persistence for low-stakes records
 * (newsletter signups, contact messages, product reviews, restock
 * notifications). Same swap-for-a-database story as the order store.
 */

const DATA_DIR = path.join(process.cwd(), ".data");

export async function appendRecord(
  name: "newsletter" | "contact" | "reviews" | "restock-notify",
  record: Record<string, unknown>,
): Promise<void> {
  const file = path.join(DATA_DIR, `${name}.json`);
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

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}
