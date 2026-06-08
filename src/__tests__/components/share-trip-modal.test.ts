import { describe, it, expect } from 'vitest';
import { parseEmails } from '@/components/ShareTripModal';

describe('parseEmails', () => {
  it('splits on commas, semicolons, and whitespace', () => {
    expect(parseEmails('a@x.com, b@x.com; c@x.com\nd@x.com')).toEqual([
      'a@x.com',
      'b@x.com',
      'c@x.com',
      'd@x.com',
    ]);
  });

  it('trims tokens and drops empties', () => {
    expect(parseEmails('  a@x.com ,,  b@x.com  ')).toEqual(['a@x.com', 'b@x.com']);
  });

  it('returns an empty array for blank input', () => {
    expect(parseEmails('   ')).toEqual([]);
    expect(parseEmails('')).toEqual([]);
  });
});
