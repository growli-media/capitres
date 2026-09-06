import "server-only";
import { sql } from "@/lib/db/client";
import { pick, type LocalizedString } from "@/lib/content";

/** Admin-editable legal/help pages (privacy, terms, shipping-returns,
 * size-guide) — kept separate from the catalog module since these aren't
 * shop entities, not a product/collection/post variant. */
export interface LegalPage {
  slug: string;
  title: LocalizedString;
  body: LocalizedString;
}

interface LegalPageRow {
  slug: string;
  title_en: string;
  title_ar: string;
  title_ku: string;
  body_en: string;
  body_ar: string;
  body_ku: string;
}

function toLegalPage(row: LegalPageRow): LegalPage {
  return {
    slug: row.slug,
    title: { en: row.title_en, ar: row.title_ar, ku: row.title_ku },
    body: { en: row.body_en, ar: row.body_ar, ku: row.body_ku },
  };
}

export async function getLegalPage(slug: string): Promise<LegalPage | undefined> {
  const rows = await sql<LegalPageRow[]>`select * from legal_pages where slug = ${slug} limit 1`;
  return rows[0] ? toLegalPage(rows[0]) : undefined;
}

/** A line starting with "## " becomes a heading, everything else splits
 * into paragraphs on blank lines — just enough structure for
 * shipping-returns' subsections without a rich-text editor. */
export interface LegalContentBlock {
  type: "heading" | "paragraph";
  text: string;
}

export function parseLegalBody(body: string): LegalContentBlock[] {
  return body
    .split(/\n\s*\n/)
    .map((raw) => raw.trim())
    .filter(Boolean)
    .map((block) =>
      block.startsWith("## ")
        ? { type: "heading" as const, text: block.slice(3).trim() }
        : { type: "paragraph" as const, text: block },
    );
}

export function legalPageTitle(page: LegalPage, locale: string): string {
  return pick(page.title, locale);
}

export function legalPageBody(page: LegalPage, locale: string): LegalContentBlock[] {
  return parseLegalBody(pick(page.body, locale));
}
