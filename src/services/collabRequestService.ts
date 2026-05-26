import { supabase } from '../lib/supabase';
import { cacheGet, cacheSet, cacheDelete } from '../lib/cache';

export interface CollabRequest {
  id: string;
  fromUserId: string;
  toListing: { id: string; title: string };
  toUserId: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  fromUserEmail?: string;
  fromSociety?: {
    name: string;
    logoImageUrl?: string;
    instagram?: string;
    discordUrl?: string;
    facebook?: string;
    linkedin?: string;
  };
}

export async function sendCollabRequest(
  listingId: string,
  toUserId: string,
  message?: string,
): Promise<{ success: boolean; error?: string }> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { success: false, error: 'Not authenticated' };

  // Check for a rejected request within the last 24 hours
  const cooldownCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: recentRejection } = await supabase
    .from('collab_requests')
    .select('updated_at')
    .eq('from_user_id', userData.user.id)
    .eq('to_listing_id', listingId)
    .eq('status', 'rejected')
    .gte('updated_at', cooldownCutoff)
    .limit(1)
    .maybeSingle();

  if (recentRejection) {
    const rejectedAt = new Date(recentRejection.updated_at).getTime();
    const availableAt = rejectedAt + 24 * 60 * 60 * 1000;
    const hoursLeft = Math.ceil((availableAt - Date.now()) / (60 * 60 * 1000));
    return { success: false, error: `You were recently rejected for this listing. Try again in ${hoursLeft} hour${hoursLeft === 1 ? '' : 's'}.` };
  }

  const { error } = await supabase.from('collab_requests').insert([
    {
      from_user_id: userData.user.id,
      to_listing_id: listingId,
      to_user_id: toUserId,
      from_user_email: userData.user.email ?? null,
      message: message?.trim() || null,
      status: 'pending',
    },
  ]);
  if (error) { console.error('Error sending collab request:', error); return { success: false, error: 'Failed to send request' }; }
  return { success: true };
}

export async function fetchIncomingRequests(): Promise<CollabRequest[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const cacheKey = `collab_requests:${userData.user.id}`;
  const cached = cacheGet<CollabRequest[]>(cacheKey);
  if (cached) return cached;

  const { data: requests, error } = await supabase
    .from('collab_requests')
    .select('*')
    .eq('to_user_id', userData.user.id)
    .order('created_at', { ascending: false });

  if (error || !requests?.length) return [];

  const fromUserIds = [...new Set(requests.map((r: any) => r.from_user_id))];
  const listingIds = [...new Set(requests.map((r: any) => r.to_listing_id))];

  const [{ data: societies }, { data: listings }] = await Promise.all([
    supabase.from('societies').select('user_id, name, logo_image_url, instagram, discord_url, facebook, linkedin').in('user_id', fromUserIds),
    supabase.from('listings').select('id, title').in('id', listingIds),
  ]);

  const societyMap = new Map((societies || []).map((s: any) => [s.user_id, s]));
  const listingMap = new Map((listings || []).map((l: any) => [l.id, l]));

  const result = requests.map((r: any) => {
    const listing = listingMap.get(r.to_listing_id);
    const society = societyMap.get(r.from_user_id);
    return {
      id: r.id,
      fromUserId: r.from_user_id,
      toListing: { id: r.to_listing_id, title: listing?.title || 'Unknown Listing' },
      toUserId: r.to_user_id,
      message: r.message,
      status: r.status,
      createdAt: r.created_at,
      fromUserEmail: r.from_user_email ?? undefined,
      fromSociety: society
        ? {
            name: society.name,
            logoImageUrl: society.logo_image_url,
            instagram: society.instagram,
            discordUrl: society.discord_url,
            facebook: society.facebook,
            linkedin: society.linkedin,
          }
        : undefined,
    };
  });
  cacheSet(cacheKey, result);
  return result;
}

export async function fetchOutgoingRequestedListingIds(): Promise<Set<string>> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return new Set();
  const { data } = await supabase
    .from('collab_requests')
    .select('to_listing_id')
    .eq('from_user_id', userData.user.id);
  return new Set((data || []).map((r: any) => r.to_listing_id));
}

export async function hasOutgoingRequest(listingId: string): Promise<boolean> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return false;
  const { data } = await supabase
    .from('collab_requests')
    .select('id')
    .eq('from_user_id', userData.user.id)
    .eq('to_listing_id', listingId)
    .limit(1);
  return !!(data && data.length > 0);
}

export async function updateRequestStatus(
  requestId: string,
  status: 'accepted' | 'rejected',
): Promise<boolean> {
  const { data: userData } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('collab_requests')
    .update({ status })
    .eq('id', requestId);
  if (error) { console.error('Error updating request status:', error); return false; }
  if (userData.user) cacheDelete(`collab_requests:${userData.user.id}`);
  return true;
}
