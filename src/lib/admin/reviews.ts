import "server-only";
import { sql } from "@/lib/db/client";

export interface AdminReview {
  id: string;
  productSlug: string;
  productTitle: string;
  author: string;
  rating: number;
  body: string;
  locale: string | null;
  approved: boolean;
  createdAt: string;
}

interface ReviewRow {
  id: string;
  product_slug: string;
  title_en: string;
  author: string;
  rating: number;
  body: string;
  locale: string | null;
  approved: boolean;
  created_at: string;
}

export async function listAdminReviews(): Promise<AdminReview[]> {
  const rows = await sql<ReviewRow[]>`
    select r.id, r.product_slug, p.title_en, r.author, r.rating, r.body,
           r.locale, r.approved, r.created_at::text as created_at
    from reviews r
    join products p on p.slug = r.product_slug
    order by r.approved asc, r.created_at desc
  `;
  return rows.map((r) => ({
    id: r.id,
    productSlug: r.product_slug,
    productTitle: r.title_en,
    author: r.author,
    rating: r.rating,
    body: r.body,
    locale: r.locale,
    approved: r.approved,
    createdAt: r.created_at,
  }));
}

export async function setReviewApproved(id: string, approved: boolean): Promise<void> {
  await sql`update reviews set approved = ${approved} where id = ${id}`;
}

export async function deleteReview(id: string): Promise<void> {
  await sql`delete from reviews where id = ${id}`;
}
