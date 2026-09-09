/** Pure classification, no I/O — safe to import from client or server. */
export type ReferrerSource = "direct" | "organic_search" | "social" | "referral";

const SEARCH_ENGINE_HOSTS = ["google.", "bing.", "yahoo.", "duckduckgo."];
const SOCIAL_HOSTS = [
  "instagram.com",
  "facebook.com",
  "fb.com",
  "l.facebook.com",
  "tiktok.com",
  "twitter.com",
  "x.com",
  "t.co",
  "pinterest.com",
  "pinterest.",
  "snapchat.com",
  "whatsapp.com",
  "wa.me",
  "telegram.org",
  "t.me",
];

function hostMatches(host: string, needles: string[]): boolean {
  return needles.some((n) => host === n || host.endsWith(`.${n}`) || host.includes(n));
}

/** direct/organic_search/social/referral, from document.referrer and/or
 * a utm_source query param. utm_source wins when present — iOS/Android
 * in-app browsers (exactly where Instagram traffic comes from)
 * routinely strip the Referer header entirely, so a tagged bio link is
 * often the only reliable signal for the traffic this brand cares about
 * most. */
export function classifyReferrer(
  referrerUrl: string | null,
  utmSource: string | null,
  ownHost: string,
): { source: ReferrerSource; referrerHost: string | null } {
  let referrerHost: string | null = null;
  try {
    referrerHost = referrerUrl ? new URL(referrerUrl).hostname.replace(/^www\./, "") : null;
  } catch {
    referrerHost = null;
  }

  const utm = utmSource?.toLowerCase() ?? null;
  if (utm) {
    if (SEARCH_ENGINE_HOSTS.some((s) => utm.includes(s.replace(/\.$/, "")))) {
      return { source: "organic_search", referrerHost };
    }
    if (SOCIAL_HOSTS.some((s) => utm.includes(s.replace(/\.(com|org)$/, "")))) {
      return { source: "social", referrerHost };
    }
  }

  if (!referrerHost || referrerHost === ownHost) return { source: "direct", referrerHost };
  if (hostMatches(referrerHost, SEARCH_ENGINE_HOSTS)) return { source: "organic_search", referrerHost };
  if (hostMatches(referrerHost, SOCIAL_HOSTS)) return { source: "social", referrerHost };
  return { source: "referral", referrerHost };
}
