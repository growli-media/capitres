import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { orderStore } from "@/lib/orders/store";
import { formatIQD } from "@/lib/money";
import MockPayActions from "@/components/checkout/MockPayActions";
import logoMark from "@/images/brand/logo.png";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout" });
  return { title: t("mock.title"), robots: { index: false } };
}

/**
 * Local stand-in for checkout.thewayl.com used while WAYL_API_TOKEN is
 * unset. Lets the whole order → payment → confirmation loop run offline.
 */
export default async function MockPayPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { ref } = await searchParams;
  if (!ref) notFound();

  const order = await orderStore.get(ref);
  if (!order || !order.mock) notFound();

  const t = await getTranslations({ locale, namespace: "checkout" });

  return (
    <div className="container-x flex min-h-[70dvh] items-center justify-center py-16">
      <div className="w-full max-w-lg border border-line bg-white">
        {/* Faux gateway chrome */}
        <div className="flex items-center justify-between border-b border-line bg-ink px-6 py-4 text-paper">
          <p className="text-sm font-black uppercase tracking-widest">Wayl</p>
          <span className="text-eyebrow bg-terracotta px-2 py-1 text-white">
            TEST
          </span>
        </div>

        <div className="p-7">
          <div className="flex items-center gap-3">
            <Image src={logoMark} alt="" width={36} height={36} />
            <div>
              <h1 className="text-lg font-bold">{t("mock.title")}</h1>
            </div>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-ink/65">
            {t("mock.body")}
          </p>

          <dl className="mt-6 space-y-3 border-y border-line py-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink/65">{t("mock.reference")}</dt>
              <dd className="price font-bold">{order.ref}</dd>
            </div>
            <div className="flex justify-between text-base">
              <dt className="font-semibold">{t("mock.amount")}</dt>
              <dd className="price font-black">
                {formatIQD(order.totals.total, locale)}
              </dd>
            </div>
          </dl>

          <div className="mt-6">
            <MockPayActions orderRef={order.ref} />
          </div>
        </div>
      </div>
    </div>
  );
}
