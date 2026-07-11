import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import PolicyShell from "@/components/policy/PolicyShell";
import { localizeDigits } from "@/lib/money";

const TEES: [string, number, number, number][] = [
  ["S", 54, 68, 20],
  ["M", 57, 70, 21],
  ["L", 60, 72, 22],
  ["XL", 63, 74, 23],
  ["2XL", 66, 76, 24],
];

const OUTERWEAR: [string, number, number, number][] = [
  ["M", 60, 68, 62],
  ["L", 63, 70, 63.5],
  ["XL", 66, 72, 65],
  ["2XL", 69, 74, 66.5],
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "policies" });
  return { title: t("sizeGuideTitle") };
}

export default async function SizeGuidePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "policies" });

  function Table({
    caption,
    rows,
  }: {
    caption: string;
    rows: [string, number, number, number][];
  }) {
    return (
      <div>
        <h2 className="text-display mb-4 text-xl md:text-2xl">{caption}</h2>
        <div className="overflow-x-auto border border-line">
          <table className="w-full min-w-[28rem] text-sm">
            <thead>
              <tr className="bg-ink text-start text-paper">
                <th scope="col" className="px-4 py-3 text-start font-semibold">
                  {t("colSize")}
                </th>
                <th scope="col" className="px-4 py-3 text-start font-semibold">
                  {t("colChest")}
                </th>
                <th scope="col" className="px-4 py-3 text-start font-semibold">
                  {t("colLength")}
                </th>
                <th scope="col" className="px-4 py-3 text-start font-semibold">
                  {t("colSleeve")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-white">
              {rows.map(([size, chest, length, sleeve]) => (
                <tr key={size}>
                  <th scope="row" className="px-4 py-3 text-start font-bold">
                    {size}
                  </th>
                  <td className="price px-4 py-3">
                    {localizeDigits(chest, locale)}
                  </td>
                  <td className="price px-4 py-3">
                    {localizeDigits(length, locale)}
                  </td>
                  <td className="price px-4 py-3">
                    {localizeDigits(sleeve, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <PolicyShell title={t("sizeGuideTitle")} intro={t("sizeGuideIntro")}>
      <Table caption={t("teesTitle")} rows={TEES} />
      <Table caption={t("outerwearTitle")} rows={OUTERWEAR} />
      <p className="border-s-2 border-green bg-studio p-5 text-sm leading-relaxed text-ink/70">
        {t("fitNote")}
      </p>
    </PolicyShell>
  );
}
