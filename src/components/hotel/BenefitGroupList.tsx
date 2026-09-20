import type { BenefitGroup } from '@/lib/hotel-benefits';

interface BenefitGroupListProps {
  groups: BenefitGroup[];
}

/**
 * Body of the "TiP exclusive benefits" box (SMA-467): one block per benefit
 * program — the program name (and its "valid …" label) as a sub-heading, then
 * that program's bullets. Shared by the sidebar BookingCard and the
 * below-the-fold HotelBenefits box so both read identically.
 */
export default function BenefitGroupList({ groups }: BenefitGroupListProps) {
  return (
    <div className="mt-3 space-y-3">
      {groups.map((group, groupIndex) => (
        <div key={groupIndex} data-testid="benefit-program-group">
          {(group.name || group.eligibility) && (
            <p className="text-[12px] font-semibold uppercase tracking-[1px] text-white">
              {group.name}
              {group.eligibility && (
                <span className="ml-1 font-normal normal-case tracking-normal text-white/60">
                  ({group.eligibility})
                </span>
              )}
            </p>
          )}
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {group.items.map((item, itemIndex) => (
              <li key={itemIndex} className="text-white/85">
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
