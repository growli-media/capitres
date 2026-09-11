/**
 * Shown immediately while /shop's Server Component is fetching — without
 * this, App Router gives zero visual feedback during that wait (no
 * loading.tsx anywhere previously meant every nav either felt instant or,
 * on a slow connection, felt completely frozen with the old page still on
 * screen). Mirrors the real page's layout (eyebrow/title row, filter bar,
 * product grid) so the swap-in doesn't jump.
 */
export default function ShopLoading() {
  return (
    <>
      <section className="container-x pb-8 pt-14 md:pb-12 md:pt-20">
        <div className="mb-3 h-3 w-24 animate-pulse bg-ink/10" />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="h-12 w-56 animate-pulse bg-ink/10 md:h-16 md:w-80" />
          <div className="h-4 w-20 animate-pulse bg-ink/10" />
        </div>
      </section>

      <div className="h-16 animate-pulse border-y border-line bg-ink/5" />

      <section className="container-x py-10 md:py-14">
        <div className="mb-6 flex items-center justify-end gap-2">
          <div className="h-9 w-9 animate-pulse border border-line bg-ink/5" />
          <div className="h-9 w-9 animate-pulse border border-line bg-ink/5" />
        </div>
        <ul className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <li key={i}>
              <div className="aspect-[4/5] w-full animate-pulse bg-ink/10" />
              <div className="mt-3 h-4 w-3/4 animate-pulse bg-ink/10" />
              <div className="mt-2 h-4 w-1/4 animate-pulse bg-ink/10" />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
