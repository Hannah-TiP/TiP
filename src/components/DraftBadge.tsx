'use client';

/**
 * A small badge overlay shown on draft content cards to distinguish them
 * from published content. Only rendered when the item's status is 'draft'.
 */
export default function DraftBadge({ status }: { status: string }) {
  if (status !== 'draft') return null;

  return (
    <div className="absolute right-3 top-3 z-10 rounded-full bg-amber-500 px-3 py-1 text-[10px] font-bold tracking-wider text-white shadow-sm">
      DRAFT
    </div>
  );
}
