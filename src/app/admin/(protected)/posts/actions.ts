"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createPost,
  deletePostPermanently,
  postSlugExists,
  setPostPublished,
  updatePost,
  type AdminPostBlock,
  type AdminPostImage,
  type PostInput,
} from "@/lib/admin/posts";
import { requirePermission } from "@/lib/admin/permissions";
import { logAdminActivity } from "@/lib/admin/activity";

export interface FormState {
  error?: string;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function loc(formData: FormData, base: string): { en: string; ar: string; ku: string } {
  return {
    en: String(formData.get(`${base}En`) ?? "").trim(),
    ar: String(formData.get(`${base}Ar`) ?? "").trim(),
    ku: String(formData.get(`${base}Ku`) ?? "").trim(),
  };
}

/** The block array is heterogeneous by `type`, unlike collections' photo
 * rows — a single JSON blob (built client-side in PostForm) is simpler and
 * safer here than trying to zip several parallel FormData arrays back
 * together, since each block shape has different fields. Never trust it
 * blindly: every block is re-validated by shape below before it's allowed
 * anywhere near the database. */
function parseBody(raw: string): AdminPostBlock[] | { error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: "The post body is malformed — try reloading the page." };
  }
  if (!Array.isArray(parsed)) return { error: "The post body is malformed — try reloading the page." };

  const blocks: AdminPostBlock[] = [];
  for (const b of parsed) {
    if (!b || typeof b !== "object" || typeof (b as { type?: unknown }).type !== "string") {
      return { error: "The post body is malformed — try reloading the page." };
    }
    const block = b as Record<string, unknown>;
    const isLoc = (v: unknown): v is { en: string; ar: string; ku: string } =>
      !!v && typeof v === "object" && typeof (v as { en?: unknown }).en === "string";

    switch (block.type) {
      case "p":
      case "h2":
        if (!isLoc(block.text)) return { error: "A text block is missing content." };
        blocks.push({ type: block.type, text: block.text });
        break;
      case "quote":
        if (!isLoc(block.text)) return { error: "A quote block is missing content." };
        blocks.push({
          type: "quote",
          text: block.text,
          attribution: isLoc(block.attribution) ? block.attribution : undefined,
        });
        break;
      case "image": {
        const img = block.image as { url?: unknown; alt?: unknown } | undefined;
        if (!img || typeof img.url !== "string" || !img.url.trim() || !isLoc(img.alt)) {
          return { error: "An image block is missing a photo." };
        }
        blocks.push({ type: "image", image: { url: img.url, alt: img.alt } });
        break;
      }
      case "video": {
        if (typeof block.url !== "string" || !block.url.trim()) {
          return { error: "A video block is missing a video." };
        }
        const poster = block.poster as { url?: unknown; alt?: unknown } | undefined;
        const hasPoster = poster && typeof poster.url === "string" && poster.url.trim();
        blocks.push({
          type: "video",
          url: block.url,
          poster: hasPoster
            ? { url: poster.url as string, alt: isLoc(poster!.alt) ? poster!.alt : { en: "", ar: "", ku: "" } }
            : undefined,
        });
        break;
      }
      case "link":
        if (typeof block.url !== "string" || !block.url.trim() || !isLoc(block.label)) {
          return { error: "A link block is missing a URL or label." };
        }
        blocks.push({ type: "link", url: block.url, label: block.label });
        break;
      default:
        return { error: "The post body contains an unrecognized block." };
    }
  }
  return blocks;
}

function parseInput(formData: FormData, fallbackSlug: string): PostInput | { error: string } {
  const title = loc(formData, "title");
  if (!title.en || !title.ar || !title.ku) {
    return { error: "Title is required in all three languages." };
  }

  const excerpt = loc(formData, "excerpt");
  if (!excerpt.en || !excerpt.ar || !excerpt.ku) {
    return { error: "Excerpt is required in all three languages." };
  }

  const slug = slugify(String(formData.get("slug") ?? "") || fallbackSlug || title.en);
  if (!slug) return { error: "Couldn't derive a URL slug — please set one." };

  const coverUrl = String(formData.get("coverUrl") ?? "").trim();
  if (!coverUrl) return { error: "Add a cover photo (upload or paste a URL)." };
  const coverAlt = loc(formData, "coverAlt");
  const cover: AdminPostImage = {
    url: coverUrl,
    altEn: coverAlt.en || title.en,
    altAr: coverAlt.ar || title.ar,
    altKu: coverAlt.ku || title.ku,
  };

  const postDate = String(formData.get("postDate") ?? "").trim();
  if (!postDate) return { error: "Set a publish date." };

  const readingMinutes = Number(formData.get("readingMinutes") ?? 3);
  if (!Number.isFinite(readingMinutes) || readingMinutes < 1) {
    return { error: "Reading time must be a positive number." };
  }

  const author = String(formData.get("author") ?? "").trim();
  if (!author) return { error: "Set an author." };

  const bodyRaw = String(formData.get("bodyJson") ?? "[]");
  const body = parseBody(bodyRaw);
  if ("error" in body) return body;

  const relatedProductSlugs = formData.getAll("relatedProductSlugs").map(String);

  const intent = String(formData.get("intent") ?? "draft");
  const published = intent === "publish";

  return {
    slug,
    titleEn: title.en,
    titleAr: title.ar,
    titleKu: title.ku,
    excerptEn: excerpt.en,
    excerptAr: excerpt.ar,
    excerptKu: excerpt.ku,
    cover,
    postDate,
    readingMinutes: Math.trunc(readingMinutes),
    author,
    body,
    relatedProductSlugs,
    published,
  };
}

function revalidateStorefront() {
  revalidatePath("/", "layout");
}

export async function createPostAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requirePermission("posts");
  const parsed = parseInput(formData, "");
  if ("error" in parsed) return parsed;

  if (await postSlugExists(parsed.slug)) {
    return { error: `The URL "${parsed.slug}" is already used by another post.` };
  }

  await createPost(parsed);
  await logAdminActivity(`${parsed.published ? "Published" : "Drafted"} post "${parsed.titleEn}"`);
  revalidateStorefront();
  redirect(`/admin/posts/${parsed.slug}/edit?created=1`);
}

export async function updatePostAction(
  slug: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requirePermission("posts");
  const parsed = parseInput(formData, slug);
  if ("error" in parsed) return parsed;

  // Slug is read-only from the edit form, but guard server-side too in
  // case of a stale/tampered request.
  parsed.slug = slug;

  await updatePost(slug, parsed);
  await logAdminActivity(`Updated post "${parsed.titleEn}"`);
  revalidateStorefront();
  return {};
}

export async function togglePostPublishedAction(slug: string, published: boolean): Promise<void> {
  await requirePermission("posts");
  await setPostPublished(slug, published);
  await logAdminActivity(`${published ? "Published" : "Unpublished"} post "${slug}"`);
  revalidateStorefront();
}

export async function deletePostAction(slug: string): Promise<void> {
  await requirePermission("posts");
  await deletePostPermanently(slug);
  await logAdminActivity(`Deleted post "${slug}"`);
  revalidateStorefront();
  redirect("/admin/posts?deleted=1");
}
