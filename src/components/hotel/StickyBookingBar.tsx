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
      className="sticky top-0 z-40 flex flex-col items-center gap-3 bg-green-dark px-4 py-4 sm:flex-row sm:justify-between sm:gap-4 md:px-10"
      role="complementary"
      aria-label="Booking summary"
    >
      <div className="text-center text-white sm:text-left">
        <p className="text-[12px] font-semibold uppercase tracking-[2px] text-gold">{perksLabel}</p>
        {perksSubtitle && <p className="mt-1 text-[13px] text-white/70">{perksSubtitle}</p>}
      </div>
      <button
        type="button"
        onClick={onReserveClick}
        className="flex min-h-[44px] w-full items-center justify-center bg-gold px-6 py-3 text-[12px] font-semibold uppercase tracking-[2px] text-white transition-opacity hover:opacity-90 sm:w-auto"
      >
        {ctaLabel}
      </button>
    </div>
  );
}
