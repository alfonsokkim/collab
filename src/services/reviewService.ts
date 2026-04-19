import { supabase } from '../lib/supabase';

export interface Review {
  id: string;
  reviewerUserId: string;
  reviewedUserId: string;
  rating: number;
  message?: string;
  createdAt: string;
  reviewerName?: string;
  reviewerLogoUrl?: string;
}

export async function fetchReviewsForUser(userId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      id,
      reviewer_user_id,
      reviewed_user_id,
      rating,
      message,
      created_at,
      societies!reviews_reviewer_user_id_fkey (
        name,
        logo_image_url
      )
    `)
    .eq('reviewed_user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return [];

  return (data ?? []).map((r: any) => ({
    id: r.id,
    reviewerUserId: r.reviewer_user_id,
    reviewedUserId: r.reviewed_user_id,
    rating: r.rating,
    message: r.message,
    createdAt: r.created_at,
    reviewerName: r.societies?.name,
    reviewerLogoUrl: r.societies?.logo_image_url,
  }));
}

export async function submitReview(
  reviewedUserId: string,
  rating: number,
  message?: string,
): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not logged in' };
  if (user.id === reviewedUserId) return { success: false, error: 'Cannot review yourself' };

  const { error } = await supabase.from('reviews').upsert(
    { reviewer_user_id: user.id, reviewed_user_id: reviewedUserId, rating, message },
    { onConflict: 'reviewer_user_id,reviewed_user_id' },
  );

  if (error) return { success: false, error: error.message };
  return { success: true };
}
