import { CircleNotch } from "@phosphor-icons/react/dist/ssr";

/**
 * Fallback for every storefront route that doesn't have its own
 * loading.tsx (product pages, collections, journal, ...) — previously
 * App Router gave zero feedback while a Server Component fetch was
 * pending, so a slow navigation looked frozen rather than "loading".
 * /shop has its own layout-matching skeleton (shop/loading.tsx); this one
 * just needs to not be blank.
 */
export default function StorefrontLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <CircleNotch size={32} aria-hidden="true" className="animate-spin text-ink/40" />
    </div>
  );
}
