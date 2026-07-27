import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/lib/api-client';
import type { MagazineArticleDetail } from '@/types/magazine';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function mockResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  };
}

const detail: MagazineArticleDetail = {
  article: {
    id: 5,
    type: 'destination',
    slug: 'best-hotels-in-japan',
    status: 'published',
    tags: [],
    schema_version: 1,
  },
  relations: [],
  related: [],
  available_locales: ['en', 'kr'],
};

beforeEach(() => {
  mockFetch.mockReset();
});

describe('apiClient.getMagazineArticle', () => {
  it('hits the singular-type proxy path with the language query and unwraps data', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: detail }));

    const result = await apiClient.getMagazineArticle('destination', 'best-hotels-in-japan', 'kr');

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toBe('/api/magazine/articles/destination/best-hotels-in-japan?language=kr');
    expect(result).toEqual(detail);
  });

  it('omits the language query when none is given', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: detail }));

    await apiClient.getMagazineArticle('news', 'a-news-slug');

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toBe('/api/magazine/articles/news/a-news-slug');
  });

  it('throws with the backend message on a 404', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ message: 'Article not found' }, 404));

    await expect(apiClient.getMagazineArticle('guide', 'nope')).rejects.toThrow(
      'Article not found',
    );
  });
});

describe('apiClient.getMagazineArticles (list)', () => {
  const page = {
    items: [detail.article],
    total: 1,
    per_page: 12,
    current_page: 1,
    last_page: 1,
    has_more: false,
  };

  it('maps active filters to the list query and resolves a PaginatedResult', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: page }));

    const result = await apiClient.getMagazineArticles({
      type: 'destination',
      country_id: 3,
      tag: 'honeymoon',
      language: 'kr',
      page: 1,
      per_page: 12,
    });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('/api/magazine/articles?');
    expect(url).toContain('type=destination');
    expect(url).toContain('country_id=3');
    expect(url).toContain('tag=honeymoon');
    expect(url).toContain('language=kr');
    expect(result.items).toEqual([detail.article]);
    expect(result.hasMore).toBe(false);
  });

  it('hits the bare list path when no filters are set', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: page }));
    await apiClient.getMagazineArticles();
    expect(mockFetch.mock.calls[0][0]).toBe('/api/magazine/articles');
  });
});

describe('apiClient.getMagazineFacets', () => {
  it('unwraps the facet options and forwards the language query', async () => {
    const facets = {
      countries: [{ id: 1, name: { en: 'Japan' } }],
      cities: [],
      brands: [],
      tags: [],
    };
    mockFetch.mockResolvedValueOnce(mockResponse({ data: facets }));

    const result = await apiClient.getMagazineFacets('en');

    expect(mockFetch.mock.calls[0][0]).toBe('/api/magazine/facets?language=en');
    expect(result).toEqual(facets);
  });
});
