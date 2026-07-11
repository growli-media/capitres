import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CaretLeft } from "@phosphor-icons/react/dist/ssr";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { catalog } from "@/lib/catalog";
import { pick } from "@/lib/content";
import { formatDateNumeric } from "@/lib/dates";
import ProductCard from "@/components/product/ProductCard";
import ShareButtons from "@/components/blog/ShareButtons";
import { Reveal } from "@/components/motion/Reveal";
import type { PostBlock } from "@/lib/catalog/types";

export async function generateStaticParams() {
  const posts = await catalog.getPosts();
  return routing.locales.flatMap((locale) =>
    posts.map((p) => ({ locale, slug: p.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await catalog.getPost(slug);
  if (!post) return {};
  return {
    title: pick(post.title, locale),
    description: pick(post.excerpt, locale),
    openGraph: { type: "article" },
  };
}

function Block({ block, locale }: { block: PostBlock; locale: string }) {
  switch (block.type) {
    case "h2":
      return (
        <h2 className="text-display mt-12 text-2xl md:text-3xl">
          {pick(block.text, locale)}
        </h2>
      );
    case "quote":
      return (
        <blockquote className="my-10 border-s-2 border-green ps-6">
          <p className="text-display text-xl leading-snug md:text-2xl">
            “{pick(block.text, locale)}”
          </p>
          {block.attribution && (
            <cite className="mt-3 block text-sm not-italic text-ink/65">
              — {pick(block.attribution, locale)}
            </cite>
          )}
        </blockquote>
      );
    case "image":
      return (
        <figure className="my-10">
          <div className="relative aspect-[16/9] overflow-hidden bg-studio">
            <Image
              src={block.image.src}
              alt={pick(block.image.alt, locale)}
              fill
              sizes="(min-width: 768px) 44rem, 100vw"
              className="object-cover"
            />
          </div>
        </figure>
      );
    default:
      return (
        <p className="mt-6 text-[1.0625rem] leading-[1.85] text-ink/80">
          {pick(block.text, locale)}
        </p>
      );
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const post = await catalog.getPost(slug);
  if (!post) notFound();

  const [t, tProduct, allProducts] = await Promise.all([
    getTranslations({ locale, namespace: "blog" }),
    getTranslations({ locale, namespace: "product" }),
    catalog.getProducts(),
  ]);

  const related = allProducts.filter((p) =>
    post.relatedProductSlugs.includes(p.slug),
  );

  return (
    <article>
      {/* Cover */}
      <header className="relative overflow-hidden bg-ink text-paper">
        <Image
          src={post.cover.src}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-45"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-ink/30"
        />
        <div className="container-x relative flex min-h-[56dvh] flex-col justify-end pb-12 pt-32">
          <Link
            href="/blog"
            className="mb-8 inline-flex items-center gap-1.5 text-sm font-semibold text-paper/70 transition-colors hover:text-paper"
          >
            <CaretLeft size={14} aria-hidden="true" className="rtl:-scale-x-100" />
            {t("backToJournal")}
          </Link>
          <div className="flex items-center gap-3 text-xs text-paper/60">
            <span className="price">{formatDateNumeric(post.date, locale)}</span>
            <span aria-hidden="true">·</span>
            <span>{t("readingTime", { min: post.readingMinutes })}</span>
            <span aria-hidden="true">·</span>
            <span>{post.author}</span>
          </div>
          <h1 className="text-display mt-4 max-w-4xl text-[clamp(2.25rem,6.5vw,5.5rem)]">
            {pick(post.title, locale)}
          </h1>
        </div>
      </header>

      {/* Body */}
      <div className="container-x py-14 md:py-20">
        <div className="mx-auto max-w-2xl">
          <p className="text-xl leading-relaxed text-ink/85 md:text-2xl md:leading-relaxed">
            {pick(post.excerpt, locale)}
          </p>
          <div className="mt-2">
            {post.body.map((block, i) => (
              <Block key={i} block={block} locale={locale} />
            ))}
          </div>

          <div className="mt-14 border-t border-line pt-8">
            <ShareButtons title={pick(post.title, locale)} />
          </div>
        </div>
      </div>

      {/* Shop the story */}
      {related.length > 0 && (
        <section className="border-t border-line py-16 md:py-24">
          <div className="container-x">
            <Reveal>
              <h2 className="text-display mb-10 text-3xl md:text-4xl">
                {tProduct("related")}
              </h2>
            </Reveal>
            <ul className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
              {related.map((p) => (
                <li key={p.id}>
                  <ProductCard
                    product={p}
                    sizes="(min-width: 1024px) 25vw, 50vw"
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </article>
  );
}
