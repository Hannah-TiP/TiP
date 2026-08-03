import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { languageHeader } from '@/lib/proxy-language';

describe('languageHeader', () => {
  it('returns a Language header when ?language= is present', () => {
    const request = new Request('http://localhost:3000/api/profile?language=kr');
    expect(languageHeader(request)).toEqual({ Language: 'kr' });
  });

  it('returns an empty object when ?language= is absent (forward, never invent)', () => {
    const request = new Request('http://localhost:3000/api/profile');
    expect(languageHeader(request)).toEqual({});
  });

  it('returns an empty object for an empty ?language= value', () => {
    const request = new Request('http://localhost:3000/api/profile?language=');
    expect(languageHeader(request)).toEqual({});
  });

  it('reads the param alongside other query params', () => {
    const request = new Request('http://localhost:3000/api/quotes?trip_id=7&language=en');
    expect(languageHeader(request)).toEqual({ Language: 'en' });
  });

  it('works with NextRequest instances', () => {
    const request = new NextRequest('http://localhost:3000/api/trip/list?language=kr');
    expect(languageHeader(request)).toEqual({ Language: 'kr' });
  });

  it('spreads to no header entry when absent', () => {
    const request = new Request('http://localhost:3000/api/trip/1');
    const headers = { 'Content-Type': 'application/json', ...languageHeader(request) };
    expect(headers).not.toHaveProperty('Language');
  });
});
