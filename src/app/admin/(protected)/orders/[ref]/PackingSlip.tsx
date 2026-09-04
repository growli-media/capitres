import type { Order } from "@/lib/orders/order-helpers";
import { customerName, customerAddress } from "@/lib/orders/order-helpers";
import { formatIQD } from "@/lib/money";

/**
 * Print-only — invisible on screen (`hidden print:block`), shown as the
 * sole content when printing (the rest of the page, including the admin
 * chrome in AdminShell.tsx, carries `print:hidden`). No prices beyond
 * the total: a packing slip is what goes in the box, not an invoice.
 */
export default function PackingSlip({ order }: { order: Order }) {
  return (
    <div className="hidden print:block">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-2xl font-bold tracking-tight">CAPITRES</p>
          <p className="text-sm text-slate-500">Packing slip</p>
        </div>
        <div className="text-end text-sm">
          <p className="font-mono font-semibold">{order.ref}</p>
          <p className="text-slate-500">
            {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          </p>
        </div>
      </div>

      <div className="mb-8">
        <p className="mb-1 text-xs font-semibold tracking-wide text-slate-400 uppercase">Ship to</p>
        <p className="font-medium">{customerName(order.customer) || "—"}</p>
        {customerAddress(order.customer) && <p>{customerAddress(order.customer)}</p>}
        {order.customer.phone && <p dir="ltr">{order.customer.phone}</p>}
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-slate-900">
            <th className="py-2 text-start font-semibold">Item</th>
            <th className="py-2 text-start font-semibold">Qty</th>
          </tr>
        </thead>
        <tbody>
          {order.lines.map((line, i) => (
            <tr key={i} className="border-b border-slate-200">
              <td className="py-2.5">
                {line.title}
                {(line.size || line.color) && (
                  <span className="text-slate-500"> — {[line.size, line.color].filter(Boolean).join(" · ")}</span>
                )}
              </td>
              <td className="py-2.5">{line.qty}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 flex justify-end border-t-2 border-slate-900 pt-2 text-sm font-semibold">
        <span className="price">Total: {formatIQD(order.totals.total, "en")}</span>
      </div>

      {order.customer.notes && (
        <div className="mt-8 border-t border-slate-200 pt-3 text-sm">
          <p className="font-semibold">Customer note</p>
          <p>{order.customer.notes}</p>
        </div>
      )}
    </div>
  );
}
