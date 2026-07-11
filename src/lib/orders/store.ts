import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { WaylStatus } from "@/lib/payments/wayl";

/**
 * Order persistence boundary.
 *
 * The default implementation writes JSON to `.data/orders.json`, which is
 * perfect for local development and a single-node deploy. For serverless
 * or multi-instance production, implement `OrderStore` against Postgres
 * (Prisma) or your CMS and swap the export at the bottom — the API routes
 * only ever talk to the interface.
 */

export interface OrderLine {
  productSlug: string;
  title: string;
  size?: string;
  qty: number;
  unitAmount: number;
  giftCard?: {
    denomination: number;
    recipientEmail: string;
    recipientName: string;
    senderName: string;
    message: string;
  };
}

export interface Order {
  ref: string;
  createdAt: string;
  locale: string;
  status: WaylStatus | "MockPaid";
  waylLinkId?: string;
  paymentMethod?: string | null;
  mock: boolean;
  customer: {
    fullName: string;
    email: string;
    phone: string;
    governorate?: string;
    city?: string;
    address?: string;
    notes?: string;
  };
  lines: OrderLine[];
  totals: {
    subtotal: number;
    discount: number;
    shipping: number;
    total: number;
  };
  promoCode?: string;
}

export interface OrderStore {
  create(order: Order): Promise<void>;
  get(ref: string): Promise<Order | undefined>;
  setStatus(
    ref: string,
    status: Order["status"],
    paymentMethod?: string | null,
  ): Promise<Order | undefined>;
}

const DATA_DIR = path.join(process.cwd(), ".data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

async function readAll(): Promise<Record<string, Order>> {
  try {
    const raw = await fs.readFile(ORDERS_FILE, "utf8");
    return JSON.parse(raw) as Record<string, Order>;
  } catch {
    return {};
  }
}

async function writeAll(orders: Record<string, Order>): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf8");
}

const fileOrderStore: OrderStore = {
  async create(order) {
    const all = await readAll();
    all[order.ref] = order;
    await writeAll(all);
  },
  async get(ref) {
    const all = await readAll();
    return all[ref];
  },
  async setStatus(ref, status, paymentMethod) {
    const all = await readAll();
    const order = all[ref];
    if (!order) return undefined;
    order.status = status;
    if (paymentMethod !== undefined) order.paymentMethod = paymentMethod;
    await writeAll(all);
    return order;
  },
};

/** Swap this export to change order persistence. */
export const orderStore: OrderStore = fileOrderStore;

export function newOrderRef(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CPT-${stamp}-${rand}`;
}
