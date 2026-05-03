'use client';

interface StickyBookingBarProps {
  perksLabel: string;
  perksSubtitle?: string;
  ctaLabel: string;
  onReserveClick: () => void;
}

export default function StickyBookingBar({
  perksLabel,
  perksSubtitle,
  ctaLabel,
  onReserveClick,
}: StickyBookingBarProps) {
  return (
    <div
      className="sticky top-0 z-40 flex items-center justify-between gap-4 bg-green-dark px-10 py-4"
      role="complementary"
      aria-label="Booking summary"
    >
      <div className="text-white">
        <p className="text-[12px] font-semibold uppercase tracking-[2px] text-gold">{perksLabel}</p>
        {perksSubtitle && <p className="mt-1 text-[13px] text-white/70">{perksSubtitle}</p>}
      </div>
      <button
        type="button"
        onClick={onReserveClick}
        className="bg-gold px-6 py-3 text-[12px] font-semibold uppercase tracking-[2px] text-white transition-opacity hover:opacity-90"
      >
        {ctaLabel}
      </button>
    </div>
  );
}
