import { notFound } from "next/navigation";

/** Funnels unknown paths inside a locale to the localized 404 page. */
export default function CatchAll() {
  notFound();
}
