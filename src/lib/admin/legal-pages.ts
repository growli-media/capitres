import "server-only";
import { sql } from "@/lib/db/client";

/** A fixed 4-row set (privacy, terms, shipping-returns, size-guide) —
 * unlike collections/posts, there's no create or delete here, only edit. */
export interface AdminLegalPageRow {
  slug: string;
  titleEn: string;
  titleAr: string;
  titleKu: string;
  bodyEn: string;
  bodyAr: string;
  bodyKu: string;
  updatedAt: string;
}

interface LegalPageRow {
  slug: string;
  title_en: string;
  title_ar: string;
  title_ku: string;
  body_en: string;
  body_ar: string;
  body_ku: string;
  updated_at: string;
}

function toRow(r: LegalPageRow): AdminLegalPageRow {
  return {
    slug: r.slug,
    titleEn: r.title_en,
    titleAr: r.title_ar,
    titleKu: r.title_ku,
    bodyEn: r.body_en,
    bodyAr: r.body_ar,
    bodyKu: r.body_ku,
    updatedAt: r.updated_at,
  };
}

export async function listAdminLegalPages(): Promise<AdminLegalPageRow[]> {
  const rows = await sql<LegalPageRow[]>`select * from legal_pages order by slug`;
  return rows.map(toRow);
}

export async function getAdminLegalPage(slug: string): Promise<AdminLegalPageRow | undefined> {
  const rows = await sql<LegalPageRow[]>`select * from legal_pages where slug = ${slug} limit 1`;
  return rows[0] ? toRow(rows[0]) : undefined;
}

export interface LegalPageInput {
  titleEn: string;
  titleAr: string;
  titleKu: string;
  bodyEn: string;
  bodyAr: string;
  bodyKu: string;
}

export async function updateLegalPage(slug: string, input: LegalPageInput): Promise<void> {
  await sql`
    update legal_pages set
      title_en = ${input.titleEn}, title_ar = ${input.titleAr}, title_ku = ${input.titleKu},
      body_en = ${input.bodyEn}, body_ar = ${input.bodyAr}, body_ku = ${input.bodyKu},
      updated_at = now()
    where slug = ${slug}
  `;
}
