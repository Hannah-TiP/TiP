'use client';

import Link from 'next/link';
import Footer from '@/components/Footer';
import CroppedImage from '@/components/hotel/CroppedImage';
import FaqAccordion from '@/components/hotel/FaqAccordion';
import { getImageUrl, getLocalizedText } from '@/types/common';
import type { BodyBlock, MagazineArticle, MagazineArticleDetail } from '@/types/magazine';
import type { FaqItem } from '@/types/hotel';
import { useLanguage } from '@/contexts/LanguageContext';
import MagazineRelationSections from '@/components/magazine/MagazineRelationSections';
import MagazineGuideSteps from '@/components/magazine/MagazineGuideSteps';
import MagazineTypeMeta from '@/components/magazine/MagazineTypeMeta';

interface MagazineArticleContentProps {
  detail: MagazineArticleDetail;
}

/**
 * Normalize the article's `faqs` (whose fields are optional MLS) into the
 * `FaqItem[]` the shared `FaqAccordion` expects, dropping any entry missing a
 * question or answer. This is the SAME payload the `FAQPage` JSON-LD is built
 * from — parity is asserted in the JSON-LD unit test.
 */
function toFaqItems(faqs: MagazineArticle['faqs']): FaqItem[] {
  return (faqs ?? [])
    .filter((faq) => faq.question && faq.answer)
    .map((faq) => ({ question: faq.question!, answer: faq.answer! }));
}

/**
 * Minimal per-block-type body renderer. Only a small known subset is handled;
 * unknown block types render nothing (forward-compat — MAG-3/4 may add block
 * types this consumer predates). This is NOT a WYSIWYG consumer.
 */
function BodyBlockView({ block, lang }: { block: BodyBlock; lang: 'en' | 'kr' }) {
  const heading = getLocalizedText(block.heading, lang);
  const text = getLocalizedText(block.text, lang);
  const isQuote = block.type === 'quote';

  switch (block.type) {
    case 'rich_text':
    case 'section':
    case 'quote':
    case 'callout': {
      if (!heading && !text) return null;

      return (
        <section className="mb-10">
          {heading && (
            <h2 className="mb-5 font-primary text-[26px] italic leading-snug text-green-dark md:text-[32px]">
              {heading}
            </h2>
          )}
          {text && (
            <p
              className={
                isQuote
                  ? 'whitespace-pre-line border-l-2 border-gold pl-5 font-primary text-[22px] italic leading-relaxed text-green-dark'
                  : 'whitespace-pre-line text-[15px] leading-[1.85] text-gray-text'
              }
            >
              {text}
            </p>
          )}
        </section>
      );
    }
    case 'comparison_table': {
      if (!heading && !text) return null;

      const rows = (text ?? '')
        .split('\n')
        .map((line) =>
          line
            .trim()
            .replace(/^\||\|$/g, '')
            .split('|')
            .map((cell) => cell.trim()),
        )
        .filter((row) => row.length > 1);

      const headerRow = rows[0] ?? [];
      const hasMarkdownSeparator = rows[1]?.every((cell) => /^:?-{3,}:?$/.test(cell));
      const bodyRows = rows.slice(hasMarkdownSeparator ? 2 : 1);

      return (
        <section className="mb-10">
          {heading && (
            <h2 className="mb-5 font-primary text-[26px] italic leading-snug text-green-dark md:text-[32px]">
              {heading}
            </h2>
          )}

          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="min-w-[720px] w-full border-collapse text-left text-[14px]">
              <thead className="bg-green-dark text-white">
                <tr>
                  {headerRow.map((cell, index) => (
                    <th key={index} className="whitespace-nowrap px-4 py-3 font-semibold">
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {bodyRows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-t border-gray-200 even:bg-gray-50">
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="whitespace-nowrap px-4 py-3 text-gray-text">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      );
    }
    case 'cta':
      if (!heading && !text) return null;
      return (
        <div className="mb-8">
          {heading && (
            <h2 className="mb-3 font-primary text-[26px] italic leading-snug text-green-dark md:text-[32px]">
              {heading}
            </h2>
          )}
          {text && (
            <p
              className={
                isQuote
                  ? 'border-l-2 border-gold pl-5 font-primary text-[22px] italic leading-relaxed text-green-dark'
                  : 'whitespace-pre-line text-[15px] leading-[1.85] text-gray-text'
              }
            >
              {text}
            </p>
          )}
        </div>
      );
    case 'image': {
      if (!block.image) return null;
      return (
        <figure className="mb-8">
          <div className="relative aspect-[16/9] overflow-hidden rounded-xl">
            <CroppedImage
              src={getImageUrl(block.image)}
              crop={block.image.crop}
              alt={getLocalizedText(block.image.alt, lang) || heading || ''}
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>
          {text && <figcaption className="mt-2 text-[13px] text-gray-text">{text}</figcaption>}
        </figure>
      );
    }
    case 'gallery': {
      const images = block.images ?? [];
      if (images.length === 0) return null;
      return (
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3">
          {images.map((image, index) => (
            <div key={index} className="relative aspect-[4/3] overflow-hidden rounded-xl">
              <CroppedImage
                src={getImageUrl(image)}
                crop={image.crop}
                alt={getLocalizedText(image.alt, lang) || heading || ''}
                sizes="(max-width: 768px) 50vw, 33vw"
              />
            </div>
          ))}
        </div>
      );
    }
    default:
      // Unknown / unsupported block type — render nothing.
      return null;
  }
}

export default function MagazineArticleContent({ detail }: MagazineArticleContentProps) {
  const { t, lang } = useLanguage();
  const { article } = detail;

  const title = getLocalizedText(article.title, lang) || article.slug;
  const summary = getLocalizedText(article.summary, lang);
  const heroAlt = getLocalizedText(article.hero_alt, lang) || title;
  const takeaways = (article.key_takeaways ?? [])
    .map((takeaway) => getLocalizedText(takeaway.text, lang))
    .filter((text): text is string => !!text);
  const bodyBlocks = article.body ?? [];
  const faqItems = toFaqItems(article.faqs);
  const tags = (article.tags ?? [])
    .map((tag) => getLocalizedText(tag, lang))
    .filter((tag): tag is string => !!tag);

  const dateFormatter = new Intl.DateTimeFormat(lang === 'kr' ? 'ko-KR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formatDate = (iso?: string | null): string => {
    if (!iso) return '';
    const parsed = new Date(iso);
    if (Number.isNaN(parsed.getTime())) return '';
    return dateFormatter.format(parsed);
  };
  const publishedLabel = formatDate(article.published_at);
  const updatedLabel = formatDate(article.updated_at);

  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section
        className="relative aspect-video max-h-[70vh] min-h-[360px] w-full overflow-hidden"
        data-testid="magazine-hero"
      >
        {article.hero_image ? (
          <CroppedImage
            src={getImageUrl(article.hero_image)}
            crop={article.hero_image.crop}
            alt={heroAlt}
            sizes="100vw"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-green-dark" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 z-10 flex flex-col justify-end px-4 pb-10 md:px-10 md:pb-16">
          <div className="mx-auto w-full max-w-4xl">
            <span className="mb-3 inline-block w-fit rounded-full bg-gold/90 px-4 py-1.5 text-[11px] font-semibold tracking-[2px] text-white">
              {t('magazine.eyebrow')}
            </span>
            <h1 className="font-primary text-[36px] font-normal italic leading-tight text-white md:text-[56px]">
              {title}
            </h1>
            {summary && (
              <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/70 md:text-[16px]">
                {summary}
              </p>
            )}
          </div>
        </div>
      </section>

      <article className="mx-auto max-w-4xl px-4 py-10 md:px-10 md:py-16">
        {/* Publish / update dates */}
        {(publishedLabel || updatedLabel) && (
          <div className="mb-8 flex flex-wrap gap-x-6 gap-y-1 text-[12px] text-gray-text">
            {publishedLabel && (
              <span>
                {t('magazine.published')}{' '}
                <time dateTime={article.published_at ?? undefined}>{publishedLabel}</time>
              </span>
            )}
            {updatedLabel && (
              <span>
                {t('magazine.updated')}{' '}
                <time dateTime={article.updated_at ?? undefined}>{updatedLabel}</time>
              </span>
            )}
          </div>
        )}

        {/* Type-specific header meta (News dateline + category; Insider topic). */}
        <MagazineTypeMeta article={article} publishedLabel={publishedLabel} />

        {/* Key Takeaways — pinned near the top */}
        {takeaways.length > 0 && (
          <section
            className="mb-12 rounded-2xl border border-gray-border bg-gray-light p-6 md:p-8"
            data-testid="magazine-key-takeaways"
          >
            <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[4px] text-gold">
              {t('magazine.key_takeaways_title')}
            </h2>
            <ul className="space-y-3">
              {takeaways.map((takeaway, index) => (
                <li key={index} className="flex gap-3 text-[15px] leading-relaxed text-green-dark">
                  <span aria-hidden="true" className="mt-1 text-gold">
                    ✦
                  </span>
                  <span>{takeaway}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Body */}
        {bodyBlocks.length > 0 && (
          <div data-testid="magazine-body">
            {bodyBlocks.map((block, index) => (
              <BodyBlockView key={index} block={block} lang={lang} />
            ))}
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2" data-testid="magazine-tags">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="rounded-full bg-gray-light px-3 py-1 text-[12px] text-gray-text"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </article>

      {/* Guide type module: ordered steps (label, title, body, optional hotel
          card). Renders nothing for non-Guide types / a Guide with no steps. */}
      <MagazineGuideSteps detail={detail} />

      {/* Relation-driven sections: ranked / linked hotels, related stories,
          cluster up-link. Each block self-hides when its source is empty.
          Collection's ordered hotels render here as the ranked section. */}
      <MagazineRelationSections relations={detail.relations} related={detail.related} />

      {/* FAQ accordion (client island) */}
      {faqItems.length > 0 && (
        <section className="bg-gray-light px-4 py-14 md:px-10 md:py-20" data-testid="magazine-faq">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-6 text-center font-primary text-[32px] italic text-green-dark md:text-[40px]">
              {t('magazine.faq_title')}
            </h2>
            <div className="rounded-xl bg-white p-6 md:p-8">
              <FaqAccordion faqs={faqItems} lang={lang} />
            </div>
          </div>
        </section>
      )}

      {/* Concierge CTA */}
      <section className="bg-green-dark px-4 py-16 md:px-10 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-primary text-[32px] italic leading-tight text-[#FAF5EF] md:text-[48px]">
            {t('magazine.cta_title')}
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-white/60">{t('magazine.cta_body')}</p>
          <Link
            href="/concierge"
            className="mt-8 inline-block rounded-full bg-white px-8 py-4 text-[13px] font-semibold text-green-dark transition-opacity hover:opacity-90"
          >
            {t('magazine.cta_button')}
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
