interface SectionTitleProps {
  overline: string;
  title: string;
  id?: string;
}

export default function SectionTitle({ overline, title, id }: SectionTitleProps) {
  return (
    <div className="mb-6 border-b border-gray-border pb-4" id={id}>
      <span className="block text-[11px] font-semibold uppercase tracking-[4px] text-gold">
        {overline}
      </span>
      <h2 className="mt-2 font-primary text-[28px] font-normal italic text-green-dark">{title}</h2>
    </div>
  );
}
