import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <div className="container-x flex min-h-[60dvh] flex-col items-center justify-center py-24 text-center">
      <p className="text-display text-[clamp(4rem,18vw,12rem)] text-ink/10">
        404
      </p>
      <h1 className="text-display mt-2 text-3xl md:text-5xl">{t("title")}</h1>
      <p className="mt-4 max-w-md text-ink/60">{t("body")}</p>
      <Link href="/shop" className="btn btn-ink mt-8">
        {t("cta")}
      </Link>
    </div>
  );
}
