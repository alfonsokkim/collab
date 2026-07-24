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
  initiatedBy: 'applicant' | 'host';
  fromUserEmail?: string;
  fromSociety?: {
    name: string;
    logoImageUrl?: string;
    instagram?: string;
    discordUrl?: string;
    facebook?: string;
    linkedin?: string;
  };
  toSociety?: {
    name: string;
    logoImageUrl?: string;
  };
}

export interface SocietySearchResult {
  userId: string;
  name: string;
  logoImageUrl?: string;
  societyType?: string;
}

// ─── Applicant-initiated (existing flow) ────────────────────────────────────

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
      initiated_by: 'applicant',
    },
  ]);
  if (error) { console.error('Error sending collab request:', error); return { success: false, error: 'Failed to send request' }; }
  return { success: true };
}

// ─── Host-initiated invites ──────────────────────────────────────────────────

export async function sendHostInvite(
  listingId: string,
  toUserId: string,
  message?: string,
): Promise<{ success: boolean; error?: string }> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { success: false, error: 'Not authenticated' };

  // Prevent duplicate pending invites to the same society for the same listing
  const { data: existing } = await supabase
    .from('collab_requests')
    .select('id')
    .eq('from_user_id', userData.user.id)
    .eq('to_listing_id', listingId)
    .eq('to_user_id', toUserId)
    .eq('initiated_by', 'host')
    .eq('status', 'pending')
    .limit(1)
    .maybeSingle();

  if (existing) return { success: false, error: 'Invite already sent to this society' };

  const { error } = await supabase.from('collab_requests').insert([
    {
      from_user_id: userData.user.id,
      to_listing_id: listingId,
      to_user_id: toUserId,
      from_user_email: userData.user.email ?? null,
      message: message?.trim() || null,
      status: 'pending',
      initiated_by: 'host',
    },
  ]);
  if (error) { console.error('Error sending host invite:', error); return { success: false, error: 'Failed to send invite' }; }
  if (userData.user) cacheDelete(`collab_requests:outgoing:${userData.user.id}`);
  return { success: true };
}

export async function rescindRequest(requestId: string): Promise<boolean> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return false;
  const { error } = await supabase
    .from('collab_requests')
    .delete()
    .eq('id', requestId)
    .eq('from_user_id', userData.user.id);
  if (error) { console.error('Error rescinding request:', error); return false; }
  cacheDelete(`collab_requests:outgoing:${userData.user.id}`);
  return true;
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

export async function fetchIncomingRequests(): Promise<CollabRequest[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const cacheKey = `collab_requests:${userData.user.id}`;
  const cached = cacheGet<CollabRequest[]>(cacheKey);
  if (cached) return cached;

  // Incoming = applicant applied to MY listing  OR  host invited ME
  const { data: requests, error } = await supabase
    .from('collab_requests')
    .select('*')
    .or(`to_user_id.eq.${userData.user.id},and(from_user_id.eq.${userData.user.id},initiated_by.eq.host)`)
    .order('created_at', { ascending: false });

  if (error || !requests?.length) return [];

  // For applicant requests: from_user_id is the applicant (show their society)
  // For host invites I sent: to_user_id is the invitee (show their society)
  const applicantIds = [...new Set(
    requests.filter((r: any) => r.initiated_by === 'applicant').map((r: any) => r.from_user_id)
  )];
  const inviteeIds = [...new Set(
    requests.filter((r: any) => r.initiated_by === 'host' && r.from_user_id === userData.user!.id).map((r: any) => r.to_user_id)
  )];
  const allSocietyIds = [...new Set([...applicantIds, ...inviteeIds])];
  const listingIds = [...new Set(requests.map((r: any) => r.to_listing_id))];

  const [{ data: societies }, { data: listings }] = await Promise.all([
    supabase.from('societies').select('user_id, name, logo_image_url, instagram, discord_url, facebook, linkedin').in('user_id', allSocietyIds.length ? allSocietyIds : ['_']),
    supabase.from('listings').select('id, title').in('id', listingIds),
  ]);

  const societyMap = new Map((societies || []).map((s: any) => [s.user_id, s]));
  const listingMap = new Map((listings || []).map((l: any) => [l.id, l]));

  const result: CollabRequest[] = requests
    .filter((r: any) =>
      // incoming: someone applied to my listing
      (r.initiated_by === 'applicant' && r.to_user_id === userData.user!.id) ||
      // incoming: I (as host) sent an invite - show in outgoing, not incoming; filtered below
      false
    )
    .map((r: any) => {
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
        initiatedBy: r.initiated_by,
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

  // Also include host invites WHERE I am the invitee (to_user_id = me, initiated_by = host)
  const invitedToMe = requests.filter((r: any) => r.initiated_by === 'host' && r.to_user_id === userData.user!.id);
  for (const r of invitedToMe) {
    const listing = listingMap.get(r.to_listing_id);
    const hostSociety = societyMap.get(r.from_user_id) || null;
    result.push({
      id: r.id,
      fromUserId: r.from_user_id,
      toListing: { id: r.to_listing_id, title: listing?.title || 'Unknown Listing' },
      toUserId: r.to_user_id,
      message: r.message,
      status: r.status,
      createdAt: r.created_at,
      initiatedBy: 'host',
      fromUserEmail: r.from_user_email ?? undefined,
      fromSociety: hostSociety
        ? { name: hostSociety.name, logoImageUrl: hostSociety.logo_image_url }
        : undefined,
    });
  }

  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  cacheSet(cacheKey, result);
  return result;
}

export async function fetchOutgoingRequests(): Promise<CollabRequest[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const cacheKey = `collab_requests:outgoing:${userData.user.id}`;
  const cached = cacheGet<CollabRequest[]>(cacheKey);
  if (cached) return cached;

  // Outgoing = host invites I sent + applicant requests I submitted
  const { data: requests, error } = await supabase
    .from('collab_requests')
    .select('*')
    .eq('from_user_id', userData.user.id)
    .order('created_at', { ascending: false });

  if (error || !requests?.length) return [];

  const toUserIds = [...new Set(requests.map((r: any) => r.to_user_id))];
  const listingIds = [...new Set(requests.map((r: any) => r.to_listing_id))];

  const [{ data: societies }, { data: listings }] = await Promise.all([
    supabase.from('societies').select('user_id, name, logo_image_url').in('user_id', toUserIds.length ? toUserIds : ['_']),
    supabase.from('listings').select('id, title').in('id', listingIds),
  ]);

  const societyMap = new Map((societies || []).map((s: any) => [s.user_id, s]));
  const listingMap = new Map((listings || []).map((l: any) => [l.id, l]));

  const result: CollabRequest[] = requests.map((r: any) => {
    const listing = listingMap.get(r.to_listing_id);
    const toSociety = societyMap.get(r.to_user_id);
    return {
      id: r.id,
      fromUserId: r.from_user_id,
      toListing: { id: r.to_listing_id, title: listing?.title || 'Unknown Listing' },
      toUserId: r.to_user_id,
      message: r.message,
      status: r.status,
      createdAt: r.created_at,
      initiatedBy: r.initiated_by ?? 'applicant',
      toSociety: toSociety ? { name: toSociety.name, logoImageUrl: toSociety.logo_image_url } : undefined,
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
  if (userData.user) {
    cacheDelete(`collab_requests:${userData.user.id}`);
    cacheDelete(`collab_requests:outgoing:${userData.user.id}`);
  }
  return true;
}

// ─── Society search ───────────────────────────────────────────────────────────

// Cache all societies for fast client-side search
let _societiesCache: SocietySearchResult[] | null = null;
async function getAllSocieties(): Promise<SocietySearchResult[]> {
  if (_societiesCache) return _societiesCache;
  const { data, error } = await supabase
    .from('societies')
    .select('user_id, name, logo_image_url, society_type')
    .limit(500);
  if (error || !data) return [];
  _societiesCache = data.map((s: any) => ({
    userId: s.user_id,
    name: s.name,
    logoImageUrl: s.logo_image_url,
    societyType: s.society_type,
  }));
  return _societiesCache;
}

export async function searchSocieties(query: string): Promise<SocietySearchResult[]> {
  if (!query.trim()) return [];

  const all = await getAllSocieties();

  const needle = query.replace(/\s+/g, '').toLowerCase();

  const matches = (name: string): boolean => {
    // 1. Substring match (spaces stripped): "noc" → "No Code Society" ✓
    if (name.replace(/\s+/g, '').toLowerCase().includes(needle)) return true;

    // 2. Acronym match: first letter of each word - "ncs" → "No Code Society" ✓
    const acronym = name
      .split(/\s+/)
      .map((w) => w[0]?.toLowerCase() ?? '')
      .join('');
    if (acronym.includes(needle)) return true;

    return false;
  };

  return all.filter((s) => matches(s.name)).slice(0, 10);
}
