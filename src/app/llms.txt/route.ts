import { buildLlmsTxt } from '@/lib/seo/llms-txt';
import { fetchDestinationArticles } from '@/lib/seo/sitemap-fetch';

/** Revalidate at most hourly — the entity block is static, guides are content-derived. */
export const revalidate = 3600;

export async function GET(): Promise<Response> {
  const destinationArticles = await fetchDestinationArticles();
  const body = buildLlmsTxt(destinationArticles);

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
