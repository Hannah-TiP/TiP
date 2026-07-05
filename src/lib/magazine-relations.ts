import type { ExpandedArticleRelation, MagazineRelationArticleRef } from '@/types/magazine';

/**
 * Pure selectors over the expanded `relations[]` payload. These are the SINGLE
 * source of truth for ordering / filtering relations, shared by BOTH the
 * on-screen render and the ItemList JSON-LD so the two can never drift (parity
 * is an explicit acceptance criterion).
 *
 * Missing / unknown / empty relations resolve to empty arrays (or `null`), so
 * every consumer renders nothing and never crashes.
 */

/** Ascending by `position`, stable for equal positions (index order preserved). */
function byPosition(a: ExpandedArticleRelation, b: ExpandedArticleRelation): number {
  return a.position - b.position;
}

/**
 * Ranked hotel relations (Destination pillars) in rank order — only entries
 * whose expanded `hotel` target is populated.
 */
export function rankedHotelRelations(
  relations: ExpandedArticleRelation[] | null | undefined,
): ExpandedArticleRelation[] {
  return (relations ?? []).filter((r) => r.kind === 'ranked' && !!r.hotel).sort(byPosition);
}

/**
 * Linked hotel relations (supporting hotels) in position order — only entries
 * whose expanded `hotel` target is populated.
 */
export function linkedHotelRelations(
  relations: ExpandedArticleRelation[] | null | undefined,
): ExpandedArticleRelation[] {
  return (relations ?? []).filter((r) => r.kind === 'linked' && !!r.hotel).sort(byPosition);
}

/**
 * The parent article reference for the cluster up-link, or `null` when there is
 * no `kind==='parent'` relation with an expanded `article` target.
 */
export function parentArticleRelation(
  relations: ExpandedArticleRelation[] | null | undefined,
): MagazineRelationArticleRef | null {
  const parent = (relations ?? []).find((r) => r.kind === 'parent' && !!r.article);
  return parent?.article ?? null;
}
