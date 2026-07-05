import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import FaqAccordion from '@/components/hotel/FaqAccordion';
import type { FaqItem } from '@/types/hotel';

const faqs: FaqItem[] = [
  { question: { en: 'Q1' }, answer: { en: 'A1' } },
  { question: { en: 'Q2' }, answer: { en: 'A2' } },
  { question: { en: 'Q3' }, answer: { en: 'A3' } },
];

afterEach(() => cleanup());

describe('FaqAccordion', () => {
  it('renders all questions and opens the first answer by default', () => {
    render(<FaqAccordion faqs={faqs} lang="en" />);

    expect(screen.getByRole('button', { name: 'Q1' })).toHaveProperty('ariaExpanded', 'true');
    expect(screen.getByText('A1')).toBeTruthy();
    expect(screen.queryByText('A2')).toBeNull();
    expect(screen.queryByText('A3')).toBeNull();
  });

  it('collapses any other open item when a new one is clicked (one open at a time)', () => {
    render(<FaqAccordion faqs={faqs} lang="en" />);

    fireEvent.click(screen.getByRole('button', { name: 'Q3' }));
    expect(screen.getByText('A3')).toBeTruthy();
    expect(screen.queryByText('A1')).toBeNull();
    expect(screen.queryByText('A2')).toBeNull();
  });

  it('toggles closed when the same question is clicked twice', () => {
    render(<FaqAccordion faqs={faqs} lang="en" />);

    fireEvent.click(screen.getByRole('button', { name: 'Q1' }));
    expect(screen.queryByText('A1')).toBeNull();
  });

  it('renders Korean text when lang="kr"', () => {
    const bilingualFaqs: FaqItem[] = [
      { question: { en: 'Q1', kr: '질문1' }, answer: { en: 'A1', kr: '답변1' } },
    ];

    render(<FaqAccordion faqs={bilingualFaqs} lang="kr" />);

    expect(screen.getByRole('button', { name: '질문1' })).toBeTruthy();
    expect(screen.getByText('답변1')).toBeTruthy();
    expect(screen.queryByText('Q1')).toBeNull();
    expect(screen.queryByText('A1')).toBeNull();
  });
});
