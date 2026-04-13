import type { Hotel } from '@/types/hotel';

export interface WishlistItem {
  wishlist_id: number;
  added_at: string | null;
  hotel: Hotel;
}
