'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { getLocalizedText } from '@/types/common';
import { guideSteps } from '@/lib/magazine-payload';
import { linkedHotelRelations } from '@/lib/magazine-relations';
import type { MagazineArticleDetail } from '@/types/magazine';
import MagazineHotelCard from '@/components/magazine/MagazineHotelCard';

interface MagazineGuideStepsProps {
  detail: MagazineArticleDetail;
}

/**
 * Guide type module — the ordered steps section (label, title, rich body, and an
 * optional hotel card for a step tied to a hotel). Built from the SAME
 * `guideSteps(...)` payload the HowTo JSON-LD consumes (parity). A step's hotel
 * card reuses the shared `MagazineHotelCard` via the step-synced `kind=linked`
 * relation ref. Renders nothing when the Guide has no steps (forward-compat).
 */
export default function MagazineGuideSteps({ detail }: MagazineGuideStepsProps) {
  const { t, lang } = useLanguage();
  const steps = guideSteps(detail.article);
  if (steps.length === 0) return null;

  const linkedByHotelId = new Map(
    linkedHotelRelations(detail.relations)
      .filter((relation) => relation.hotel)
      .map((relation) => [relation.hotel!.id, relation]),
  );

  return (
    <section className="mx-auto max-w-4xl px-4 pb-6 md:px-10" data-testid="magazine-guide-steps">
      <h2 className="mb-6 text-[11px] font-semibold uppercase tracking-[4px] text-gold">
        {t('magazine.guide_steps_title')}
      </h2>
      <ol className="space-y-8">
        {steps.map((step, index) => {
          const label = getLocalizedText(step.label, lang);
          const title = getLocalizedText(step.title, lang);
          const body = getLocalizedText(step.body, lang);
          const relation = step.hotel_id != null ? linkedByHotelId.get(step.hotel_id) : undefined;
          return (
            <li key={index} data-testid="magazine-guide-step">
              {label && (
                <span className="mb-2 inline-block rounded-full bg-green-dark px-3 py-1 text-[11px] font-semibold tracking-wider text-white">
                  {label}
                </span>
              )}
              {title && (
                <h3 className="mb-2 font-primary text-[24px] italic leading-snug text-green-dark md:text-[28px]">
                  {title}
                </h3>
              )}
              {body && (
                <p className="whitespace-pre-line text-[15px] leading-[1.85] text-gray-text">
                  {body}
                </p>
              )}
              {relation && (
                <div className="mt-4">
                  <MagazineHotelCard relation={relation} lang={lang} />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
