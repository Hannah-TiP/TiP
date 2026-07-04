'use client';

interface JourneySectionHeaderProps {
  overline: string;
  title?: string;
}

export default function JourneySectionHeader({ overline, title }: JourneySectionHeaderProps) {
  return (
    <div className="mb-10 text-center">
      <span className="text-[11px] font-semibold tracking-[4px] text-gold">{overline}</span>
      {title && (
        <h2 className="mt-3 font-primary text-[30px] italic text-green-dark md:text-[38px]">
          {title}
        </h2>
      )}
    </div>
  );
}
