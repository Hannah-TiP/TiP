'use client';

import { useState } from 'react';
import { getLocalizedText } from '@/types/common';
import type { FaqItem } from '@/types/hotel';

interface FaqAccordionProps {
  faqs: FaqItem[];
}

export default function FaqAccordion({ faqs }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <ul className="divide-y divide-gray-border border-y border-gray-border">
      {faqs.map((faq, index) => {
        const isOpen = index === openIndex;
        const question = getLocalizedText(faq.question);
        const answer = getLocalizedText(faq.answer);
        return (
          <li key={`${question}-${index}`}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-4 py-4 text-left text-[15px] font-medium text-green-dark"
            >
              <span>{question}</span>
              <span aria-hidden="true" className="text-[20px] text-gold">
                {isOpen ? '−' : '+'}
              </span>
            </button>
            {isOpen && answer && (
              <div className="pb-4 text-[14px] leading-[1.85] text-gray-text">{answer}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
