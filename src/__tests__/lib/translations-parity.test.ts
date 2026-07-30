import { describe, expect, it } from 'vitest';
import en from '@/translations/en.json';
import kr from '@/translations/kr.json';

const enMap = en as Record<string, string>;
const krMap = kr as Record<string, string>;

describe('translation catalogs', () => {
  it('en.json and kr.json have identical key sets', () => {
    expect(Object.keys(krMap).sort()).toEqual(Object.keys(enMap).sort());
  });

  it('hotel detail overline/badge keys are translated (KR differs from EN)', () => {
    const keys = [
      'hotel.breadcrumb_dream_hotels',
      'hotel.tip_certified',
      'hotel.about_overline',
      'hotel.rooms_overline',
      'hotel.amenities_overline',
      'hotel.location_overline',
      'hotel.reviews_overline',
      'hotel.faq_overline',
    ];

    for (const key of keys) {
      expect(krMap[key], `missing KR value for ${key}`).toBeTruthy();
      expect(enMap[key], `missing EN value for ${key}`).toBeTruthy();
      expect(krMap[key], `KR value for ${key} is still untranslated English`).not.toBe(enMap[key]);
    }
  });

  it('account-deletion disclosure keys exist and are translated (SMA-192)', () => {
    const keys = [
      'account.delete.disclosure_title',
      'account.delete.disclosure_intro',
      'account.delete.disclosure_deleted',
      'account.delete.disclosure_retained_intro',
      'account.delete.disclosure_retained_financial',
      'account.delete.disclosure_retained_disputes',
      'account.delete.disclosure_grace',
      'account.delete.disclosure_irreversible',
    ];

    for (const key of keys) {
      expect(krMap[key], `missing KR value for ${key}`).toBeTruthy();
      expect(enMap[key], `missing EN value for ${key}`).toBeTruthy();
      expect(krMap[key], `KR value for ${key} is still untranslated English`).not.toBe(enMap[key]);
    }
  });
});
