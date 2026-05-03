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
    render(<FaqAccordion faqs={faqs} />);

    expect(screen.getByRole('button', { name: 'Q1' })).toHaveProperty('ariaExpanded', 'true');
    expect(screen.getByText('A1')).toBeTruthy();
    expect(screen.queryByText('A2')).toBeNull();
    expect(screen.queryByText('A3')).toBeNull();
  });

  it('collapses any other open item when a new one is clicked (one open at a time)', () => {
    render(<FaqAccordion faqs={faqs} />);

    fireEvent.click(screen.getByRole('button', { name: 'Q3' }));
    expect(screen.getByText('A3')).toBeTruthy();
    expect(screen.queryByText('A1')).toBeNull();
    expect(screen.queryByText('A2')).toBeNull();
  });

  it('toggles closed when the same question is clicked twice', () => {
    render(<FaqAccordion faqs={faqs} />);

    fireEvent.click(screen.getByRole('button', { name: 'Q1' }));
    expect(screen.queryByText('A1')).toBeNull();
  });
});
