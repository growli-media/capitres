import type { Metadata } from "next";
import { Star } from "@phosphor-icons/react/dist/ssr";
import { listAdminReviews } from "@/lib/admin/reviews";
import ReviewRowActions from "./ReviewRowActions";

export const metadata: Metadata = { title: "Reviews" };

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={13} weight={i < rating ? "fill" : "regular"} />
      ))}
    </span>
  );
}

export default async function AdminReviewsPage() {
  const reviews = await listAdminReviews();
  const pending = reviews.filter((r) => !r.approved);
  const approved = reviews.filter((r) => r.approved);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reviews</h1>
      <p className="mt-1 text-sm text-slate-500">
        {pending.length > 0
          ? `${pending.length} awaiting approval — nothing shows on the site until you approve it.`
          : "All caught up — nothing waiting for approval."}
      </p>

      {reviews.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 py-16 text-center">
          <p className="text-sm text-slate-500">No reviews yet.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 text-start font-medium">Product</th>
                <th className="px-4 py-3 text-start font-medium">Author</th>
                <th className="px-4 py-3 text-start font-medium">Rating</th>
                <th className="px-4 py-3 text-start font-medium">Review</th>
                <th className="px-4 py-3 text-start font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...pending, ...approved].map((r) => (
                <tr key={r.id}>
                  <td className="max-w-40 truncate px-4 py-3 font-medium text-slate-900">
                    {r.productTitle}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.author}</td>
                  <td className="px-4 py-3">
                    <Stars rating={r.rating} />
                  </td>
                  <td className="max-w-sm px-4 py-3 text-slate-600">
                    <p className="line-clamp-2">{r.body}</p>
                  </td>
                  <td className="px-4 py-3">
                    {r.approved ? (
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                        Published
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <ReviewRowActions id={r.id} approved={r.approved} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
