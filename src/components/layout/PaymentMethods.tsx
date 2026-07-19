/**
 * "Accepted payments" strip for the footer. Payment-network marks are
 * rendered inline (no external assets) as a trust signal — Wayl settles
 * all of these. The Iraqi wallets are shown as clean wordmarks; swap in
 * official SVGs later if exact branding is wanted.
 */
function Card({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-7 items-center justify-center rounded-md bg-white px-2.5 shadow-sm">
      {children}
    </span>
  );
}

export default function PaymentMethods() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Visa */}
      <Card>
        <span className="text-[13px] font-bold italic tracking-tight text-[#1434CB]">
          VISA
        </span>
      </Card>

      {/* Mastercard */}
      <Card>
        <svg viewBox="0 0 30 20" className="h-4" aria-label="Mastercard" role="img">
          <circle cx="11.5" cy="10" r="7" fill="#EB001B" />
          <circle cx="18.5" cy="10" r="7" fill="#F79E1B" />
          <path
            d="M15 4.6a7 7 0 0 0 0 10.8 7 7 0 0 0 0-10.8Z"
            fill="#FF5F00"
          />
        </svg>
      </Card>

      {/* ZainCash */}
      <Card>
        <span className="text-[12px] font-bold tracking-tight">
          <span className="text-[#8A1A9B]">Zain</span>
          <span className="text-slate-800">Cash</span>
        </span>
      </Card>

      {/* FIB */}
      <Card>
        <span className="text-[12px] font-black tracking-tight text-slate-900">
          FIB
        </span>
      </Card>

      {/* Cash on delivery */}
      <Card>
        <span className="flex items-center gap-1 text-slate-700">
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <circle cx="12" cy="12" r="2.5" />
          </svg>
          <span className="text-[12px] font-semibold">Cash</span>
        </span>
      </Card>
    </div>
  );
}
